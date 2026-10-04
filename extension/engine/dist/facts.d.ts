import type { Fact, Input } from './types.js';
/** One UI confirmation operates on explicitly displayed fact ids/revisions. */
export declare function confirmFacts(input: Input, displayed: {
    id: string;
    revision: number;
}[]): Input;
export declare function reviseFact(input: Input, id: string, update: Pick<Fact, 'status' | 'value'>): Input;
export declare function snapshot(input: Input, policyVersion: string, recordedAt: string): any;
export declare function compareSnapshots(previous: ReturnType<typeof snapshot>, current: ReturnType<typeof snapshot>): {
    policyChanged: boolean;
    changes: any;
    message: string;
};
/** Detect changes after transfer preview; authorization itself stays in the UI. */
export declare function createTransferIntent(input: Input, selectedIds: string[]): {
    factVersions: {
        id: string;
        revision: number;
    }[];
    basis: string;
    kind: "local_transfer_preview";
};
export declare function transferIntentIsCurrent(input: Input, intent: ReturnType<typeof createTransferIntent>): boolean;
