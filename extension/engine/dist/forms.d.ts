export interface FormField {
    key: string;
    type: string;
    label: string;
}
export interface FormGroup {
    id: string;
    pdfPage: number;
    label: string;
    fields: FormField[];
    printedCapacity: number;
    manualOnly: boolean;
    optional: boolean;
    applicability: string;
    note: string;
}
export interface FormInventory {
    id: string;
    pageCount: number;
    groups: FormGroup[];
    edition: string;
    officialUrl: string;
    sourceId: string;
}
export interface FormAnswer {
    groupId: string;
    row: number;
    field: string;
    status: 'answered' | 'not_applicable' | 'deferred' | 'unknown';
    value?: string | boolean;
    revision: number;
    confirmedRevision?: number;
    sourceIds: string[];
}
export interface FormGroupState {
    groupId: string;
    status: 'applicable' | 'not_applicable' | 'deferred';
    rowCount: number;
    revision: number;
    confirmedRevision?: number;
    reason?: string;
}
export interface ApplicationAnswers {
    schemaVersion: '1.0';
    formId: string;
    revision: number;
    groups: FormGroupState[];
    answers: FormAnswer[];
    exportAuthorized: boolean;
}
export interface Binding {
    groupId: string;
    row: number;
    field: string;
    page: number;
    kind: 'text' | 'checkbox' | 'choice';
    rect: [number, number, number, number];
    widget?: string;
    maxLength?: number;
    fontSize?: number;
    optionValue?: string | boolean;
    format?: 'text' | 'x_if_true';
}
export interface FormMap {
    schemaVersion: '1.0';
    formId: string;
    templateSha256: string | null;
    expectedPageCount: number;
    review: {
        status: string;
        reviewers: string[];
        visualValidation: boolean;
    };
    bindings: Binding[];
    protectedRegions: {
        page: number;
        rect: [number, number, number, number];
        reason: string;
    }[];
}
export interface FillOperation extends Binding {
    text: string;
    answerRevision: number;
    sourceIds: string[];
}
export declare function prepareForm(inventory: FormInventory, mapping: FormMap, data: ApplicationAnswers): {
    schemaVersion: string;
    formId: string;
    edition: string;
    templateSha256: string | null;
    pageCount: number;
    applicationRevision: number;
    exportAuthorized: boolean;
    canRender: boolean;
    status: string;
    operations: FillOperation[];
    missing: {
        groupId: string;
        row?: number;
        field?: string;
        reason: string;
    }[];
    manualActions: {
        groupId: string;
        page: number;
        text: string;
    }[];
    sourceId: string;
    officialUrl: string;
    fullFormCompletionCertified: boolean;
    submitted: boolean;
    warning: string;
};
/** Choosing an output is not a new benefit application or a signature. */
export declare function chooseForms(programs: ('calfresh' | 'medi_cal')[], preference?: 'separate' | 'combined' | 'ask'): {
    selectionRequired: boolean;
    forms: string[];
    cashAidSelected: boolean;
    options?: undefined;
} | {
    selectionRequired: boolean;
    options: string[][];
    forms: never[];
    cashAidSelected: boolean;
};
