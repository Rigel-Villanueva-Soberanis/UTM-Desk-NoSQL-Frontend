/**
 * Paginado ÚNICO de la app (PrimeVue DataTable). Úsalo así en cualquier tabla:
 *   <DataTable v-bind="PAGINADOR" :rows="tamano" ... />
 * El diseño vive en `assets/paginador.css` (global), así todas se ven igual.
 */
/** Tamaños de página (el backend permite máximo 50). */
export const TAMANOS_PAGINA = [10, 20, 50] as const

export const PAGINADOR = {
  paginator: true,
  /** Arriba sólo «Anterior / Siguiente» (ver paginador.css); abajo el paginado completo. */
  paginatorPosition: 'both' as const,
  rowsPerPageOptions: [...TAMANOS_PAGINA],
  paginatorTemplate: 'CurrentPageReport RowsPerPageDropdown PrevPageLink PageLinks NextPageLink',
  currentPageReportTemplate: 'Mostrando {first} a {last} de {totalRecords} resultados',
}
