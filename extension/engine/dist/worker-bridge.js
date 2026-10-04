import { createEngine } from './engine.js';
import { safeData, assert } from './validation.js';
/** Local worker protocol. The extension must supply its packaged trusted bundle.
 * Bounded synchronous calculations only; this is not an AI/parsing worker.
 * Init/reset clear prior state. No I/O or persistence occurs here.
 */
export function createWorkerMessageHandler() {
    let engine;
    return (message) => {
        let requestId = 'invalid';
        try {
            safeData(message);
            const m = message;
            assert(typeof m.requestId === 'string' && /^[a-zA-Z0-9_.:-]{1,100}$/.test(m.requestId), 'Invalid request');
            requestId = m.requestId;
            if (m.type === 'reset') {
                engine = undefined;
                return { requestId, ok: true, type: 'reset' };
            }
            if (m.type === 'init') {
                engine = undefined;
                assert(m.bundle, 'Missing bundle');
                engine = createEngine(m.bundle);
                return { requestId, ok: true, type: 'initialized' };
            }
            assert(m.type === 'evaluate' && engine && m.input, 'Not initialized or invalid operation');
            return { requestId, ok: true, type: 'result', result: engine.evaluate(m.input) };
        }
        catch {
            return { requestId, ok: false, code: 'INVALID_REQUEST_OR_CONFIGURATION' };
        }
    };
}
