/** Sin acentos y en minúsculas, para comparar textos ("Técnico" = "tecnico"). */
export const normalizarTexto = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
