/** Local worker protocol. The extension must supply its packaged trusted bundle.
 * Bounded synchronous calculations only; this is not an AI/parsing worker.
 * Init/reset clear prior state. No I/O or persistence occurs here.
 */
export declare function createWorkerMessageHandler(): (message: unknown) => object;
