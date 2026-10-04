import type { Bundle, Input } from './types.js';
export declare function assert(ok: unknown, message: string): asserts ok;
export declare function validDate(s: unknown): s is string;
export declare function safeData(x: unknown, depth?: number, counter?: {
    n: number;
}): void;
export declare function validateBundle(b: Bundle): void;
export declare function validateInput(input: Input, b: Bundle): void;
export declare function parseJson<T>(text: string): T;
