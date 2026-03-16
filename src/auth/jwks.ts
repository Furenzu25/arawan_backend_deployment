import { createPublicKey, KeyObject } from 'crypto';

interface Jwk {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  kid?: string;
  alg?: string;
}

interface JwksResponse {
  keys: Jwk[];
}

export async function fetchSupabasePublicKey(jwksUrl: string): Promise<KeyObject> {
  const res = await fetch(jwksUrl);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);

  const { keys } = (await res.json()) as JwksResponse;
  const ecKey = keys.find((k) => k.kty === 'EC' && k.alg === 'ES256');
  if (!ecKey) throw new Error('No ES256 key found in JWKS');

  return createPublicKey({ key: ecKey, format: 'jwk' });
}
