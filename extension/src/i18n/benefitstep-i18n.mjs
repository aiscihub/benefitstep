// src/i18n/benefitstep-i18n.mjs
// Dependency-free ES module. No storage, network calls, or policy calculations.

export class LanguageError extends Error {
  constructor(code) {
    super(code);
    this.name = "LanguageError";
    this.code = code;
  }
}

const fail = (code) => {
  throw new LanguageError(code);
};

// Entries are [English, Spanish].
// Add new messages by stable key; never translate rule IDs or stored choices.
const TEXT = {
  "app.name": ["BenefitStep", "BenefitStep"],

  "preview.notice": [
    "Development preview. Translations have not been independently reviewed.",
    "Versi\u00f3n de desarrollo. Las traducciones no se han revisado de forma independiente."
  ],

  "nav.quick": ["Quick check", "Consulta inicial"],
  "nav.documents": ["Documents", "Documentos"],
  "nav.confirm": ["Confirm", "Confirmar"],
  "nav.apply": ["Apply", "Solicitar"],

  "action.continue": ["Continue", "Continuar"],
  "action.edit": ["Edit", "Editar"],
  "action.source": ["View source", "Ver documento de origen"],
  "action.add": ["Add documents", "Agregar documentos"],
  "action.confirm": ["Yes, correct", "S\u00ed, es correcto"],
  "action.cancel": ["Cancel", "Cancelar"],
  "action.preview": ["Preview application", "Vista previa de la solicitud"],
  "action.savePdf": ["Save PDF", "Guardar PDF"],

  "answer.yes": ["Yes", "S\u00ed"],
  "answer.no": ["No", "No"],
  "answer.unsure": ["Not sure", "No estoy seguro/a"],

  "privacy.local": [
    "Local preparation. You choose what to share.",
    "Preparaci\u00f3n en su dispositivo. Usted decide qu\u00e9 compartir."
  ],

  "confirm.title": [
    "Is this information correct?",
    "\u00bfEs correcta esta informaci\u00f3n?"
  ],

  "confirm.help": [
    "Edit anything that is wrong.",
    "Edite cualquier dato incorrecto."
  ],

  "question.cfResidence": [
    "Do you live in California?",
    "\u00bfVive en California?"
  ],

  "question.cfHousehold": [
    "Including you, how many people live together and usually buy and prepare food together?",
    "Incluy\u00e9ndose a usted, \u00bfcu\u00e1ntas personas viven juntas y normalmente compran y preparan los alimentos juntas?"
  ],

  "question.cfIncome": [
    "Estimated monthly household income before tax",
    "Ingreso mensual estimado del hogar antes de impuestos"
  ],

  "question.mcAge": [
    "Age group of this person",
    "Grupo de edad de esta persona"
  ],

  "question.mcResidence": [
    "Does this person live in California?",
    "\u00bfVive esta persona en California?"
  ],

  "field.grossPay": ["Gross pay", "Pago bruto"],
  "field.netPay": ["Take-home pay", "Pago neto"],
  "field.yearToDate": [
    "Year-to-date gross earnings",
    "Ingresos brutos acumulados en el a\u00f1o"
  ],
  "field.currentCharges": ["Current charges", "Cargos del per\u00edodo actual"],
  "field.priorBalance": ["Previous unpaid balance", "Saldo anterior pendiente"],
  "field.totalDue": ["Total amount due", "Total adeudado"],

  "rule.caReported": [
    "California residence is reported. No agency verification is implied.",
    "Se ha declarado residencia en California. Esto no significa que una agencia la haya verificado."
  ],

  "rule.residenceReview": [
    "The California residence question needs clarification or an out-of-state route. No fixed address or specified bill is required here.",
    "Es necesario aclarar la residencia en California o consultar una opci\u00f3n fuera del estado. Aqu\u00ed no se exige una direcci\u00f3n fija ni una factura espec\u00edfica."
  ],

  "doctor.unreadable": [
    "We cannot read {field}. Add a clearer copy or enter the information.",
    "No podemos leer {field}. Agregue una copia m\u00e1s clara o ingrese la informaci\u00f3n."
  ],

  "doctor.priorBalance": [
    "The total due includes a previous balance. Current charges: {current}. Previous balance: {previous}.",
    "El total adeudado incluye un saldo anterior. Cargos actuales: {current}. Saldo anterior: {previous}."
  ],

  "doctor.periodMismatch": [
    "This record covers {recordPeriod}. The request concerns {requestedPeriod}.",
    "Este documento corresponde a {recordPeriod}. La solicitud se refiere a {requestedPeriod}."
  ],

  "doctor.changed": [
    "Information changed. Eligibility has not been rechecked.",
    "La informaci\u00f3n cambi\u00f3. No se ha vuelto a evaluar la elegibilidad."
  ],

  "doctor.expenseDifference": [
    "Recorded expenses exceed comparable recorded income by {difference}. Check the periods and explain any remaining difference.",
    "Los gastos registrados superan los ingresos registrados comparables en {difference}. Revise los per\u00edodos y explique cualquier diferencia restante."
  ],

  "language.untranslated": [
    "A translation is not available for this message. The original is shown separately.",
    "No hay una traducci\u00f3n disponible para este mensaje. El original se muestra por separado."
  ],

  "language.review": [
    "Check the proposed translation before using it.",
    "Revise la traducci\u00f3n propuesta antes de utilizarla."
  ],

  "language.unavailable": [
    "Local language processing is unavailable. You can continue with manual entry.",
    "El procesamiento local de idiomas no est\u00e1 disponible. Puede continuar ingresando la informaci\u00f3n manualmente."
  ],

  "pdf.unmapped": [
    "This form-language version has not been mapped and validated.",
    "Esta versi\u00f3n del formulario en el idioma seleccionado a\u00fan no tiene un mapeo validado."
  ],

  "pdf.partial": [
    "Partially filled application. Some items still need attention.",
    "Solicitud parcialmente completada. Algunos datos a\u00fan necesitan atenci\u00f3n."
  ],

  "pdf.unsigned": [
    "Filled application ready for your review and signature.",
    "Solicitud completada, lista para que la revise y firme."
  ]
};

