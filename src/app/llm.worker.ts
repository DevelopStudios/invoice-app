/// <reference lib="webworker" />

import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

/**
 * The WebWorkerMLCEngineHandler listens for messages from the 
 * main thread, proxies them to the MLC engine, and sends 
 * the results back.
 */

const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg) => {
    handler.onmessage(msg);
}