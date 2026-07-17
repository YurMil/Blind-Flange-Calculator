import type {BlindFlangeCadGeometry} from '../types/cad-types';
import type {
  BlindFlangeStepRequest,
  BlindFlangeWorkerMessage,
  BlindFlangeWorkerProgress,
  BlindFlangeWarmupRequest,
} from './cad-worker-protocol';

export type CadWorkerErrorCode = 'timeout' | 'cancelled' | 'worker';

export class CadWorkerError extends Error {
  readonly code: CadWorkerErrorCode;

  constructor(message: string, code: CadWorkerErrorCode) {
    super(message);
    this.name = 'CadWorkerError';
    this.code = code;
  }
}

/** Default STEP generation timeout (WASM init + solid + export). */
export const CAD_STEP_TIMEOUT_MS = 120_000;
/** Default CAD kernel warmup timeout. */
export const CAD_WARMUP_TIMEOUT_MS = 90_000;

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};

type PendingRequest = {
  resolve: (value: ArrayBuffer) => void;
  reject: (error: Error) => void;
  onProgress?: (message: BlindFlangeWorkerProgress) => void;
  timeoutId?: ReturnType<typeof setTimeout>;
  abortHandler?: () => void;
  signal?: AbortSignal;
};

let worker: Worker | null = null;
const pending = new Map<string, PendingRequest>();

const clearPending = (requestId: string) => {
  const handler = pending.get(requestId);
  if (!handler) {
    return;
  }

  if (handler.timeoutId !== undefined) {
    clearTimeout(handler.timeoutId);
  }

  if (handler.signal && handler.abortHandler) {
    handler.signal.removeEventListener('abort', handler.abortHandler);
  }

  pending.delete(requestId);
};

const rejectPending = (requestId: string, error: Error) => {
  const handler = pending.get(requestId);
  if (!handler) {
    return;
  }

  clearPending(requestId);
  handler.reject(error);
};

/** Terminate the worker so a hung WASM job cannot keep the UI blocked. */
export const resetCadWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }

  const error = new CadWorkerError('CAD worker was reset.', 'cancelled');
  pending.forEach((handler, requestId) => {
    clearPending(requestId);
    handler.reject(error);
  });
};

const getWorker = () => {
  if (typeof Worker === 'undefined') {
    throw new CadWorkerError('CAD STEP export is only available in the browser.', 'worker');
  }

  if (worker) {
    return worker;
  }

  worker = new Worker(new URL('./cad-worker.ts', import.meta.url), {type: 'module'});
  worker.addEventListener('message', (event: MessageEvent<BlindFlangeWorkerMessage>) => {
    const message = event.data;
    if (!message || typeof message !== 'object') {
      return;
    }

    if (message.type === 'progress') {
      pending.get(message.requestId)?.onProgress?.(message);
      return;
    }

    const handler = pending.get(message.requestId);
    if (!handler) {
      return;
    }

    clearPending(message.requestId);

    if (message.ok) {
      handler.resolve(message.payload.step);
      return;
    }

    const payload = message.payload as {message: string; stack?: string};
    const error = new CadWorkerError(payload.message, 'worker');
    if (payload.stack) {
      error.stack = payload.stack;
    }
    handler.reject(error);
  });

  worker.addEventListener('error', (event) => {
    const error =
      event.error instanceof Error
        ? new CadWorkerError(event.error.message, 'worker')
        : new CadWorkerError(String(event.message), 'worker');
    pending.forEach((_handler, requestId) => {
      rejectPending(requestId, error);
    });
    worker = null;
  });

  return worker;
};

type RequestOptions = {
  onProgress?: (message: BlindFlangeWorkerProgress) => void;
  timeoutMs?: number;
  signal?: AbortSignal;
};

const runWorkerRequest = (
  post: (requestId: string, currentWorker: Worker) => void,
  options: RequestOptions,
  timeoutLabel: string,
) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new CadWorkerError('CAD request was cancelled.', 'cancelled'));
      return;
    }

    const requestId = createRequestId();
    const currentWorker = getWorker();
    const timeoutMs = options.timeoutMs;

    const abortHandler = () => {
      rejectPending(requestId, new CadWorkerError('CAD request was cancelled.', 'cancelled'));
      resetCadWorker();
    };

    const timeoutId =
      timeoutMs !== undefined && timeoutMs > 0
        ? setTimeout(() => {
            rejectPending(
              requestId,
              new CadWorkerError(`${timeoutLabel} timed out after ${Math.round(timeoutMs / 1000)}s.`, 'timeout'),
            );
            resetCadWorker();
          }, timeoutMs)
        : undefined;

    pending.set(requestId, {
      resolve,
      reject,
      onProgress: options.onProgress,
      timeoutId,
      abortHandler: options.signal ? abortHandler : undefined,
      signal: options.signal,
    });

    if (options.signal) {
      options.signal.addEventListener('abort', abortHandler, {once: true});
    }

    post(requestId, currentWorker);
  });

export const warmupCadWorker = async (options?: Omit<RequestOptions, 'onProgress'>) => {
  await runWorkerRequest(
    (requestId, currentWorker) => {
      const request: BlindFlangeWarmupRequest = {
        type: 'warmup',
        requestId,
      };
      currentWorker.postMessage(request);
    },
    {
      timeoutMs: options?.timeoutMs ?? CAD_WARMUP_TIMEOUT_MS,
      signal: options?.signal,
    },
    'CAD kernel warmup',
  );
};

export const generateStepInWorker = async (
  geometry: BlindFlangeCadGeometry,
  options?: RequestOptions,
) =>
  runWorkerRequest(
    (requestId, currentWorker) => {
      const request: BlindFlangeStepRequest = {
        type: 'generate-step',
        requestId,
        geometry,
      };
      currentWorker.postMessage(request);
    },
    {
      onProgress: options?.onProgress,
      timeoutMs: options?.timeoutMs ?? CAD_STEP_TIMEOUT_MS,
      signal: options?.signal,
    },
    'STEP generation',
  );

/** Cancel an in-flight CAD job by aborting its signal / resetting the worker. */
export const cancelCadWorkerRequest = (controller?: AbortController) => {
  controller?.abort();
  if (!controller) {
    resetCadWorker();
  }
};