// These are release-review records, not model confidence scores.
// Replace draft statuses only after actual review.
export const CATALOG_REVIEW = Object.freeze({
  en: Object.freeze({ status: "draft", reviewers: Object.freeze([]) }),
  es: Object.freeze({ status: "draft", reviewers: Object.freeze([]) })
});

export function normalizeUiLocale(value) {
  if (typeof value !== "string" || !value.trim()) {
    fail("INVALID_UI_LANGUAGE");
  }

  let language;
  try {
    language = new Intl.Locale(value).language;
  } catch {
    fail("INVALID_UI_LANGUAGE");
  }

  if (language === "en") return "en-US";
  if (language === "es") return "es-US";
  fail("UNSUPPORTED_UI_LANGUAGE");
}

export function message(
  key,
  locale,
  params = {},
  { released = false } = {}
) {
  const normalized = normalizeUiLocale(locale);
  const language = normalized.startsWith("es") ? "es" : "en";

  if (released && CATALOG_REVIEW[language].status !== "approved") {
    fail("CATALOG_REVIEW_REQUIRED");
  }

  if (!Object.hasOwn(TEXT, key)) fail("MISSING_MESSAGE_KEY");

  const template = TEXT[key][language === "es" ? 1 : 0];

  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_, name) => {
    if (!Object.hasOwn(params, name)) fail("MISSING_MESSAGE_PARAMETER");

    const value = params[name];
    if (
      !["string", "number"].includes(typeof value) ||
      (typeof value === "number" && !Number.isFinite(value))
    ) {
      fail("INVALID_MESSAGE_PARAMETER");
    }

    const output = String(value);
    if (output.length > 2000) fail("MESSAGE_PARAMETER_TOO_LONG");
    return output;
  });
}

