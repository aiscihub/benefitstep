const choices = {
    yesNoUnsure: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Not sure' }],
};
const householdAnswers = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }));
/** Current public income guide values. These are routing aids, never an eligibility calculation. */
const incomeRules = {
    calfresh: {
        amounts: [2660, 3608, 4554, 5500, 6448, 7394, 8340, 9288], additional: 948, period: 'month',
        description: 'CalFresh gross monthly guide (before taxes)', dateLabel: 'Effective Oct 1, 2026–Sep 30, 2027', sourceId: 'S22',
    },
    medi_cal: {
        amounts: [22025, 29864, 37702, 45540, 53379, 61217, 69056, 76894, 84732, 92571, 100409, 108248], additional: 7839, period: 'year',
        description: 'Common adult Medi-Cal income guide (138% FPL)', dateLabel: 'DHCS 2026 FPL enclosure, checked Oct 3, 2026', sourceId: 'S23',
    },
};
export const SCREENING_QUESTIONS = {
    calfresh: [
        { id: 'resident', kind: 'choice', label: 'Do you live in California?', help: 'This means where you live. You do not need to have been born in California.', answers: choices.yesNoUnsure },
        { id: 'household_size', kind: 'household', label: 'How many people buy and prepare food together?', help: 'Include spouses and children under 22 living together.', answers: householdAnswers },
        { id: 'income_band', kind: 'income', label: 'What is your gross monthly household income?', help: 'Choose household size first. Gross means before taxes.', answers: [] },
        { id: 'applicant_status', kind: 'choice', label: 'Could one applicant meet immigration rules?', help: 'Mixed-status households may apply for eligible members.', answers: choices.yesNoUnsure },
    ],
    medi_cal: [
        { id: 'resident', kind: 'choice', label: 'Do you live in California?', help: 'This means where you live. You do not need to have been born in California.', answers: choices.yesNoUnsure },
        { id: 'household_size', kind: 'household', label: 'How many people are in your tax household?', help: 'Include spouses and tax dependents.', answers: householdAnswers },
        { id: 'income_band', kind: 'income', label: 'What is your gross yearly household income?', help: 'Choose household size first. Gross means before taxes.', answers: [] },
        { id: 'special_group', kind: 'choice', label: 'Does anyone have special health eligibility?', help: 'Pregnancy, age, disability, or care may change rules.', answers: choices.yesNoUnsure },
    ]
};
function money(value) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }
export function incomeLimit(program, householdSize) {
    const rule = incomeRules[program];
    if (!Number.isInteger(householdSize) || householdSize < 1)
        return null;
    const last = rule.amounts[rule.amounts.length - 1];
    return householdSize <= rule.amounts.length ? rule.amounts[householdSize - 1] : last + (householdSize - rule.amounts.length) * rule.additional;
}
export function incomePrompt(program, householdSize) {
    const rule = incomeRules[program], limit = incomeLimit(program, householdSize);
    if (limit === null)
        return null;
    const period = rule.period === 'month' ? 'per month' : 'per year';
    return {
        label: `What is your gross household income per ${rule.period}?`,
        help: `${householdSize} ${householdSize === 1 ? 'person' : 'people'}: ${money(limit)} ${rule.period === 'month' ? 'monthly' : 'yearly'}. ${program === 'calfresh' ? 'Oct 2026–Sep 2027' : '2026 adult 138% FPL'} guide.`,
        answers: [
            { value: 'within', label: `$0–${money(limit)} ${period}` },
            { value: 'over', label: `More than ${money(limit)} ${period}` },
            { value: 'unsure', label: 'Not sure / income changes' },
        ],
        limit,
        sourceId: rule.sourceId,
    };
}
export {quickScreen as evaluateScreen} from './quick-screen.mjs';
