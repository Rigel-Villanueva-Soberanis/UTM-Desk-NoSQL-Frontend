export interface ErrorDetalle {
  campo: string
  mensaje: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  code?: string
  data: T
  errors: ErrorDetalle[] | null
}

export interface Paginado<T> {
  items: T[]
  pagina: number
  tamanoPagina: number
  total: number
  totalPaginas: number
}
