// src/i18n/local-language-models.mjs
import { LanguageError } from "./benefitstep-i18n.mjs";

const fail = (code) => {
  throw new LanguageError(code);
};

function canonicalLanguage(value) {
  if (typeof value !== "string" || !value.trim()) {
    fail("INVALID_LANGUAGE_TAG");
  }

  try {
    return Intl.getCanonicalLocales(value)[0];
  } catch {
    fail("INVALID_LANGUAGE_TAG");
  }
}

function copySource(source) {
  if (
    !source ||
    typeof source.id !== "string" ||
    !source.id.trim() ||
    source.id.length > 128 ||
    !Number.isSafeInteger(source.revision) ||
    source.revision < 0 ||
    typeof source.text !== "string" ||
    !source.text.trim() ||
    source.text.length > 16000
  ) {
    fail("INVALID_TEXT_SOURCE");
  }

  // Allow-list fields; do not retain unrelated metadata.
  return Object.freeze({
    id: source.id,
    revision: source.revision,
    text: source.text,
    kind: source.kind
  });
}

async function bounded(
  operation,
  {
    signals = [],
    timeoutMs = 45000,
    onAbort = () => {}
  } = {}
) {
  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 120000
  ) {
    fail("INVALID_TIMEOUT");
  }

  const upstream = signals.filter(Boolean);

  if (upstream.some((signal) => signal.aborted)) {
    onAbort();
    fail("CANCELLED");
  }

  const controller = new AbortController();
  let timedOut = false;

  const forwardAbort = () => controller.abort();
  for (const signal of upstream) {
    signal.addEventListener("abort", forwardAbort, { once: true });
  }

  const cancelled = new Promise((_, reject) => {
    controller.signal.addEventListener("abort", () => {
      try {
        onAbort();
      } finally {
        reject(new LanguageError(timedOut ? "TIMEOUT" : "CANCELLED"));
      }
    }, { once: true });
  });

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const pending = Promise.resolve().then(() => {
    if (controller.signal.aborted) fail("CANCELLED");
    return operation(controller.signal);
  });

  try {
    return await Promise.race([pending, cancelled]);
  } finally {
    clearTimeout(timer);
    for (const signal of upstream) {
      signal.removeEventListener("abort", forwardAbort);
    }
  }
}

function modelConfiguration(kind, sourceLanguage, targetLanguage) {
  if (kind === "detect") {
    return { apiName: "LanguageDetector", options: {} };
  }

  if (kind !== "translate") fail("UNSUPPORTED_MODEL_KIND");

  const source = canonicalLanguage(sourceLanguage);
  const target = canonicalLanguage(targetLanguage);

  if (source === target) fail("TRANSLATION_NOT_NEEDED");

  return {
    apiName: "Translator",
    options: {
      sourceLanguage: source,
      targetLanguage: target
    }
  };
}

export async function probeLocalModel({
  kind,
  sourceLanguage,
  targetLanguage,
  host = globalThis,
  signal,
  timeoutMs = 10000
}) {
  const config = modelConfiguration(kind, sourceLanguage, targetLanguage);
  const api = host[config.apiName];

  if (
    host.isSecureContext !== true ||
    !api ||
    typeof api.availability !== "function" ||
    typeof api.create !== "function"
  ) {
    return { status: "unavailable", reason: "api_or_context_unavailable" };
  }

  try {
    const status = await bounded(
      () => api.availability(config.options),
      { signals: [signal], timeoutMs }
    );

    if (!["available", "downloadable", "downloading", "unavailable"].includes(status)) {
      return { status: "unavailable", reason: "unknown_api_status" };
    }

    return { status };
  } catch (error) {
    if (error instanceof LanguageError) throw error;
    return { status: "unavailable", reason: "capability_check_failed" };
  }
}

