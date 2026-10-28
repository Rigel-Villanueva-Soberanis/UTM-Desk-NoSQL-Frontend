/** Colores rotativos para las etiquetas (siempre el mismo color para el mismo texto). */
export const PALETA_ETIQUETAS = ['azul', 'ambar', 'morado', 'verde', 'cian', 'rosa'] as const
export type ColorEtiqueta = (typeof PALETA_ETIQUETAS)[number]

export const colorEtiqueta = (t: string): ColorEtiqueta =>
  PALETA_ETIQUETAS[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA_ETIQUETAS.length]!
