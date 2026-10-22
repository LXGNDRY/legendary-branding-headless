import {captureError} from '~/lib/monitoring';

/**
 * Runs a NON-critical dependency of a page (cart summary, menu, analytics
 * lookup, ...). If it rejects or exceeds its budget the page renders with
 * `fallback` and the failure is reported, instead of the whole request failing.
 * Critical data (e.g. localization, which sets currency) must not use this.
 */
export async function optional<T>(
  label: string,
  work: Promise<T> | (() => Promise<T>),
  options: {ms: number; fallback: T},
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<symbol>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), options.ms);
  });
  try {
    const promise = typeof work === 'function' ? work() : work;
    // A late rejection after the budget is already spent must not become an unhandled rejection.
    promise.catch(() => undefined);
    const result = await Promise.race([promise, timeout]);
    if (result === TIMED_OUT) {
      captureError(new Error(`${label} exceeded its ${options.ms}ms budget`), {optional: label, failure: 'timeout'});
      return options.fallback;
    }
    return result as T;
  } catch (error) {
    captureError(error, {optional: label, failure: 'error'});
    return options.fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const TIMED_OUT = Symbol('timed-out');
