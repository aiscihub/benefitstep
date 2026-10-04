import { assert, validateBundle, validateInput } from './validation.js';
import { checkPackage } from './package-doctor.js';
export const ENGINE_VERSION = '0.1.0';
const uniq = (v) => [...new Set(v)];
const known = (value, factIds = [], sourceIds = []) => ({ known: true, value, missing: [], reasons: [], factIds, sourceIds });
const unknown = (missing = [], reasons = [], cells = []) => ({ known: false, missing: uniq([...missing, ...cells.flatMap(c => c.missing)]), reasons: uniq([...reasons, ...cells.flatMap(c => c.reasons)]), factIds: uniq(cells.flatMap(c => c.factIds)), sourceIds: uniq(cells.flatMap(c => c.sourceIds)) });
const within = (date, w) => w.from <= date && date <= w.through;
export function stableStringify(value) {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value);
    if (Array.isArray(value))
        return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}
export function createEngine(original) {
    validateBundle(original);
    // Private copy prevents caller mutation from silently changing a running policy version.
    const bundle = JSON.parse(JSON.stringify(original));
    const questionByKey = new Map(bundle.questions.map(q => [q.factKey, q]));
    const tableById = new Map(bundle.tables.map(t => [t.id, t]));
    function evaluate(input, options = {}) {
        validateInput(input, bundle);
        const mode = options.mode ?? 'preview';
        assert(['preview', 'released'].includes(mode), 'Invalid runtime mode');
        if (mode === 'released')
            assert(bundle.release.status === 'approved' && new Set(bundle.release.reviewers).size >= 2, 'POLICY_NOT_RELEASED: independently review and release this configuration before consumer use');
        const limit = options.maxQuestions ?? 3;
        assert(Number.isInteger(limit) && limit >= 1 && limit <= 50, 'Invalid question limit');
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
        const evaluation = { engineVersion: ENGINE_VERSION, policyBundle: bundle.id, policyVersion: bundle.version, asOf: input.asOf, stage: input.stage, mode, authoritative: false, approvalPrediction: null, results, nextQuestions: ordered.filter(([k]) => !blocks.has(k)).slice(0, limit).map(([, q]) => q), blockedQuestions: ordered.filter(([k]) => blocks.has(k)).map(([, q]) => q), requiredActions, packageIssues: checkPackage(input), warnings: [mode === 'preview' ? 'Research configuration: executable checks, not independently approved production policy.' : 'Only the released, bounded checks were evaluated.', 'No overall eligibility, document authenticity, county acceptance, treatment coverage, or approval prediction is determined.', 'Do not use a missing document or an unresolved check to hide the official application route.'] };
        return JSON.parse(JSON.stringify(evaluation));
    }
    return { evaluate, describe: () => JSON.parse(JSON.stringify(bundle)) };
}
