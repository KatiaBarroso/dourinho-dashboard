/** Embaralhamento Fisher–Yates com aleatoriedade criptográfica. Retorna um novo array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  const random = new Uint32Array(1);
  for (let i = result.length - 1; i > 0; i--) {
    crypto.getRandomValues(random);
    const j = random[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
