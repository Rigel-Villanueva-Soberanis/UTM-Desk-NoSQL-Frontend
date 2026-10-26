import { acortar } from '@/core/utils/validacion'

/** Paleta sobria (azul institucional primero) con buen contraste sobre blanco. */
export const PALETA = ['#2563eb', '#0891b2', '#7c3aed', '#d97706', '#059669', '#db2777', '#64748b', '#ca8a04']

const FUENTE = "'Inter Variable', Inter, system-ui, sans-serif"
const TEXTO = '#44474d'
const REJILLA = '#e5eeff'

/** Etiquetas de eje: se cortan con «…» (el tooltip muestra el nombre completo). */
export const etiquetaCorta = (t: string, max = 16) => acortar(t, max)

/** Opciones comunes de las gráficas de barras. */
export function opcionesBarras(opts: { horizontal?: boolean; tituloValor: string; entero?: boolean; etiquetas: string[]; extra?: (i: number) => string[] }) {
  const eje = (esValor: boolean) => ({
    beginAtZero: esValor,
    grid: { color: esValor ? REJILLA : 'transparent' },
    border: { display: false },
    title: esValor ? { display: true, text: opts.tituloValor, color: TEXTO, font: { family: FUENTE, size: 12 } } : { display: false },
    ticks: {
      color: TEXTO,
      font: { family: FUENTE, size: 12 },
      ...(esValor ? { precision: opts.entero ? 0 : undefined } : { callback: (_: unknown, i: number) => etiquetaCorta(opts.etiquetas[i] ?? '') }),
    },
  })
  return {
    indexAxis: opts.horizontal ? ('y' as const) : ('x' as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => opts.etiquetas[items[0]?.dataIndex ?? 0] ?? '',
          afterLabel: (item: { dataIndex: number }) => opts.extra?.(item.dataIndex) ?? [],
        },
      },
    },
    scales: {
      // Barras verticales: x = categorías, y = valores. Horizontales: al revés.
      x: eje(!!opts.horizontal),
      y: eje(!opts.horizontal),
    },
  }
}