export function renderMessage(element, key, locale, params = {}) {
  // Never assign translated or extracted content through innerHTML.
  element.textContent = message(key, locale, params);
}

export function createLanguagePreferences() {
  return {
    uiLocale: "en-US",
    formLanguages: {
      calfresh: "en",
      medi_cal: "en"
    },
    agencyCommunication: {
      spokenLanguage: null,
      writtenLanguage: null,
      interpreterRequested: null
    },
    documentLanguages: {}
  };
}

export function changeUiLocale(preferences, value) {
  const next = structuredClone(preferences);
  next.uiLocale = normalizeUiLocale(value);

  // Form preferences, document languages, and agency answers stay unchanged.
  return next;
}

export function formatUsd(cents, locale) {
  if (!Number.isSafeInteger(cents)) fail("INVALID_MONEY_VALUE");

  return new Intl.NumberFormat(normalizeUiLocale(locale), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

export function formatIsoDate(iso, locale) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    fail("INVALID_DATE");
  }

  const date = new Date(`${iso}T12:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== iso
  ) {
    fail("INVALID_DATE");
  }

  return new Intl.DateTimeFormat(normalizeUiLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

// These two codes exist in the supplied CalFresh configuration.
// Add mappings for additional engine codes after reviewing their wording.
const ENGINE_MESSAGE_KEYS = Object.freeze({
  ca_reported: "rule.caReported",
  residence_review: "rule.residenceReview"
});

export function presentFinding(finding, locale, descriptor = null) {
  const key = descriptor?.key ?? ENGINE_MESSAGE_KEYS[finding.code];

  // Keep canonical engine output separate from presentation.
  return {
    canonical: finding,
    presentation: key
      ? {
          text: message(key, locale, descriptor?.params ?? {}),
          locale: normalizeUiLocale(locale),
          untranslated: false
        }
      : {
          text: message("language.untranslated", locale),
          originalText: typeof finding.text === "string" ? finding.text : "",
          originalLocale: "en",
          untranslated: true
        }
  };
}

export function createTemplateSlots() {
  // These are slots for reviewed manifests, not supplied official PDFs.
  return ["cf285", "ccfrm604"].flatMap((formId) =>
    ["en", "es"].map((language) => ({
      formId,
      language,
      template: null,
      map: null
    }))
  );
}

export function selectFormVariant(registry, { formId, language }) {
  // Form language is explicit; do not infer it from the UI locale.
  const matches = registry.filter(
    (item) => item.formId === formId && item.language === language
  );

  if (matches.length === 0) {
    return { status: "form_language_not_registered", canRender: false };
  }

  if (matches.length !== 1) fail("AMBIGUOUS_FORM_VARIANT");

  const variant = matches[0];
  const template = variant.template;
  const map = variant.map;

  if (!template || !map) {
    return {
      status: "template_mapping_review_required",
      canRender: false,
      variant
    };
  }

  const validHash = (value) =>
    typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

  const reviewers = Array.isArray(map.reviewers)
    ? new Set(map.reviewers.filter(
        (id) => typeof id === "string" && id.trim()
      ))
    : new Set();

  const reviewed =
    template.formId === formId &&
    template.language === language &&
    typeof template.edition === "string" &&
    template.edition.length > 0 &&
    validHash(template.sha256) &&
    map.formId === formId &&
    map.language === language &&
    map.edition === template.edition &&
    map.templateSha256 === template.sha256 &&
    validHash(map.sha256) &&
    map.status === "approved" &&
    map.visualValidation === true &&
    Number.isInteger(map.bindingCount) &&
    map.bindingCount > 0 &&
    reviewers.size >= 2;

  return {
    status: reviewed
      ? "ready_for_renderer_byte_validation"
      : "template_mapping_review_required",

    // Registry selection alone NEVER authorizes PDF output.
    // The renderer must validate actual bytes, geometry, protected regions,
    // supported characters, and the confirmed-answer snapshot.
    canRender: false,
    variant
  };
}
