const OPS = new Set(['and', 'or', 'not', 'eq', 'ne', 'in', 'lt', 'lte', 'gt', 'gte', 'add', 'subtract', 'multiply_ratio', 'table', 'interval_lte', 'interval_gt', 'interval_add', 'exists', 'date_years_before']);
const BAD = new Set(['__proto__', 'prototype', 'constructor']);
export function assert(ok, message) { if (!ok)
    throw new Error(message); }
export function validDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s))
        return false;
    const date = new Date(`${s}T00:00:00.000Z`);
    return Number.isFinite(+date) && date.toISOString().slice(0, 10) === s;
}
export function safeData(x, depth = 0, counter = { n: 0 }) {
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
export function validateBundle(b) {
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
export function validateInput(input, b) {
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
export function parseJson(text) { assert(text.length <= 8000000, 'JSON input too large'); const d = JSON.parse(text); safeData(d); return d; }