export async function openLocalModel({
  kind,
  sourceLanguage,
  targetLanguage,
  consent = false,
  allowModelDownload = false,
  host = globalThis,
  signal,
  timeoutMs = 45000,
  onProgress = () => {}
}) {
  if (consent !== true) fail("LOCAL_PROCESSING_CONSENT_REQUIRED");

  const config = modelConfiguration(kind, sourceLanguage, targetLanguage);
  const availability = await probeLocalModel({
    kind,
    sourceLanguage,
    targetLanguage,
    host,
    signal,
    timeoutMs
  });

  if (availability.status === "unavailable") fail("MODEL_UNAVAILABLE");

  if (
    availability.status !== "available" &&
    allowModelDownload !== true
  ) {
    fail("MODEL_DOWNLOAD_CONSENT_REQUIRED");
  }

  // Call setup from an actual button click in the extension-owned page.
  if (host.navigator?.userActivation?.isActive !== true) {
    fail("USER_GESTURE_REQUIRED");
  }

  const api = host[config.apiName];
  let instance = null;

  try {
    instance = await bounded(async (setupSignal) => {
      const created = await api.create({
        ...config.options,
        signal: setupSignal,
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            // No document contents or filenames are logged.
            const progress = Number(event.loaded);
            if (Number.isFinite(progress)) {
              try {
                onProgress(Math.max(0, Math.min(1, progress)));
              } catch {
                // A UI progress callback must not leak model resources.
              }
            }
          });
        }
      });

      // A browser implementation may resolve after cancellation.
      if (setupSignal.aborted) {
        created.destroy();
        fail("CANCELLED");
      }

      return created;
    }, {
      signals: [signal],
      timeoutMs,
      onAbort() {
        instance?.destroy();
      }
    });
  } catch (error) {
    instance?.destroy();
    if (error instanceof LanguageError) throw error;
    fail("MODEL_SETUP_FAILED");
  }

  const lifetime = new AbortController();
  let closed = false;
  let busy = false;

  function close() {
    if (closed) return;
    closed = true;
    lifetime.abort();
    instance.destroy();
  }

  async function run(source, options = {}) {
    if (closed) fail("MODEL_CLOSED");
    if (busy) fail("MODEL_BUSY");

    const original = copySource(source);

    // This translation path is for explanatory prose only.
    // Names, IDs, numbers, official policy text, signatures, and consent
    // statements must not be routed through it as interchangeable text.
    if (kind === "translate" && original.kind !== "explanation") {
      fail("TEXT_KIND_NOT_ALLOWED_FOR_TRANSLATION");
    }

    busy = true;

    try {
      const raw = await bounded(
        (operationSignal) => kind === "translate"
          ? instance.translate(original.text, { signal: operationSignal })
          : instance.detect(original.text, { signal: operationSignal }),
        {
          signals: [options.signal, lifetime.signal],
          timeoutMs: options.timeoutMs ?? 45000,
          onAbort: close
        }
      );

      if (closed) fail("CANCELLED");

      if (kind === "translate") {
        if (
          typeof raw !== "string" ||
          !raw.trim() ||
          raw.length > 32000
        ) {
          fail("INVALID_TRANSLATION_OUTPUT");
        }

        return Object.freeze({
          kind: "translation_candidate",
          source: original,
          sourceLanguage: config.options.sourceLanguage,
          targetLanguage: config.options.targetLanguage,
          translatedText: raw,
          status: "needs_confirmation"
        });
      }

      if (!Array.isArray(raw)) fail("INVALID_DETECTION_OUTPUT");

      const candidates = raw.slice(0, 10).flatMap((item) => {
        if (
          typeof item?.detectedLanguage !== "string" ||
          !Number.isFinite(item.confidence) ||
          item.confidence < 0 ||
          item.confidence > 1
        ) {
          return [];
        }

        try {
          return [{
            language: canonicalLanguage(item.detectedLanguage),
            confidence: item.confidence
          }];
        } catch {
          return [];
        }
      });

      return {
        kind: "language_candidates",
        sourceId: original.id,
        sourceRevision: original.revision,
        candidates,
        status: "needs_language_confirmation"

        // A candidate language is not automatically applied to the whole
        // document, the UI, the application, or agency preferences.
      };
    } catch (error) {
      close();

      // Return bounded error codes, not native errors that might contain text.
      if (error instanceof LanguageError) throw error;
      fail("MODEL_OPERATION_FAILED");
    } finally {
      busy = false;
    }
  }

  return Object.freeze({
    kind,
    configuration: Object.freeze({ ...config.options }),
    run,
    close
  });
}

export function confirmTranslation(candidate, currentSource, reviewedText) {
  const current = copySource(currentSource);

  if (
    candidate?.kind !== "translation_candidate" ||
    candidate.status !== "needs_confirmation"
  ) {
    fail("INVALID_TRANSLATION_CANDIDATE");
  }

  if (
    candidate.source.id !== current.id ||
    candidate.source.revision !== current.revision ||
    candidate.source.text !== current.text ||
    candidate.source.kind !== current.kind
  ) {
    fail("STALE_TRANSLATION");
  }

  if (
    typeof reviewedText !== "string" ||
    !reviewedText.trim() ||
    reviewedText.length > 32000
  ) {
    fail("INVALID_REVIEWED_TRANSLATION");
  }

  return Object.freeze({
    ...candidate,
    translatedText: reviewedText,
    status: "confirmed_by_user"

    // This does not mutate the original fact, sign a form, or authorize export.
  });
}
