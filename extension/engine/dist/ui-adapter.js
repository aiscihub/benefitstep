import { assert, safeData, validDate } from './validation.js';
export function fromPolicyAlignedUI(state, selected, asOf, bundle) {
    safeData(state);
    assert(validDate(asOf), 'Invalid UI evaluation date');
    assert(selected.length > 0 && selected.every(p => ['calfresh', 'medical'].includes(p)), 'Unknown UI program');
    const programs = [...new Set(selected.map(p => p === 'medical' ? 'medi_cal' : 'calfresh'))];
    const input = { asOf, stage: 'quick', selectedPrograms: programs, people: [], facts: [] };
    const make = (key, subject, p, value, rev, skip = false) => {
        assert(Number.isSafeInteger(rev) && rev >= 0, 'Invalid UI revision');
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
export function dollarsToCents(text) {
    assert(typeof text === 'string' && /^(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?$/.test(text), 'Enter a nonnegative dollar amount with at most two decimals and no currency symbol');
    const [d, c = ''] = text.split('.');
    const n = Number(d) * 100 + Number(c.padEnd(2, '0'));
    assert(Number.isSafeInteger(n) && n <= 100000000000, 'Amount outside supported range');
    return n;
}
