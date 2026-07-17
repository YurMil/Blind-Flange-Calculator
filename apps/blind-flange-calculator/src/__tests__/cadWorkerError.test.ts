import {describe, expect, it} from 'vitest';
import {CadWorkerError} from '../cad/services/cad-worker-client';

describe('CadWorkerError', () => {
  it('exposes typed error codes for timeout and cancel', () => {
    const timeout = new CadWorkerError('STEP generation timed out after 120s.', 'timeout');
    const cancelled = new CadWorkerError('CAD request was cancelled.', 'cancelled');

    expect(timeout.code).toBe('timeout');
    expect(timeout.name).toBe('CadWorkerError');
    expect(cancelled.code).toBe('cancelled');
  });
});
