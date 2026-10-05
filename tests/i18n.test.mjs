// tests/i18n.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import {
  message,
  createLanguagePreferences,
  changeUiLocale,
  formatUsd,
  formatIsoDate,
  presentFinding,
  createTemplateSlots,
  selectFormVariant
} from "../extension/src/i18n/benefitstep-i18n.mjs";

import {
  openLocalModel,
  confirmTranslation
} from "../extension/src/i18n/local-language-models.mjs";

const hasCode = (code) => (error) => error?.code === code;

function mockHost({
  status = "available",
  translate = async () => "Mis ingresos cambiaron.",
  detect = async () => [{ detectedLanguage: "es", confidence: 0.97 }]
} = {}) {
  const counters = { created: 0, destroyed: 0 };

  const api = {
    availability: async () => status,
    create: async () => {
      counters.created += 1;
      return {
        translate,
        detect,
        destroy() {
          counters.destroyed += 1;
        }
      };
    }
  };

  return {
    host: {
      isSecureContext: true,
      navigator: { userActivation: { isActive: true } },
      Translator: api,
      LanguageDetector: api
    },
    counters
  };
}

const source = {
  id: "fictional-explanation-1",
  revision: 1,
  kind: "explanation",
  text: "My income changed."
};

test("English and Spanish messages are selected by locale", () => {
  assert.equal(message("action.edit", "en-US"), "Edit");
  assert.equal(message("action.edit", "es-MX"), "Editar");
});

test("UI language changes do not change agency or form preferences", () => {
  const original = createLanguagePreferences();
  const next = changeUiLocale(original, "es-MX");

  assert.equal(next.uiLocale, "es-US");
  assert.equal(original.uiLocale, "en-US");
  assert.deepEqual(next.formLanguages, original.formLanguages);
  assert.deepEqual(next.agencyCommunication, original.agencyCommunication);
});

test("unknown UI languages fail explicitly", () => {
  assert.throws(
    () => message("action.edit", "zh-Hans"),
    hasCode("UNSUPPORTED_UI_LANGUAGE")
  );
});

test("missing message parameters are not silently discarded", () => {
  assert.throws(
    () => message("doctor.unreadable", "en-US"),
    hasCode("MISSING_MESSAGE_PARAMETER")
  );
});

test("unreviewed catalogs cannot be used in released mode", () => {
  assert.throws(
    () => message("action.edit", "es-US", {}, { released: true }),
    hasCode("CATALOG_REVIEW_REQUIRED")
  );
});

test("formatting does not change canonical amounts or dates", () => {
  const cents = 123450;
  assert.equal(typeof formatUsd(cents, "es-US"), "string");
  assert.equal(cents, 123450);
  assert.equal(typeof formatIsoDate("2026-10-05", "es-US"), "string");

  assert.throws(
    () => formatIsoDate("2026-02-30", "en-US"),
    hasCode("INVALID_DATE")
  );
});

test("localized findings retain the original engine record", () => {
  const finding = {
    code: "ca_reported",
    status: "reported_condition_met",
    text: "California residence is reported."
  };

  const before = structuredClone(finding);
  const result = presentFinding(finding, "es-US");

  assert.deepEqual(finding, before);
  assert.equal(result.canonical.status, "reported_condition_met");
  assert.equal(result.presentation.untranslated, false);
});

test("unmapped engine messages are explicitly untranslated", () => {
  const result = presentFinding({
    code: "a_new_rule",
    text: "Original rule explanation."
  }, "es-US");

  assert.equal(result.presentation.untranslated, true);
  assert.equal(
    result.presentation.originalText,
    "Original rule explanation."
  );
});

test("Spanish form selection never silently chooses English", () => {
  const registry = createTemplateSlots();

  const selected = selectFormVariant(registry, {
    formId: "cf285",
    language: "es"
  });

  assert.equal(selected.variant.language, "es");
  assert.equal(selected.canRender, false);
  assert.equal(selected.status, "template_mapping_review_required");

  const missing = selectFormVariant(
    registry.filter((item) => item.language === "en"),
    { formId: "cf285", language: "es" }
  );

  assert.equal(missing.status, "form_language_not_registered");
});

test("model downloads need explicit consent", async () => {
  const { host, counters } = mockHost({ status: "downloadable" });

  await assert.rejects(openLocalModel({
    kind: "translate",
    sourceLanguage: "en",
    targetLanguage: "es",
    consent: true,
    allowModelDownload: false,
    host
  }), hasCode("MODEL_DOWNLOAD_CONSENT_REQUIRED"));

  assert.equal(counters.created, 0);
});

test("translation preserves source and starts unconfirmed", async () => {
  const { host, counters } = mockHost();

  const model = await openLocalModel({
    kind: "translate",
    sourceLanguage: "en",
    targetLanguage: "es",
    consent: true,
    host
  });

  const candidate = await model.run(source);

  assert.deepEqual(candidate.source, source);
  assert.equal(candidate.status, "needs_confirmation");

  const confirmed = confirmTranslation(
    candidate,
    source,
    candidate.translatedText
  );

  assert.equal(confirmed.status, "confirmed_by_user");
  assert.equal(source.text, "My income changed.");

  model.close();
  assert.equal(counters.destroyed, 1);
});

test("a changed source invalidates its translation", async () => {
  const { host } = mockHost();

  const model = await openLocalModel({
    kind: "translate",
    sourceLanguage: "en",
    targetLanguage: "es",
    consent: true,
    host
  });

  const candidate = await model.run(source);

  assert.throws(() => confirmTranslation(
    candidate,
    { ...source, revision: 2 },
    candidate.translatedText
  ), hasCode("STALE_TRANSLATION"));

  model.close();
});

test("structured identifiers cannot use the explanation translator", async () => {
  const { host } = mockHost();

  const model = await openLocalModel({
    kind: "translate",
    sourceLanguage: "en",
    targetLanguage: "es",
    consent: true,
    host
  });

  await assert.rejects(
    model.run({ ...source, kind: "identifier" }),
    hasCode("TEXT_KIND_NOT_ALLOWED_FOR_TRANSLATION")
  );

  model.close();
});

test("operation timeout closes the model", async () => {
  const { host, counters } = mockHost({
    translate: () => new Promise(() => {})
  });

  const model = await openLocalModel({
    kind: "translate",
    sourceLanguage: "en",
    targetLanguage: "es",
    consent: true,
    host
  });

  await assert.rejects(
    model.run(source, { timeoutMs: 10 }),
    hasCode("TIMEOUT")
  );

  assert.equal(counters.destroyed, 1);
});

test("language detection does not change preferences", async () => {
  const { host } = mockHost();
  const preferences = createLanguagePreferences();
  const before = structuredClone(preferences);

  const model = await openLocalModel({
    kind: "detect",
    consent: true,
    host
  });

  const result = await model.run({
    ...source,
    kind: "document_text",
    text: "Este documento contiene informaci\u00f3n de ingresos."
  });

  assert.equal(result.kind, "language_candidates");
  assert.equal(result.status, "needs_language_confirmation");
  assert.deepEqual(preferences, before);

  model.close();
});
