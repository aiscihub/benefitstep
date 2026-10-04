(function(){const modules={"./engine.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_VERSION = void 0;
exports.stableStringify = stableStringify;
exports.createEngine = createEngine;
const validation_js_1 = require("./validation.js");
const package_doctor_js_1 = require("./package-doctor.js");
exports.ENGINE_VERSION = '0.1.0';
const uniq = (v) => [...new Set(v)];
const known = (value, factIds = [], sourceIds = []) => ({ known: true, value, missing: [], reasons: [], factIds, sourceIds });
const unknown = (missing = [], reasons = [], cells = []) => ({ known: false, missing: uniq([...missing, ...cells.flatMap(c => c.missing)]), reasons: uniq([...reasons, ...cells.flatMap(c => c.reasons)]), factIds: uniq(cells.flatMap(c => c.factIds)), sourceIds: uniq(cells.flatMap(c => c.sourceIds)) });
const within = (date, w) => w.from <= date && date <= w.through;
function stableStringify(value) {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value);
    if (Array.isArray(value))
        return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}
function createEngine(original) {
    (0, validation_js_1.validateBundle)(original);
    // Private copy prevents caller mutation from silently changing a running policy version.
    const bundle = JSON.parse(JSON.stringify(original));
    const questionByKey = new Map(bundle.questions.map(q => [q.factKey, q]));
    const tableById = new Map(bundle.tables.map(t => [t.id, t]));
    function evaluate(input, options = {}) {
        (0, validation_js_1.validateInput)(input, bundle);
        const mode = options.mode ?? 'preview';
        (0, validation_js_1.assert)(['preview', 'released'].includes(mode), 'Invalid runtime mode');
        if (mode === 'released')
            (0, validation_js_1.assert)(bundle.release.status === 'approved' && new Set(bundle.release.reviewers).size >= 2, 'POLICY_NOT_RELEASED: independently review and release this configuration before consumer use');
        const limit = options.maxQuestions ?? 3;
        (0, validation_js_1.assert)(Number.isInteger(limit) && limit >= 1 && limit <= 50, 'Invalid question limit');
        const factById = new Map(input.facts.map(f => [f.id, f]));
        const rawIndex = new Map();
        for (const f of input.facts) {
            const k = `${f.subject}|${f.key}`;
            rawIndex.set(k, [...(rawIndex.get(k) ?? []), f]);
        }
        const personById = new Map(input.people.map(p => [p.id, p]));
        const traceCache = new Map();
        const resolving = new Set();
        function read(key, subject, program, minTrust = 'reported') {
            const k = `${subject}|${key}`;
            const ck = `${program}:${k}:${minTrust}`;
            if (traceCache.has(ck))
                return traceCache.get(ck);
            if (resolving.has(ck))
                return unknown([], ['derivation_cycle']);
            const q = questionByKey.get(key);
            if (!q.programs.includes(program))
                return unknown([], [`wrong_program:${key}`]);
            if (q.scope === 'person' && !personById.get(subject)?.appliesFor.includes(program) && q.sensitivity)
                return unknown([], [`nonapplicant:${k}`]);
            if (q.sensitivity && !personById.get(subject)?.sensitiveConsent?.includes(q.sensitivity))
                return unknown([k], [`consent_required:${q.sensitivity}`]);
            const matching = (rawIndex.get(k) ?? []).filter(f => f.programs.includes(program) && within(input.asOf, { from: f.validFrom, through: f.validThrough }));
            let result;
            if (!matching.length) {
                result = unknown([k], ['missing_or_out_of_period']);
                resolving.add(ck);
                for (const d of bundle.derivations ?? [])
                    if (d.program === program && d.key === key) {
                        const c = expression(d.when, subject, program, minTrust);
                        if (!c.known) {
                            result = c;
                            break;
                        }
                        if (c.value === true) {
                            const v = expression(d.value, subject, program, minTrust);
                            result = { ...v, factIds: uniq([...c.factIds, ...v.factIds]), sourceIds: uniq([...c.sourceIds, ...v.sourceIds, ...d.sourceIds]) };
                            break;
                        }
                    }
                resolving.delete(ck);
            }
            else if (matching.some(f => f.status !== 'known'))
                result = unknown([k], uniq(matching.filter(f => f.status !== 'known').map(f => f.status)), matching.map(f => known(null, [f.id])));
            else if (uniq(matching.map(f => stableStringify(f.value))).length !== 1)
                result = unknown([k], ['conflicting_active_facts'], matching.map(f => known(null, [f.id])));
            else if (matching.some(f => (minTrust === 'confirmed' || f.origin !== 'user') && f.confirmedRevision !== f.revision))
                result = unknown([k], ['confirmation_required'], matching.map(f => known(null, [f.id])));
            else if (matching.some(f => !dependenciesValid(f, new Set())))
                result = unknown([k], ['stale_or_cyclic_dependency'], matching.map(f => known(null, [f.id])));
            else {
                const value = matching[0].value;
                // Reference bands are contextual answers, not reusable amounts after household/table changes.
                if (value && typeof value === 'object' && !Array.isArray(value) && 'referenceId' in value && value.referenceId) {
                    const table = tableById.get(value.referenceId);
                    const sizeFact = (rawIndex.get(`household:${program}|${program === 'calfresh' ? 'cf.household_size_estimate' : 'mc.unused'}`) ?? []).filter(f => f.status === 'known' && f.programs.includes(program) && within(input.asOf, { from: f.validFrom, through: f.validThrough }));
                    if (key !== 'cf.monthly_income_range' || value.referenceId !== 'cf_mce_2026_10' || !table || !within(input.asOf, table) || sizeFact.length !== 1 || sizeFact[0].value !== value.householdSize)
                        result = unknown([k], ['stale_reference_band'], matching.map(f => known(null, [f.id])));
                    else
                        result = known(value, matching.map(f => f.id));
                }
                else
                    result = known(value, matching.map(f => f.id));
            }
            traceCache.set(ck, result);
            return result;
        }
        function dependenciesValid(f, seen) {
            if (seen.has(f.id))
                return false;
            seen.add(f.id);
            for (const dep of f.dependencies ?? []) {
                const parent = factById.get(dep.id);
                if (!parent || parent.revision !== dep.revision || parent.status !== 'known' || parent.confirmedRevision !== parent.revision || !within(input.asOf, { from: parent.validFrom, through: parent.validThrough }) || !f.programs.every(p => parent.programs.includes(p)) || !dependenciesValid(parent, new Set(seen)))
                    return false;
            }
            return true;
        }
        function expression(e, subject, program, inheritedTrust = 'reported') {
            if ('literal' in e)
                return known(e.literal);
            if ('fact' in e)
                return read(e.fact, e.scope === 'household' ? `household:${program}` : subject, program, inheritedTrust === 'confirmed' ? 'confirmed' : e.minTrust);
            if ('context' in e)
                return known(input[e.context]);
            const args = e.args.map(a => expression(a, subject, program, inheritedTrust));
            const facts = uniq(args.flatMap(a => a.factIds)), sources = uniq(args.flatMap(a => a.sourceIds));
            const finish = (v) => known(v, facts, sources);
            if (e.op === 'exists')
                return finish(args[0].known);
            if (e.op === 'and' || e.op === 'or') {
                // Three-valued logic: false AND unknown = false; true OR unknown = true.
                const decisive = args.find(a => a.known && a.value === (e.op === 'or'));
                if (decisive)
                    return known(e.op === 'or', decisive.factIds, decisive.sourceIds);
                if (args.some(a => !a.known))
                    return unknown([], [], args);
                if (args.some(a => typeof a.value !== 'boolean'))
                    return unknown([], ['type_error:boolean_operator'], args);
                return finish(e.op === 'and');
            }
            if (args.some(a => !a.known))
                return unknown([], [], args);
            const v = args.map(a => a.value);
            const a = v[0], b = v[1];
            if (e.op === 'not')
                return typeof a === 'boolean' ? finish(!a) : unknown([], ['type_error:not'], args);
            if (e.op === 'eq' || e.op === 'ne')
                return finish((stableStringify(a) === stableStringify(b)) === (e.op === 'eq'));
            if (e.op === 'in')
                return Array.isArray(b) ? finish(b.some(x => x === a)) : unknown([], ['type_error:in'], args);
            if (e.op === 'table') {
                const t = tableById.get(e.table);
                if (!within(input.asOf, t))
                    return unknown([], [`stale_table:${t.id}`], args);
                if (typeof a !== 'number' || !Number.isInteger(a))
                    return unknown([], ['invalid_table_row'], args);
                let amount = t.rows[String(a)];
                if (amount === undefined && t.incrementAfter && a > t.incrementAfter.row && a <= t.incrementAfter.maximumRow)
                    amount = t.rows[String(t.incrementAfter.row)] + (a - t.incrementAfter.row) * t.incrementAfter.amount;
                if (amount === undefined)
                    return unknown([], [`unsupported_table_row:${a}`], args);
                return known(amount, facts, uniq([...sources, ...t.sourceIds]));
            }
            if (e.op === 'interval_lte' || e.op === 'interval_gt') {
                if (!a || typeof a !== 'object' || Array.isArray(a) || typeof b !== 'number')
                    return unknown([], ['type_error:interval'], args);
                const r = a;
                const yes = r.max !== null && r.max <= b;
                const no = r.min > b;
                if (!yes && !no)
                    return unknown([], ['interval_crosses_reference'], args);
                return finish(e.op === 'interval_lte' ? yes : no);
            }
            if (e.op === 'interval_add') {
                if (!a || typeof a !== 'object' || Array.isArray(a) || typeof b !== 'number')
                    return unknown([], ['type_error:interval_add'], args);
                const r = a;
                return finish({ min: r.min + b, max: r.max === null ? null : r.max + b });
            }
            if (e.op === 'date_years_before') {
                if (typeof a !== 'string' || typeof b !== 'number')
                    return unknown([], ['type_error:date'], args);
                const [year, month, day] = a.split('-').map(Number);
                let date = new Date(Date.UTC(year - b, month - 1, day));
                if (date.getUTCMonth() !== month - 1)
                    date = new Date(Date.UTC(year - b, month, 0));
                return finish(date.toISOString().slice(0, 10));
            }
            if (['lt', 'lte', 'gt', 'gte'].includes(e.op)) {
                if (typeof a !== typeof b || !(typeof a === 'number' || typeof a === 'string'))
                    return unknown([], ['type_error:comparison'], args);
                if (e.op === 'lt')
                    return finish(a < b);
                if (e.op === 'lte')
                    return finish(a <= b);
                if (e.op === 'gt')
                    return finish(a > b);
                return finish(a >= b);
            }
            if (v.some(x => typeof x !== 'number'))
                return unknown([], ['type_error:arithmetic'], args);
            const nums = v;
            let n;
            if (e.op === 'add')
                n = nums.reduce((s, x) => s + x, 0);
            else if (e.op === 'subtract')
                n = nums[0] - nums[1];
            else if (e.op === 'multiply_ratio') {
                if (nums[2] <= 0)
                    return unknown([], ['division_by_zero'], args);
                if (!nums.every(Number.isSafeInteger))
                    return unknown([], ['unsafe_arithmetic'], args);
                const product = BigInt(nums[0]) * BigInt(nums[1]), denom = BigInt(nums[2]);
                const q = product / denom + (product > 0n && product % denom !== 0n ? 1n : 0n);
                n = Number(q);
            }
            else
                return unknown([], ['unsupported_operation'], args);
            return Number.isSafeInteger(n) ? finish(n) : unknown([], ['unsafe_arithmetic'], args);
        }
        function runRule(r, subject, program) {
            const base = { ruleId: r.id, dimension: r.dimension, importance: r.importance, subject, program, sourceIds: r.sourceIds, usedFactIds: [], missingKeys: [], reasons: [], computed: {}, implementation: r.implementation };
            const missing = (c) => ({ ...base, status: c.reasons.some(x => x.startsWith('stale_table')) ? 'stale_policy' : 'needs_information', code: 'unresolved_inputs', text: 'More information is needed for this specific check.', action: 'provide_or_defer_details', missingKeys: c.missing, reasons: c.reasons, usedFactIds: c.factIds, sourceIds: uniq([...r.sourceIds, ...c.sourceIds]) });
            if (r.window && !within(input.asOf, r.window))
                return { ...base, status: 'stale_policy', code: 'rule_outside_window', text: 'This rule does not cover the requested date.', action: 'request_policy_review' };
            let pre = known(true);
            if (r.when) {
                pre = expression(r.when, subject, program);
                if (!pre.known)
                    return missing(pre);
                if (pre.value !== true)
                    return null;
            }
            let out = r.otherwise;
            const used = [pre];
            for (const branch of r.branches) {
                const c = expression(branch.when, subject, program);
                used.push(c);
                if (!c.known)
                    return missing(unknown([], [], used));
                if (c.value === true) {
                    out = branch.then;
                    break;
                }
            }
            const computed = {};
            for (const [key, expr] of Object.entries(out.computed ?? {})) {
                const c = expression(expr, subject, program);
                used.push(c);
                if (!c.known)
                    return missing(unknown([], [], used));
                computed[key] = c.value;
            }
            return { ...base, ...out, computed, sourceIds: uniq([...r.sourceIds, ...used.flatMap(c => c.sourceIds)]), usedFactIds: uniq(used.flatMap(c => c.factIds)) };
        }
        const results = [];
        const requiredActions = [];
        for (const program of input.selectedPrograms) {
            const p = bundle.benefits.find(p => p.id === program);
            const active = within(input.asOf, p.supportedWindow);
            const findings = [];
            if (!active) {
                findings.push({ ruleId: 'runtime.date_guard', dimension: 'policy_version', importance: 'GATE', subject: `household:${program}`, program, sourceIds: p.sourceIds, usedFactIds: [], missingKeys: [], reasons: ['outside_supported_policy_window'], computed: {}, implementation: 'executable', status: 'stale_policy', code: 'policy_outside_window', text: 'No current automated checks are provided for this date. Preparation and the official application remain available.', action: 'request_policy_review' });
            }
            else {
                if (!input.people.some(x => x.appliesFor.includes(program)) && p.rules.some(r => r.scope === 'applicant' && r.stages.includes(input.stage)))
                    requiredActions.push({ program, subject: `household:${program}`, code: 'choose_applicants', text: p.rosterPrompt });
                for (const r of [...p.rules].sort((a, b) => a.priority - b.priority))
                    if (r.stages.includes(input.stage)) {
                        const subjects = r.scope === 'household' ? [`household:${program}`] : input.people.filter(x => x.appliesFor.includes(program)).map(p => p.id);
                        for (const subject of subjects) {
                            const f = runRule(r, subject, program);
                            if (f)
                                findings.push(f);
                        }
                    }
            }
            const notAssessed = p.dimensions.filter(d => !findings.some(f => f.dimension === d.id && f.implementation === 'executable' && !['needs_information', 'needs_review', 'stale_policy', 'deferred', 'pathway_to_review'].includes(f.status))).map(d => d.id);
            const status = !active ? 'policy_unavailable' : findings.some(f => f.status === 'needs_information') || requiredActions.some(a => a.program === program) ? 'needs_more_information' : findings.some(f => ['needs_review', 'pathway_to_review', 'above_reference', 'stale_policy', 'deferred'].includes(f.status)) || notAssessed.length ? 'needs_review' : 'limited_checks_complete';
            results.push({ program, status, findings, notAssessed, fullEligibilityImplemented: false, coverage: p.dimensions.map(d => ({ dimension: d.id, coverage: d.coverage })), canContinuePreparation: true, canOpenOfficialApplication: true, officialApplication: p.officialApplication });
        }
        const pending = new Map();
        const blocks = new Set();
        for (const result of results)
            for (const f of result.findings)
                for (const raw of f.missingKeys) {
                    const [subject, key] = raw.split('|');
                    const q = questionByKey.get(key);
                    if (!q)
                        continue;
                    const requestKey = `${subject}|${key}`;
                    let existing = pending.get(requestKey);
                    if (!existing) {
                        existing = { ...q, subject, forPrograms: [], justifiedBy: [], sourceIds: [], suggestedEvidence: q.evidenceCategory ?? [] };
                        pending.set(requestKey, existing);
                    }
                    existing.forPrograms = uniq([...existing.forPrograms, result.program]);
                    existing.justifiedBy = uniq([...existing.justifiedBy, f.ruleId]);
                    existing.sourceIds = uniq([...existing.sourceIds, ...f.sourceIds]);
                    const activeFacts = (rawIndex.get(raw) ?? []).filter(x => x.programs.includes(result.program) && within(input.asOf, { from: x.validFrom, through: x.validThrough }));
                    if (!q.uiCollect || activeFacts.some(x => ['declined', 'deferred'].includes(x.status)) || (q.sensitivity && !personById.get(subject)?.sensitiveConsent?.includes(q.sensitivity)))
                        blocks.add(requestKey);
                }
        const ordered = [...pending.entries()].sort((a, b) => a[1].priority - b[1].priority || a[0].localeCompare(b[0]));
        for (const [key, q] of ordered)
            if (blocks.has(key))
                for (const program of q.forPrograms)
                    requiredActions.push({ program, subject: q.subject, code: !q.uiCollect ? 'prepare_derived_fact' : q.sensitivity && !personById.get(q.subject)?.sensitiveConsent?.includes(q.sensitivity) ? 'optional_sensitive_review' : 'deferred_answer', text: q.preparationAction ?? 'This detail remains unresolved. Continue preparation or answer directly with the county.' });
        const evaluation = { engineVersion: exports.ENGINE_VERSION, policyBundle: bundle.id, policyVersion: bundle.version, asOf: input.asOf, stage: input.stage, mode, authoritative: false, approvalPrediction: null, results, nextQuestions: ordered.filter(([k]) => !blocks.has(k)).slice(0, limit).map(([, q]) => q), blockedQuestions: ordered.filter(([k]) => blocks.has(k)).map(([, q]) => q), requiredActions, packageIssues: (0, package_doctor_js_1.checkPackage)(input), warnings: [mode === 'preview' ? 'Research configuration: executable checks, not independently approved production policy.' : 'Only the released, bounded checks were evaluated.', 'No overall eligibility, document authenticity, county acceptance, treatment coverage, or approval prediction is determined.', 'Do not use a missing document or an unresolved check to hide the official application route.'] };
        return JSON.parse(JSON.stringify(evaluation));
    }
    return { evaluate, describe: () => JSON.parse(JSON.stringify(bundle)) };
}

},"./facts.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmFacts = confirmFacts;
exports.reviseFact = reviseFact;
exports.snapshot = snapshot;
exports.compareSnapshots = compareSnapshots;
exports.createTransferIntent = createTransferIntent;
exports.transferIntentIsCurrent = transferIntentIsCurrent;
const validation_js_1 = require("./validation.js");
const engine_js_1 = require("./engine.js");
/** One UI confirmation operates on explicitly displayed fact ids/revisions. */
function confirmFacts(input, displayed) {
    const m = new Map(displayed.map(x => [x.id, x.revision]));
    (0, validation_js_1.assert)(m.size === displayed.length, 'Duplicate confirmation');
    for (const x of displayed) {
        const f = input.facts.find(f => f.id === x.id);
        (0, validation_js_1.assert)(f && f.revision === x.revision && f.status === 'known', 'Stale or unresolved confirmation');
    }
    return { ...input, facts: input.facts.map(f => m.has(f.id) ? { ...f, confirmedRevision: f.revision } : f) };
}
function reviseFact(input, id, update) {
    (0, validation_js_1.assert)(input.facts.some(f => f.id === id), 'Fact not found');
    return { ...input, facts: input.facts.map(f => { if (f.id !== id)
            return f; const next = { ...f, ...update, revision: f.revision + 1 }; delete next.confirmedRevision; if (update.status !== 'known')
            delete next.value; return next; }) };
}
function snapshot(input, policyVersion, recordedAt) {
    return JSON.parse(JSON.stringify({ schemaVersion: '1.0', recordedAt, asOf: input.asOf, policyVersion, selectedPrograms: input.selectedPrograms, people: input.people, facts: input.facts.filter(f => f.status === 'known' && f.confirmedRevision === f.revision) }));
}
function compareSnapshots(previous, current) {
    const old = new Map(previous.facts.map((f) => [`${f.subject}|${f.key}`, f]));
    const changes = current.facts.filter((f) => (0, engine_js_1.stableStringify)(old.get(`${f.subject}|${f.key}`)) !== (0, engine_js_1.stableStringify)(f)).map((f) => ({ key: f.key, subject: f.subject, kind: old.has(`${f.subject}|${f.key}`) ? 'changed' : 'added' }));
    const currentKeys = new Set(current.facts.map((f) => `${f.subject}|${f.key}`));
    for (const [key, f] of old)
        if (!currentKeys.has(key))
            changes.push({ key: f.key, subject: f.subject, kind: 'removed' });
    return { policyChanged: previous.policyVersion !== current.policyVersion, changes, message: 'Information changed. Re-run each selected program separately; this is not a loss-of-eligibility decision.' };
}
/** Detect changes after transfer preview; authorization itself stays in the UI. */
function createTransferIntent(input, selectedIds) {
    const chosen = input.facts.filter(f => selectedIds.includes(f.id));
    (0, validation_js_1.assert)(new Set(selectedIds).size === selectedIds.length && chosen.length === selectedIds.length, 'Invalid selected fact ids');
    (0, validation_js_1.assert)(chosen.every(f => f.status === 'known' && f.confirmedRevision === f.revision), 'Only confirmed facts can be selected');
    return { factVersions: chosen.map(f => ({ id: f.id, revision: f.revision })), basis: (0, engine_js_1.stableStringify)(input), kind: 'local_transfer_preview' };
}
function transferIntentIsCurrent(input, intent) {
    return (0, engine_js_1.stableStringify)(input) === intent.basis && intent.factVersions.every(v => input.facts.some(f => f.id === v.id && f.revision === v.revision && f.confirmedRevision === v.revision && f.status === 'known'));
}

},"./forms.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareForm = prepareForm;
exports.chooseForms = chooseForms;
/** Form preparation is independent of eligibility. Only explicit, confirmed answers are exported. */
const validation_js_1 = require("./validation.js");
function prepareForm(inventory, mapping, data) {
    (0, validation_js_1.safeData)(inventory);
    (0, validation_js_1.safeData)(mapping);
    (0, validation_js_1.safeData)(data);
    (0, validation_js_1.assert)(data.schemaVersion === '1.0' && mapping.schemaVersion === '1.0', 'Unsupported form schema');
    (0, validation_js_1.assert)(data.formId === inventory.id && mapping.formId === inventory.id, 'Wrong form mapping');
    (0, validation_js_1.assert)(mapping.expectedPageCount === inventory.pageCount, 'Wrong page count in mapping');
    (0, validation_js_1.assert)(Array.isArray(data.answers) && data.answers.length <= 10000 && Array.isArray(data.groups), 'Invalid form answer arrays');
    (0, validation_js_1.assert)(Number.isSafeInteger(data.revision) && data.revision >= 1, 'Invalid application revision');
    const groups = new Map(inventory.groups.map(g => [g.id, g]));
    const groupStates = new Map();
    for (const g of data.groups) {
        (0, validation_js_1.assert)(groups.has(g.groupId) && !groupStates.has(g.groupId), 'Unknown or repeated group');
        (0, validation_js_1.assert)(['applicable', 'not_applicable', 'deferred'].includes(g.status), 'Invalid group state');
        (0, validation_js_1.assert)(Number.isSafeInteger(g.rowCount) && g.rowCount >= 0 && g.rowCount <= 100, 'Invalid row count');
        (0, validation_js_1.assert)(Number.isSafeInteger(g.revision) && g.revision >= 1, 'Invalid group revision');
        (0, validation_js_1.assert)(g.confirmedRevision === undefined || g.confirmedRevision === g.revision, 'Stale group confirmation');
        groupStates.set(g.groupId, g);
    }
    const key = (g, row, f) => `${g}|${row}|${f}`;
    const answers = new Map();
    for (const a of data.answers) {
        const g = groups.get(a.groupId);
        (0, validation_js_1.assert)(g && g.fields.some(f => f.key === a.field), 'Unknown form question');
        (0, validation_js_1.assert)(!g.manualOnly, 'Manual signature/certification fields cannot be filled');
        (0, validation_js_1.assert)(Number.isSafeInteger(a.row) && a.row >= 0 && a.row < 100, 'Invalid answer row');
        (0, validation_js_1.assert)(!answers.has(key(a.groupId, a.row, a.field)), 'Duplicate form answer');
        (0, validation_js_1.assert)(['answered', 'not_applicable', 'deferred', 'unknown'].includes(a.status), 'Invalid answer status');
        (0, validation_js_1.assert)(Number.isSafeInteger(a.revision) && a.revision >= 1, 'Invalid answer revision');
        (0, validation_js_1.assert)(a.confirmedRevision === undefined || a.confirmedRevision === a.revision, 'Stale answer confirmation');
        (0, validation_js_1.assert)(Array.isArray(a.sourceIds) && a.sourceIds.every(s => typeof s === 'string'), 'Answer provenance required');
        if (a.status === 'answered') {
            const f = g.fields.find(f => f.key === a.field);
            (0, validation_js_1.assert)(f.type === 'bool' ? typeof a.value === 'boolean' : typeof a.value === 'string', 'Wrong form answer type');
            if (typeof a.value === 'string')
                (0, validation_js_1.assert)(a.value.trim().length > 0 && a.value.length <= 4000, 'Blank/overlong form answer');
        }
        else
            (0, validation_js_1.assert)(a.value === undefined, 'Unresolved form answer retains a value');
        answers.set(key(a.groupId, a.row, a.field), a);
    }
    const bindings = new Map();
    const bindingSeen = new Set();
    for (const b of mapping.bindings) {
        const g = groups.get(b.groupId);
        (0, validation_js_1.assert)(g && !g.manualOnly && g.fields.some(f => f.key === b.field), 'Binding targets unknown/manual field');
        (0, validation_js_1.assert)(Number.isInteger(b.page) && b.page >= 1 && b.page <= inventory.pageCount, 'Binding page invalid');
        (0, validation_js_1.assert)(Number.isInteger(b.row) && b.row >= 0 && b.row < g.printedCapacity, 'Binding row invalid');
        (0, validation_js_1.assert)(['text', 'checkbox', 'choice'].includes(b.kind), 'Binding kind invalid');
        (0, validation_js_1.assert)(b.rect.length === 4 && b.rect.every(n => Number.isFinite(n) && n >= 0) && b.rect[2] > b.rect[0] && b.rect[3] > b.rect[1], 'Binding rectangle invalid');
        const k = key(b.groupId, b.row, b.field);
        const occurrence = k + '|' + b.page + '|' + b.rect.join(',');
        (0, validation_js_1.assert)(!bindingSeen.has(occurrence), 'Duplicate binding');
        bindingSeen.add(occurrence);
        bindings.set(k, [...(bindings.get(k) ?? []), b]);
        for (const z of mapping.protectedRegions)
            if (z.page === b.page)
                (0, validation_js_1.assert)(b.rect[2] <= z.rect[0] || b.rect[0] >= z.rect[2] || b.rect[3] <= z.rect[1] || b.rect[1] >= z.rect[3], `Binding overlaps protected region: ${z.reason}`);
    }
    const missing = [];
    const manualActions = [];
    const operations = [];
    for (const g of inventory.groups) {
        const s = groupStates.get(g.id);
        if (g.manualOnly) {
            manualActions.push({ groupId: g.id, page: g.pdfPage, text: g.label });
            continue;
        }
        if (!s || s.confirmedRevision !== s.revision) {
            missing.push({ groupId: g.id, reason: g.optional ? 'optional_group_not_addressed' : 'applicability_not_confirmed' });
            continue;
        }
        if (s.status === 'not_applicable')
            continue;
        if (s.status === 'deferred') {
            missing.push({ groupId: g.id, reason: 'deferred_to_official_form' });
            continue;
        }
        if (s.rowCount < 1) {
            missing.push({ groupId: g.id, reason: 'applicable_group_requires_row' });
            continue;
        }
        if (s.rowCount > g.printedCapacity) {
            missing.push({ groupId: g.id, reason: 'continuation_required_no_silent_truncation' });
            continue;
        }
        for (let row = 0; row < s.rowCount; row++)
            for (const f of g.fields) {
                const a = answers.get(key(g.id, row, f.key));
                if (!a || a.confirmedRevision !== a.revision || a.status === 'unknown' || a.status === 'deferred') {
                    missing.push({ groupId: g.id, row, field: f.key, reason: a?.status ?? 'unanswered' });
                    continue;
                }
                if (a.status === 'not_applicable')
                    continue;
                const bs = bindings.get(key(g.id, row, f.key));
                if (!bs?.length) {
                    missing.push({ groupId: g.id, row, field: f.key, reason: 'official_pdf_binding_not_validated' });
                    continue;
                }
                let matched = false;
                for (const b of bs) {
                    if (b.optionValue !== undefined && b.optionValue !== a.value)
                        continue;
                    matched = true;
                    const text = b.format === 'x_if_true' ? (a.value === true ? 'X' : '') : typeof a.value === 'boolean' ? (a.value ? 'Yes' : 'No') : a.value;
                    if (b.maxLength !== undefined && text.length > b.maxLength) {
                        missing.push({ groupId: g.id, row, field: f.key, reason: 'text_overflow_no_truncation' });
                        continue;
                    }
                    if (text)
                        operations.push({ ...b, text, answerRevision: a.revision, sourceIds: a.sourceIds });
                }
                if (!matched)
                    missing.push({ groupId: g.id, row, field: f.key, reason: 'no_mapping_for_explicit_choice' });
            }
    }
    for (const a of data.answers) {
        const s = groupStates.get(a.groupId);
        if (a.status === 'answered' && (!s || s.status !== 'applicable' || a.row >= s.rowCount))
            missing.push({ groupId: a.groupId, row: a.row, field: a.field, reason: 'answer_outside_active_group' });
    }
    const mapReleased = mapping.review.status === 'approved' && mapping.review.visualValidation === true && new Set(mapping.review.reviewers).size >= 2 && typeof mapping.templateSha256 === 'string' && /^[a-f0-9]{64}$/.test(mapping.templateSha256);
    const blockingMissing = missing.filter(m => m.reason !== 'optional_group_not_addressed');
    return { schemaVersion: '1.0', formId: inventory.id, edition: inventory.edition, templateSha256: mapping.templateSha256, pageCount: inventory.pageCount, applicationRevision: data.revision, exportAuthorized: data.exportAuthorized === true, canRender: data.exportAuthorized === true && mapReleased && operations.length > 0, status: !mapReleased ? 'template_mapping_review_required' : blockingMissing.length ? 'partial_unsigned_draft' : 'unsigned_draft_for_manual_review', operations, missing, manualActions, sourceId: inventory.sourceId, officialUrl: inventory.officialUrl, fullFormCompletionCertified: false, submitted: false, warning: 'A prepared PDF is not a signed or submitted application. Missing bindings and manual actions must stay visible. Do not label an incomplete inventory as a complete application.' };
}
/** Choosing an output is not a new benefit application or a signature. */
function chooseForms(programs, preference = 'ask') {
    (0, validation_js_1.assert)(programs.length > 0 && programs.every(p => ['calfresh', 'medi_cal'].includes(p)) && new Set(programs).size === programs.length, 'Invalid form programs');
    (0, validation_js_1.assert)(['separate', 'combined', 'ask'].includes(preference), 'Invalid form preference');
    if (programs.length === 1)
        return { selectionRequired: false, forms: programs[0] === 'calfresh' ? ['cf285'] : ['ccfrm604'], cashAidSelected: false };
    if (preference === 'ask')
        return { selectionRequired: true, options: [['cf285', 'ccfrm604'], ['saws2plus']], forms: [], cashAidSelected: false };
    return { selectionRequired: false, forms: preference === 'combined' ? ['saws2plus'] : ['cf285', 'ccfrm604'], cashAidSelected: false };
}

},"./index.js":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./types.js"), exports);
__exportStar(require("./validation.js"), exports);
__exportStar(require("./engine.js"), exports);
__exportStar(require("./facts.js"), exports);
__exportStar(require("./package-doctor.js"), exports);
__exportStar(require("./ui-adapter.js"), exports);
__exportStar(require("./worker-bridge.js"), exports);
__exportStar(require("./forms.js"), exports);

},"./package-doctor.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPackage = checkPackage;
/** Factual checks only. No legal sufficiency, authenticity or fraud classification. */
function checkPackage(input) {
    const issues = [];
    const docs = (input.evidence ?? []).filter(d => d.programs.some(p => input.selectedPrograms.includes(p)));
    const seen = new Map();
    const push = (p) => issues.push({ ...p, filingBlocked: false });
    for (const d of docs) {
        if (!d.readable || d.missingPages)
            push({ id: `quality:${d.id}`, code: !d.readable ? 'unreadable' : 'incomplete_pages', level: 'attention', text: !d.readable ? 'A document cannot be read reliably.' : 'A document appears to have missing pages.', action: 'Add a clearer/complete copy, enter the affected details, or defer that answer.', evidenceIds: [d.id], subject: d.subject, affectedAnswerPaused: true });
        if (d.sha256) {
            const key = `${d.subject}|${[...d.programs].sort().join(',')}|${d.sha256}`;
            const previous = seen.get(key);
            if (previous)
                push({ id: `duplicate:${d.id}`, code: 'exact_duplicate', level: 'clarification', text: 'These files have the same supplied byte hash; do not count the same record twice.', action: 'Keep one active reference; retain original records under owner control.', evidenceIds: [previous, d.id], subject: d.subject, affectedAnswerPaused: false });
            else
                seen.set(key, d.id);
        }
        const f = d.fields ?? {};
        if (d.readable && f.currentCharges !== undefined && f.previousBalance !== undefined && f.totalDue !== undefined && f.previousBalance > 0 && f.currentCharges + f.previousBalance === f.totalDue)
            push({ id: `balance:${d.id}`, code: 'previous_balance', level: 'clarification', text: 'The total due includes a previous balance. Current charges and total owed are different amounts.', action: 'Keep both fields; confirm which fact the application asks for. This is not a deduction decision.', evidenceIds: [d.id], subject: d.subject, affectedAnswerPaused: false });
        if (d.integrityConcern)
            push({ id: `integrity:${d.id}`, code: 'integrity_not_determined', level: 'clarification', text: 'A supplied integrity concern needs comparison with the issuer original. This engine did not authenticate the file or detect fraud.', action: 'Compare with an original or request another copy; do not change the source document.', evidenceIds: [d.id], subject: d.subject, affectedAnswerPaused: false });
    }
    for (const r of input.requests ?? []) {
        if (!input.selectedPrograms.includes(r.program))
            continue;
        if (!r.confirmed) {
            push({ id: `request_scope:${r.id}`, code: 'request_unconfirmed', level: 'request', text: 'The request details have not been confirmed.', action: 'Confirm the requested person, purpose, period and any stated deadline.', evidenceIds: [r.sourceEvidenceId], program: r.program, subject: r.subject, affectedAnswerPaused: false });
            continue;
        }
        const candidates = docs.filter(d => d.id !== r.sourceEvidenceId && d.subject === r.subject && d.programs.includes(r.program) && d.category === r.category && d.readable && !d.missingPages);
        const compatible = candidates.filter(d => !r.period || (d.period && r.periodBasis && r.periodBasis !== 'unspecified' && d.periodBasis === r.periodBasis));
        // Coverage may be supplied by multiple adjacent records. This is only a candidate
        // match; it does not establish complete income, source truth, or county acceptance.
        const covering = (records) => {
            if (!r.period)
                return records.length > 0;
            let cursor = r.period.from;
            for (const d of [...records].sort((a, b) => (a.period?.from ?? '').localeCompare(b.period?.from ?? ''))) {
                if (!d.period || d.period.through < cursor)
                    continue;
                if (d.period.from > cursor)
                    return false;
                if (d.period.through >= r.period.through)
                    return true;
                const next = new Date(d.period.through + 'T00:00:00.000Z');
                next.setUTCDate(next.getUTCDate() + 1);
                cursor = next.toISOString().slice(0, 10);
            }
            return false;
        };
        const hasCoverage = covering(compatible);
        const sent = covering(compatible.filter(d => r.sentEvidenceIds?.includes(d.id)));
        const basisUnknown = Boolean(r.period) && candidates.some(d => !r.periodBasis || r.periodBasis === 'unspecified' || !d.periodBasis || d.periodBasis === 'unspecified');
        const basisMismatch = Boolean(r.period) && candidates.some(d => d.periodBasis && r.periodBasis && d.periodBasis !== r.periodBasis);
        const code = sent ? 'response_sent_not_accepted' : hasCoverage ? 'matching_candidate_not_sent' : basisUnknown ? 'request_period_basis_unknown' : basisMismatch ? 'request_period_basis_mismatch' : candidates.length ? 'request_period_mismatch' : 'requested_evidence_missing';
        const text = sent ? 'A potentially matching response was recorded as sent. County acceptance is not known.' : hasCoverage ? 'Potentially matching records are available locally; no complete response is recorded as sent.' : basisUnknown ? 'Confirm whether these dates describe earnings, receipt of payment, services, or issue dates.' : basisMismatch ? 'The request and documents use different date meanings; a pay period is not a payment-received period.' : candidates.length ? 'Available comparable records do not cover the whole requested period.' : 'No matching readable record has been added for this request.';
        push({ id: `request:${r.id}`, code, level: 'request', text, action: sent ? 'Keep the receipt and any remaining county request open until resolved.' : hasCoverage ? 'Review the requested scope and authorize the official upload yourself.' : 'Add or clarify a matching record, ask about another verification method, or contact the county.', evidenceIds: [r.sourceEvidenceId, ...candidates.map(d => d.id)], program: r.program, subject: r.subject, affectedAnswerPaused: false, ...(r.dueDate ? { dueDate: r.dueDate } : {}) });
    }
    return issues;
}

},"./types.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},"./ui-adapter.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromPolicyAlignedUI = fromPolicyAlignedUI;
exports.dollarsToCents = dollarsToCents;
const validation_js_1 = require("./validation.js");
function fromPolicyAlignedUI(state, selected, asOf, bundle) {
    (0, validation_js_1.safeData)(state);
    (0, validation_js_1.assert)((0, validation_js_1.validDate)(asOf), 'Invalid UI evaluation date');
    (0, validation_js_1.assert)(selected.length > 0 && selected.every(p => ['calfresh', 'medical'].includes(p)), 'Unknown UI program');
    const programs = [...new Set(selected.map(p => p === 'medical' ? 'medi_cal' : 'calfresh'))];
    const input = { asOf, stage: 'quick', selectedPrograms: programs, people: [], facts: [] };
    const make = (key, subject, p, value, rev, skip = false) => {
        (0, validation_js_1.assert)(Number.isSafeInteger(rev) && rev >= 0, 'Invalid UI revision');
        const f = { id: `ui.${subject}.${key}`, key, subject, programs: [p], status: skip ? 'deferred' : value === undefined ? 'unknown' : 'known', revision: rev + 1, origin: 'user', validFrom: asOf, validThrough: asOf };
        if (f.status === 'known')
            f.value = value;
        input.facts.push(f);
    };
    const residence = (s) => s === 'yes' ? true : s === 'no' ? false : undefined;
    if (programs.includes('calfresh')) {
        const c = state.calfresh;
        const subject = 'household:calfresh';
        const size = /^[1-8]$/.test(c.people) ? Number(c.people) : undefined;
        make('cf.ca_residence', subject, 'calfresh', residence(c.residence), c.revision, c.skipped);
        make('cf.household_size_estimate', subject, 'calfresh', size, c.revision, c.skipped);
        let range;
        if (c.income === 'none')
            range = { min: 0, max: 0 };
        else if (size !== undefined) {
            const table = bundle.tables.find(t => t.id === 'cf_mce_2026_10');
            const bound = table?.rows[String(size)];
            const valid = c.referenceId === 'CF-MCE-2026-10-01' && c.boundCents === bound && table && table.from <= asOf && asOf <= table.through;
            if (valid && c.income === 'at_or_below')
                range = { min: 0, max: bound, referenceId: table.id, householdSize: size };
            if (valid && c.income === 'above')
                range = { min: bound + 1, max: null, referenceId: table.id, householdSize: size };
        }
        make('cf.monthly_income_range', subject, 'calfresh', range, c.revision, c.skipped);
    }
    if (programs.includes('medi_cal')) {
        const m = state.medical;
        for (const p of m.people) {
            input.people.push({ id: p.id, appliesFor: ['medi_cal'] });
            const band = ['under19', '19to64', '65plus'].includes(p.age) ? p.age : undefined;
            make('shared.age_band', p.id, 'medi_cal', band, m.revision, m.skipped);
            make('shared.ca_residence', p.id, 'medi_cal', residence(p.residence), m.revision, m.skipped);
        }
    }
    return input;
}
/** Currency input parser: exact decimal strings only. No rounding guesses. */
function dollarsToCents(text) {
    (0, validation_js_1.assert)(typeof text === 'string' && /^(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?$/.test(text), 'Enter a nonnegative dollar amount with at most two decimals and no currency symbol');
    const [d, c = ''] = text.split('.');
    const n = Number(d) * 100 + Number(c.padEnd(2, '0'));
    (0, validation_js_1.assert)(Number.isSafeInteger(n) && n <= 100000000000, 'Amount outside supported range');
    return n;
}

},"./validation.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = assert;
exports.validDate = validDate;
exports.safeData = safeData;
exports.validateBundle = validateBundle;
exports.validateInput = validateInput;
exports.parseJson = parseJson;
const OPS = new Set(['and', 'or', 'not', 'eq', 'ne', 'in', 'lt', 'lte', 'gt', 'gte', 'add', 'subtract', 'multiply_ratio', 'table', 'interval_lte', 'interval_gt', 'interval_add', 'exists', 'date_years_before']);
const BAD = new Set(['__proto__', 'prototype', 'constructor']);
function assert(ok, message) { if (!ok)
    throw new Error(message); }
function validDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s))
        return false;
    const date = new Date(`${s}T00:00:00.000Z`);
    return Number.isFinite(+date) && date.toISOString().slice(0, 10) === s;
}
function safeData(x, depth = 0, counter = { n: 0 }) {
    assert(depth <= 60 && ++counter.n <= 200000, 'Input/configuration complexity exceeds limit');
    if (x === null || typeof x === 'boolean')
        return;
    if (typeof x === 'number') {
        assert(Number.isFinite(x), 'Non-finite number');
        return;
    }
    if (typeof x === 'string') {
        assert(x.length <= 20000, 'String too long');
        return;
    }
    assert(typeof x === 'object', 'Only JSON-compatible data is allowed');
    if (Array.isArray(x)) {
        assert(x.length <= 10000, 'Array too long');
        for (const v of x)
            safeData(v, depth + 1, counter);
        return;
    }
    assert(Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null, 'Custom prototypes prohibited');
    for (const [k, v] of Object.entries(x)) {
        assert(!BAD.has(k), 'Unsafe object key');
        safeData(v, depth + 1, counter);
    }
}
function unique(xs, label) { assert(new Set(xs).size === xs.length, `Duplicate ${label}`); }
function id(s) { assert(typeof s === 'string' && /^[a-zA-Z0-9_.:-]{1,100}$/.test(s), 'Invalid identifier'); }
function window(w) { assert(w && validDate(w.from) && validDate(w.through) && w.from <= w.through, 'Invalid date window'); }
function valueValid(v, q) {
    if (q.type === 'boolean')
        assert(typeof v === 'boolean', `Expected boolean for ${q.factKey}`);
    if (q.type === 'integer')
        assert(Number.isSafeInteger(v) && v >= (q.min ?? 0) && v <= (q.max ?? 10000000), `Integer out of range: ${q.factKey}`);
    if (q.type === 'enum')
        assert(q.choices?.some(c => c.value === v), `Unknown enum value: ${q.factKey}`);
    if (q.type === 'date')
        assert(validDate(v), `Invalid date: ${q.factKey}`);
    if (q.type === 'interval') {
        assert(v && typeof v === 'object' && !Array.isArray(v), `Expected cents interval: ${q.factKey}`);
        const r = v;
        assert(Number.isSafeInteger(r.min) && r.min >= 0 && r.min <= 100000000000, 'Invalid interval lower bound');
        assert(r.max === null || (Number.isSafeInteger(r.max) && r.max >= r.min && r.max <= 100000000000), 'Invalid interval upper bound');
        if (r.referenceId !== undefined) {
            id(r.referenceId);
            assert(Number.isInteger(r.householdSize) && r.householdSize > 0, 'Reference interval needs household size');
        }
    }
}
function validateBundle(b) {
    safeData(b);
    assert(b.schemaVersion === '1.0', 'Unsupported bundle schema');
    id(b.id);
    assert(typeof b.version === 'string', 'Bundle version required');
    assert(b.release && ['research_preview', 'approved'].includes(b.release.status) && Array.isArray(b.release.reviewers), 'Invalid release state');
    assert(Array.isArray(b.questions) && Array.isArray(b.sources) && Array.isArray(b.tables) && Array.isArray(b.benefits), 'Missing catalog arrays');
    unique(b.questions.map(q => q.id), 'question id');
    unique(b.questions.map(q => q.factKey), 'fact key');
    unique(b.sources.map(s => s.id), 'source');
    unique(b.tables.map(t => t.id), 'table');
    unique(b.benefits.map(p => p.id), 'program');
    const qs = new Map(b.questions.map(q => [q.factKey, q]));
    const ts = new Set(b.tables.map(t => t.id));
    const ss = new Set(b.sources.map(s => s.id));
    const sourceCheck = (s) => { assert(Array.isArray(s) && s.length > 0, 'A policy rule/table must have sources'); for (const v of s)
        assert(ss.has(v), `Unresolved source ${v}`); };
    function expression(e, d = 0) {
        assert(d <= 30 && e && typeof e === 'object', 'Invalid/deep expression');
        if ('literal' in e) {
            assert(Object.keys(e).length === 1, 'Mixed expression variants');
            return;
        }
        if ('fact' in e) {
            assert(Object.keys(e).every(k => ['fact', 'scope', 'minTrust'].includes(k)), 'Mixed fact expression');
            assert(qs.has(e.fact), `Unknown fact ${e.fact}`);
            assert(!e.minTrust || ['reported', 'confirmed'].includes(e.minTrust), 'Invalid minimum trust');
            assert(!e.scope || ['subject', 'household'].includes(e.scope), 'Invalid fact scope');
            return;
        }
        if ('context' in e) {
            assert(Object.keys(e).length === 1, 'Mixed context expression');
            assert(['asOf', 'stage'].includes(e.context), 'Invalid context key');
            return;
        }
        assert('op' in e && OPS.has(e.op), 'Unsupported operation');
        assert(Object.keys(e).every(k => ['op', 'args', 'table'].includes(k)), 'Unknown expression field');
        assert(Array.isArray(e.args), 'Operator args required');
        const n = e.args.length;
        assert(n > 0 && n <= 50, 'Invalid operand count');
        if (['not', 'exists', 'table'].includes(e.op))
            assert(n === 1, 'Unary operator arity');
        if (['eq', 'ne', 'in', 'lt', 'lte', 'gt', 'gte', 'subtract', 'interval_lte', 'interval_gt', 'interval_add', 'date_years_before'].includes(e.op))
            assert(n === 2, 'Binary operator arity');
        if (e.op === 'multiply_ratio')
            assert(n === 3, 'Ratio operator arity');
        if (e.op === 'table')
            assert(e.table && ts.has(e.table), 'Unknown table');
        for (const arg of e.args)
            expression(arg, d + 1);
    }
    for (const q of b.questions) {
        id(q.id);
        id(q.factKey);
        assert(['boolean', 'integer', 'enum', 'interval', 'date'].includes(q.type), 'Unsupported question type');
        assert(['person', 'household'].includes(q.scope), 'Invalid question scope');
        assert(Array.isArray(q.programs) && q.programs.every(p => ['calfresh', 'medi_cal'].includes(p)), 'Invalid question programs');
        assert(typeof q.uiCollect === 'boolean', 'Question uiCollect required');
        if (q.type === 'enum') {
            assert(q.choices && q.choices.length > 0, 'Enum choices required');
            unique(q.choices.map(c => c.value), 'enum choice');
        }
        assert(Number.isSafeInteger(q.priority) && q.priority >= 0, 'Invalid question priority');
    }
    for (const s of b.sources) {
        id(s.id);
        assert(s.status === 'research_checked' && validDate(s.retrievedOn), 'Invalid source metadata');
        const u = new URL(s.url);
        assert(u.protocol === 'https:' && !u.username && !u.password, 'Source must be HTTPS');
    }
    for (const t of b.tables) {
        id(t.id);
        sourceCheck(t.sourceIds);
        window(t);
        assert(t.unit === 'USD_cents', 'Unknown table unit');
        assert(Object.keys(t.rows).length > 0, 'Empty table');
        for (const [k, v] of Object.entries(t.rows))
            assert(/^\d+$/.test(k) && Number(k) > 0 && Number.isSafeInteger(v) && v >= 0, 'Invalid table row');
        if (t.incrementAfter) {
            assert(String(t.incrementAfter.row) in t.rows && Number.isSafeInteger(t.incrementAfter.amount) && t.incrementAfter.amount >= 0 && t.incrementAfter.maximumRow >= t.incrementAfter.row, 'Invalid additional-person table');
        }
    }
    unique((b.derivations ?? []).map(d => d.id), 'derivation');
    for (const d of b.derivations ?? []) {
        id(d.id);
        assert(qs.has(d.key), 'Unknown derived fact key');
        assert(qs.get(d.key).programs.includes(d.program), 'Wrong derivation program');
        sourceCheck(d.sourceIds);
        expression(d.when);
        expression(d.value);
    }
    const ruleIds = [];
    for (const p of b.benefits) {
        assert(['calfresh', 'medi_cal'].includes(p.id) && p.fullEligibilityImplemented === false, 'Invalid program or unsupported full-verdict capability');
        window(p.supportedWindow);
        sourceCheck(p.sourceIds);
        const u = new URL(p.officialApplication);
        assert(u.protocol === 'https:' && u.hostname === 'benefitscal.com' && u.pathname === '/' && !u.search && !u.hash && !u.username && !u.password && !u.port, 'Unapproved official destination');
        unique(p.dimensions.map(d => d.id), 'dimension');
        const ds = new Set(p.dimensions.map(d => d.id));
        for (const r of p.rules) {
            id(r.id);
            ruleIds.push(r.id);
            assert(ds.has(r.dimension), 'Unknown dimension');
            assert(['GATE', 'PATH', 'CALCULATION', 'SUPPORTING'].includes(r.importance), 'Invalid importance');
            assert(['household', 'applicant'].includes(r.scope), 'Invalid rule scope');
            assert(r.stages.length > 0 && r.stages.every(s => ['quick', 'details', 'followup'].includes(s)), 'Invalid stage');
            assert(['executable', 'review_only'].includes(r.implementation), 'Invalid implementation status');
            sourceCheck(r.sourceIds);
            if (r.window)
                window(r.window);
            if (r.when)
                expression(r.when);
            assert(Number.isSafeInteger(r.priority) && r.priority >= 0, 'Invalid rule priority');
            assert(Array.isArray(r.branches), 'Branches required');
            for (const branch of r.branches) {
                expression(branch.when);
                checkOutcome(branch.then);
            }
            checkOutcome(r.otherwise);
        }
    }
    unique(ruleIds, 'rule id');
    function checkOutcome(o) { assert(o && Object.keys(o).every(k => ['status', 'code', 'text', 'action', 'alternatives', 'computed'].includes(k)), 'Unsupported outcome field'); for (const a of o.alternatives ?? [])
        assert(a.status === 'referral_only' && typeof a.id === 'string' && typeof a.reason === 'string', 'Alternatives must be referrals'); assert(o && ['reported_condition_met', 'reference_only', 'within_reference', 'above_reference', 'needs_information', 'needs_review', 'pathway_to_review', 'not_applicable', 'deferred', 'stale_policy', 'policy_not_released'].includes(o.status), 'Invalid rule outcome'); id(o.code); assert(typeof o.text === 'string' && o.text.length > 0, 'Outcome text required'); for (const e of Object.values(o.computed ?? {}))
        expression(e); }
}
function validateInput(input, b) {
    safeData(input);
    assert(validDate(input.asOf), 'asOf must be a real YYYY-MM-DD date');
    assert(['quick', 'details', 'followup'].includes(input.stage), 'Invalid stage');
    assert(Array.isArray(input.selectedPrograms) && input.selectedPrograms.length > 0 && input.selectedPrograms.every(p => b.benefits.some(x => x.id === p)), 'Select a configured program');
    unique(input.selectedPrograms, 'selected program');
    assert(Array.isArray(input.people) && input.people.length <= 50 && Array.isArray(input.facts) && input.facts.length <= 5000, 'Input size/type limit');
    unique(input.people.map(p => p.id), 'person');
    unique(input.facts.map(f => f.id), 'fact id');
    const ps = new Set(input.people.map(p => p.id));
    const qs = new Map(b.questions.map(q => [q.factKey, q]));
    for (const p of input.people) {
        id(p.id);
        assert(!p.id.startsWith('household:'), 'Reserved person prefix');
        assert(Array.isArray(p.appliesFor) && p.appliesFor.every(x => ['calfresh', 'medi_cal'].includes(x)), 'Invalid applicant scope');
        unique(p.appliesFor, 'applicant program');
        if (p.sensitiveConsent)
            assert(Array.isArray(p.sensitiveConsent) && p.sensitiveConsent.every(x => ['immigration', 'health'].includes(x)), 'Unknown consent');
    }
    for (const f of input.facts) {
        id(f.id);
        assert(qs.has(f.key), `Unknown fact key ${f.key}`);
        const q = qs.get(f.key);
        assert(q.scope === 'person' ? ps.has(f.subject) : f.subject === 'household:calfresh' || f.subject === 'household:medi_cal', 'Subject incompatible with question');
        assert(Array.isArray(f.programs) && f.programs.length > 0 && f.programs.every(p => q.programs.includes(p)), 'Fact program not allowed');
        unique(f.programs, 'fact program');
        if (q.scope === 'household')
            assert(f.programs.length === 1 && f.subject === `household:${f.programs[0]}`, 'Household facts cannot cross programs');
        assert(['known', 'unknown', 'declined', 'deferred', 'conflict'].includes(f.status), 'Invalid fact status');
        assert(Number.isSafeInteger(f.revision) && f.revision >= 1, 'Invalid revision');
        assert(['user', 'document', 'derived'].includes(f.origin), 'Invalid origin');
        window({ from: f.validFrom, through: f.validThrough });
        if (f.confirmedRevision !== undefined)
            assert(Number.isInteger(f.confirmedRevision) && f.confirmedRevision > 0 && f.confirmedRevision <= f.revision, 'Invalid confirmation revision');
        if (f.status === 'known')
            valueValid(f.value, q);
        else
            assert(f.value === undefined, 'Unresolved fact must not retain an active value');
        if (f.origin === 'document')
            assert(f.evidenceIds && f.evidenceIds.length > 0, 'Document fact requires evidence link');
        if (f.origin === 'derived')
            assert(f.dependencies && f.dependencies.length > 0, 'Derived fact requires revision dependencies');
        for (const dep of f.dependencies ?? []) {
            assert(input.facts.some(x => x.id === dep.id) && dep.id !== f.id, 'Invalid dependency id');
            assert(Number.isInteger(dep.revision) && dep.revision > 0, 'Invalid dependency revision');
        }
    }
    for (const person of input.people)
        for (const program of input.selectedPrograms) {
            const active = (key) => input.facts.filter(f => f.subject === person.id && f.key === key && f.programs.includes(program) && f.status === 'known' && f.validFrom <= input.asOf && input.asOf <= f.validThrough);
            const years = active('shared.age_years'), bands = active('shared.age_band');
            if (years.length === 1 && bands.length === 1) {
                const y = years[0].value;
                const expected = y < 19 ? 'under19' : y < 65 ? '19to64' : '65plus';
                assert(bands[0].value === expected, 'Conflicting age and age-band inputs; correct the affected facts before evaluating');
            }
        }
    const es = input.evidence ?? [];
    assert(Array.isArray(es) && es.length <= 200, 'Invalid evidence collection');
    unique(es.map(e => e.id), 'evidence');
    for (const e of es) {
        id(e.id);
        assert(ps.has(e.subject) || e.subject === 'household:calfresh' || e.subject === 'household:medi_cal', 'Unknown evidence subject');
        assert(Array.isArray(e.programs) && e.programs.length > 0 && e.programs.every(p => ['calfresh', 'medi_cal'].includes(p)), 'Invalid evidence program');
        assert(typeof e.category === 'string' && e.category.length > 0 && e.category.length <= 100, 'Invalid evidence category');
        assert(typeof e.readable === 'boolean', 'Evidence readability required');
        for (const flag of [e.missingPages, e.integrityConcern])
            assert(flag === undefined || typeof flag === 'boolean', 'Invalid evidence flag');
        if (e.subject.startsWith('household:'))
            assert(e.programs.length === 1 && e.subject === `household:${e.programs[0]}`, 'Evidence household cannot cross programs');
        if (e.period)
            window(e.period);
        if (e.periodBasis)
            assert(['earned', 'received', 'service', 'issued', 'unspecified'].includes(e.periodBasis), 'Invalid evidence period basis');
        if (e.sha256)
            assert(/^[a-f0-9]{64}$/.test(e.sha256), 'Invalid SHA256');
        for (const n of Object.values(e.fields ?? {}))
            assert(Number.isSafeInteger(n) && n >= 0, 'Evidence fields must be nonnegative integer cents');
    }
    for (const f of input.facts)
        for (const eid of f.evidenceIds ?? [])
            assert(es.some(e => e.id === eid && e.subject === f.subject && f.programs.every(p => e.programs.includes(p))), 'Missing or mismatched evidence link');
    const rs = input.requests ?? [];
    assert(Array.isArray(rs) && rs.length <= 200, 'Too many requests');
    unique(rs.map(r => r.id), 'request');
    for (const r of rs) {
        id(r.id);
        assert(['calfresh', 'medi_cal'].includes(r.program) && typeof r.confirmed === 'boolean', 'Invalid request');
        assert(typeof r.category === 'string' && r.category.length > 0, 'Invalid request category');
        if (r.period)
            window(r.period);
        if (r.periodBasis)
            assert(['earned', 'received', 'service', 'issued', 'unspecified'].includes(r.periodBasis), 'Invalid request period basis');
        if (r.dueDate)
            assert(validDate(r.dueDate), 'Invalid due date');
        assert(es.some(e => e.id === r.sourceEvidenceId && e.programs.includes(r.program) && e.subject === r.subject), 'Request must reference its scoped notice');
        for (const eid of r.sentEvidenceIds ?? [])
            assert(es.some(e => e.id === eid && e.subject === r.subject && e.programs.includes(r.program)), 'Unknown or wrong-scope sent evidence');
    }
}
function parseJson(text) { assert(text.length <= 8000000, 'JSON input too large'); const d = JSON.parse(text); safeData(d); return d; }

},"./worker-bridge.js":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkerMessageHandler = createWorkerMessageHandler;
const engine_js_1 = require("./engine.js");
const validation_js_1 = require("./validation.js");
/** Local worker protocol. The extension must supply its packaged trusted bundle.
 * Bounded synchronous calculations only; this is not an AI/parsing worker.
 * Init/reset clear prior state. No I/O or persistence occurs here.
 */
