import { describe, it, expect } from 'vitest';

/**
 * Environment smoke test.
 *
 * Rather than a no-op `expect(true).toBe(true)`, this verifies the whole test
 * toolchain is actually wired up:
 *  - jsdom provides a real `document` so DOM APIs work
 *  - `@testing-library/jest-dom` matchers (e.g. `toHaveTextContent`) are
 *    registered via `vitest.setup.ts`
 *  - Vitest globals (`describe`/`it`/`expect`) resolve correctly
 */
describe('Toolchain setup', () => {
  it('exposes a jsdom DOM environment', () => {
    expect(typeof document).toBe('object');
    expect(document).not.toBeNull();
  });

  it('renders text into a DOM node and matches with jest-dom matchers', () => {
    const el = document.createElement('div');
    el.textContent = 'booking-app';
    document.body.appendChild(el);

    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('booking-app');

    document.body.removeChild(el);
  });

  it('has access to process.env', () => {
    expect(process.env).toBeTypeOf('object');
  });
});
