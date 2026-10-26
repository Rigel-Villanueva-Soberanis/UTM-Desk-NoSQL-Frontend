import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** No mostrar avisos automáticos (403, 409, 503…): la pantalla ya muestra el suyo o la llamada es silenciosa. */
    sinAviso?: boolean
  }
}
