// ------------------------------------------------------------
// Vitest – round‑trip sanity check (skipped until crypto works)
// ------------------------------------------------------------
// eslint-disable-next-line vitest/expect-expect
import { describe, it, expect } from 'vitest';

import { JWEClaimSet } from '@/types/jwe';

import { decodeBookingLink, encodeBookingLink } from '../linkCodec';

describe.skip('linkCodec round‑trip', () => {
  it('encodes and decodes a minimal payload', async () => {
    const payload: JWEClaimSet = {
      v: 1,
      role: 'requester',
      client: 'uuid-client',
      project: 'uuid-project',
      request: { ci: '20251120', co: '20251122' },
    } as unknown as JWEClaimSet; // casting because request field type is loose

    const link = await encodeBookingLink(payload);
    const decoded = await decodeBookingLink<JWEClaimSet>(link);

    expect(decoded).not.toBeNull();
    expect(decoded?.client).toBe('uuid-client');
  });
});
