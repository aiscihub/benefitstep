/** Form preparation is independent of eligibility. Only explicit, confirmed answers are exported. */
import { assert, safeData } from './validation.js';
export function prepareForm(inventory, mapping, data) {
    safeData(inventory);
    safeData(mapping);
    safeData(data);
    assert(data.schemaVersion === '1.0' && mapping.schemaVersion === '1.0', 'Unsupported form schema');
    assert(data.formId === inventory.id && mapping.formId === inventory.id, 'Wrong form mapping');
    assert(mapping.expectedPageCount === inventory.pageCount, 'Wrong page count in mapping');
    assert(Array.isArray(data.answers) && data.answers.length <= 10000 && Array.isArray(data.groups), 'Invalid form answer arrays');
    assert(Number.isSafeInteger(data.revision) && data.revision >= 1, 'Invalid application revision');
    const groups = new Map(inventory.groups.map(g => [g.id, g]));
    const groupStates = new Map();
    for (const g of data.groups) {
        assert(groups.has(g.groupId) && !groupStates.has(g.groupId), 'Unknown or repeated group');
        assert(['applicable', 'not_applicable', 'deferred'].includes(g.status), 'Invalid group state');
        assert(Number.isSafeInteger(g.rowCount) && g.rowCount >= 0 && g.rowCount <= 100, 'Invalid row count');
        assert(Number.isSafeInteger(g.revision) && g.revision >= 1, 'Invalid group revision');
        assert(g.confirmedRevision === undefined || g.confirmedRevision === g.revision, 'Stale group confirmation');
        groupStates.set(g.groupId, g);
    }
    const key = (g, row, f) => `${g}|${row}|${f}`;
    const answers = new Map();
    for (const a of data.answers) {
        const g = groups.get(a.groupId);
        assert(g && g.fields.some(f => f.key === a.field), 'Unknown form question');
        assert(!g.manualOnly, 'Manual signature/certification fields cannot be filled');
        assert(Number.isSafeInteger(a.row) && a.row >= 0 && a.row < 100, 'Invalid answer row');
        assert(!answers.has(key(a.groupId, a.row, a.field)), 'Duplicate form answer');
        assert(['answered', 'not_applicable', 'deferred', 'unknown'].includes(a.status), 'Invalid answer status');
        assert(Number.isSafeInteger(a.revision) && a.revision >= 1, 'Invalid answer revision');
        assert(a.confirmedRevision === undefined || a.confirmedRevision === a.revision, 'Stale answer confirmation');
        assert(Array.isArray(a.sourceIds) && a.sourceIds.every(s => typeof s === 'string'), 'Answer provenance required');
        if (a.status === 'answered') {
            const f = g.fields.find(f => f.key === a.field);
            assert(f.type === 'bool' ? typeof a.value === 'boolean' : typeof a.value === 'string', 'Wrong form answer type');
            if (typeof a.value === 'string')
                assert(a.value.trim().length > 0 && a.value.length <= 4000, 'Blank/overlong form answer');
        }
        else
            assert(a.value === undefined, 'Unresolved form answer retains a value');
        answers.set(key(a.groupId, a.row, a.field), a);
    }
    const bindings = new Map();
    const bindingSeen = new Set();
    for (const b of mapping.bindings) {
        const g = groups.get(b.groupId);
        assert(g && !g.manualOnly && g.fields.some(f => f.key === b.field), 'Binding targets unknown/manual field');
        assert(Number.isInteger(b.page) && b.page >= 1 && b.page <= inventory.pageCount, 'Binding page invalid');
        assert(Number.isInteger(b.row) && b.row >= 0 && b.row < g.printedCapacity, 'Binding row invalid');
        assert(['text', 'checkbox', 'choice'].includes(b.kind), 'Binding kind invalid');
        assert(b.rect.length === 4 && b.rect.every(n => Number.isFinite(n) && n >= 0) && b.rect[2] > b.rect[0] && b.rect[3] > b.rect[1], 'Binding rectangle invalid');
        const k = key(b.groupId, b.row, b.field);
        const occurrence = k + '|' + b.page + '|' + b.rect.join(',');
        assert(!bindingSeen.has(occurrence), 'Duplicate binding');
        bindingSeen.add(occurrence);
        bindings.set(k, [...(bindings.get(k) ?? []), b]);
        for (const z of mapping.protectedRegions)
            if (z.page === b.page)
                assert(b.rect[2] <= z.rect[0] || b.rect[0] >= z.rect[2] || b.rect[3] <= z.rect[1] || b.rect[1] >= z.rect[3], `Binding overlaps protected region: ${z.reason}`);
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
export function chooseForms(programs, preference = 'ask') {
    assert(programs.length > 0 && programs.every(p => ['calfresh', 'medi_cal'].includes(p)) && new Set(programs).size === programs.length, 'Invalid form programs');
    assert(['separate', 'combined', 'ask'].includes(preference), 'Invalid form preference');
    if (programs.length === 1)
        return { selectionRequired: false, forms: programs[0] === 'calfresh' ? ['cf285'] : ['ccfrm604'], cashAidSelected: false };
    if (preference === 'ask')
        return { selectionRequired: true, options: [['cf285', 'ccfrm604'], ['saws2plus']], forms: [], cashAidSelected: false };
    return { selectionRequired: false, forms: preference === 'combined' ? ['saws2plus'] : ['cf285', 'ccfrm604'], cashAidSelected: false };
}