function createWorkerMessageHandler() {
    let engine;
    return (message) => {
        let requestId = 'invalid';
        try {
            (0, validation_js_1.safeData)(message);
            const m = message;
            (0, validation_js_1.assert)(typeof m.requestId === 'string' && /^[a-zA-Z0-9_.:-]{1,100}$/.test(m.requestId), 'Invalid request');
            requestId = m.requestId;
            if (m.type === 'reset') {
                engine = undefined;
                return { requestId, ok: true, type: 'reset' };
            }
            if (m.type === 'init') {
                engine = undefined;
                (0, validation_js_1.assert)(m.bundle, 'Missing bundle');
                engine = (0, engine_js_1.createEngine)(m.bundle);
                return { requestId, ok: true, type: 'initialized' };
            }
            (0, validation_js_1.assert)(m.type === 'evaluate' && engine && m.input, 'Not initialized or invalid operation');
            return { requestId, ok: true, type: 'result', result: engine.evaluate(m.input) };
        }
        catch {
            return { requestId, ok: false, code: 'INVALID_REQUEST_OR_CONFIGURATION' };
        }
    };
}

}};const cache={};function require(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Unknown bundled module '+id);const m={exports:{}};cache[id]=m;modules[id](m,m.exports,require);return m.exports;}globalThis.BenefitStepEngine=require('./index.js');})();