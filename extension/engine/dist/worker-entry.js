import { createWorkerMessageHandler } from './worker-bridge.js';
const handle = createWorkerMessageHandler();
self.addEventListener('message', (event) => { self.postMessage(handle(event.data)); });
