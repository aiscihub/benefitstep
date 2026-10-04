import type { Bundle, Input } from './types.js';
/** Explicit boundary for the previously delivered policy-aligned UI v0.2.
 * medical is an old UI identifier, not a third benefits program.
 * Age bands and 9+ people remain ranges/unknowns; never invent exact values.
 */
export interface UIState02 {
    calfresh: {
        residence: string;
        people: string;
        income: string;
        boundCents: number | null;
        referenceId: string | null;
        revision: number;
        skipped?: boolean;
    };
    medical: {
        people: {
            id: string;
            age: string;
            residence: string;
        }[];
        revision: number;
        skipped?: boolean;
    };
}
export declare function fromPolicyAlignedUI(state: UIState02, selected: ('calfresh' | 'medical')[], asOf: string, bundle: Bundle): Input;
/** Currency input parser: exact decimal strings only. No rounding guesses. */
export declare function dollarsToCents(text: string): number;
