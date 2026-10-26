const MIN = 'abcdefghijkmnpqrstuvwxyz' // sin l, o (se confunden)
const MAY = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sin I, O
const NUM = '23456789' // sin 0, 1
const SIM = '!@#$%*+-=?'

function al(n: number): number {
  const b = new Uint32Array(1)
  crypto.getRandomValues(b)
  return b[0]! % n
}
const de = (c: string) => c[al(c.length)]!

/** Contraseña temporal de 12 caracteres (mayúsculas, minúsculas, números y símbolos; sin caracteres ambiguos). */
export function generarPassword(): string {
  const todas = MIN + MAY + NUM + SIM
  const c = [de(MIN), de(MAY), de(NUM), de(SIM)]
  while (c.length < 12) c.push(de(todas))
  for (let i = c.length - 1; i > 0; i--) {
    const j = al(i + 1)
    ;[c[i], c[j]] = [c[j]!, c[i]!]
  }
  return c.join('')
}
