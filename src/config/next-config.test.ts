import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

describe('Next.js config', () => {
  it('allows payment proof uploads that pass app validation through Server Actions', () => {
    expect(nextConfig.experimental?.serverActions?.bodySizeLimit).toBe('5mb');
  });
});
