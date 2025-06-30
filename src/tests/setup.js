import { vi } from 'vitest';

// Mock DOM APIs that might be missing in jsdom
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock WebGL context
global.WebGLRenderingContext = vi.fn();
global.WebGL2RenderingContext = vi.fn();

// Mock device pixel ratio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1
});

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn();

// Console setup for tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};