import type { Bundle, Input, Evaluation } from './types.js';
export declare const ENGINE_VERSION = "0.1.0";
export declare function stableStringify(value: unknown): string;
export declare function createEngine(original: Bundle): {
    evaluate: (input: Input, options?: {
        mode?: "preview" | "released";
        maxQuestions?: number;
    }) => Evaluation;
    describe: () => Bundle;
};
