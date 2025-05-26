import type { JWEClaimSet } from '@/types/jwe'

export async function encodeBookingLink(): Promise<string> {
  return '#'
}

export async function decodeBookingLink<T = JWEClaimSet>(): Promise<T | null> {
  return {} as T
}
