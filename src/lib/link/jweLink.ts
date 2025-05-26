// src/lib/link/jweLink.ts
export const JWE_PREFIX = 'TR?jwe='

export async function encodeToken(): Promise<string> {
  return ''
}

export async function decodeToken<T = any>(): Promise<T | null> {
  return {} as T
}

export async function buildFragment(): Promise<string> {
  return '#'
}

export async function parseFragment<T = any>(): Promise<T | null> {
  return {} as T
}
