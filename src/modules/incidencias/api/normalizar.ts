import { normalizarTiempo } from '@/core/types/tiempo'
import type { Incidencia } from '../types/incidencia.types'

/**
 * Deja el expediente con la forma que espera la pantalla aunque el backend omita
 * un campo (listas vacías, objetos sin datos): así un `null` no tumba la vista.
 */
export function normalizarIncidencia(i: Incidencia): Incidencia {
  return {
    ...i,
    titulo: i.titulo ?? '',
    descripcion: i.descripcion ?? '',
    detalleEspecifico: i.detalleEspecifico ?? {},
    tags: Array.isArray(i.tags) ? i.tags : [],
    historialSeguimiento: Array.isArray(i.historialSeguimiento) ? i.historialSeguimiento : [],
    evidenciasAdjuntas: Array.isArray(i.evidenciasAdjuntas) ? i.evidenciasAdjuntas : [],
    tiempoInvertido: normalizarTiempo(i.tiempoInvertido),
    ubicacion: i.ubicacion ?? { clave: '', edificio: '', aula: '' },
    datosReportante: i.datosReportante ?? { idUsuario: '', nombre: '—' },
    tecnicoAsignado: i.tecnicoAsignado ?? null,
    tecnicoExterno: i.tecnicoExterno ?? null,
    fechas: i.fechas ?? { creacion: '', resolucion: null },
  }
}
