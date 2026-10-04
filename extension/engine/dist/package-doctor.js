/** Factual checks only. No legal sufficiency, authenticity or fraud classification. */
export function checkPackage(input) {
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
