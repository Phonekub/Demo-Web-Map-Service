/*
  sls-alm-slmap-web/src/setupTests.ts
  Global Jest test setup.

  - Adds jest-dom matchers via @testing-library/jest-dom
  - Provides lightweight browser API mocks commonly needed by React components:
    - window.matchMedia
    - ResizeObserver
    - requestAnimationFrame / cancelAnimationFrame
  - Keeps things minimal and safe for unit tests.
*/

import '@testing-library/jest-dom';

/**
 * Minimal mock for window.matchMedia so components that use it won't throw in tests.
 * Provides the essential properties/methods used by most libraries/components.
 */
if (typeof window !== 'undefined' && !('matchMedia' in window)) {
  (window as any).matchMedia = (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

/**
 * Lightweight ResizeObserver mock.
 * Some UI libs (and layout logic) rely on ResizeObserver during render.
 */
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  class MockResizeObserver {
    callback: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.callback = cb;
    }
    observe() {
      // no-op
    }
    unobserve() {
      // no-op
    }
    disconnect() {
      // no-op
    }
  }

  (globalThis as any).ResizeObserver = MockResizeObserver;
}

/**
 * requestAnimationFrame / cancelAnimationFrame polyfill for Node/Jest environment.
 */
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(Date.now()), 0) as unknown as number;
  };
}

if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = (id?: number) => {
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  };
}

/**
 * dialog element polyfill for tests:
 * - Some components call `dialog.showModal()` / `dialog.close()` in the DOM.
 * - JSDOM may not implement `HTMLDialogElement.showModal()`; provide a minimal polyfill
 *   that sets/removes the `open` attribute so tests that query dialog content work.
 */
if (
  typeof HTMLDialogElement !== 'undefined' &&
  !(HTMLDialogElement.prototype as any).showModal
) {
  (HTMLDialogElement.prototype as any).showModal = function () {
    try {
      // Mark dialog as open (simplified)
      this.setAttribute('open', '');
      // Optionally make it visible for assertions (no-op for JSDOM)
    } catch (e) {
      // ignore
    }
  };

  (HTMLDialogElement.prototype as any).close = function () {
    try {
      this.removeAttribute('open');
    } catch (e) {
      // ignore
    }
  };
}

/**
 * Optional: Bump default test timeout for slow CI environments (adjust if needed).
 * Uncomment if you encounter tests that legitimately need more time.
 */
// // jest.setTimeout(10000);

/*
  If you need to add test-wide MSW server start/stop handlers or other global
  behaviors, consider creating a `src/test/setupServer.ts` and importing it here.
*/
