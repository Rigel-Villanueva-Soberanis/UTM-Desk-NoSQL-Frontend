import { api } from '@/core/http/cliente'
import type { Catalogo, ClaveCatalogo, Edificio } from '../types/catalogo.types'

/** GET /api/catalogos — todos los catálogos (todos los roles). */
export const listar = () => api.get<Catalogo<unknown>[]>('/api/catalogos')

/** GET /api/catalogos/{clave} */
export const obtener = <T>(clave: ClaveCatalogo) => api.get<Catalogo<T>>(`/api/catalogos/${clave}`)

/** GET /api/catalogos/{clave}/elementos/{elemento} — `elemento` es `clave` (o `rol` en roles_sistema). */
export const obtenerElemento = <T>(clave: ClaveCatalogo, elemento: string) =>
  api.get<T>(`/api/catalogos/${clave}/elementos/${encodeURIComponent(elemento)}`)

/** POST /api/catalogos/{clave}/elementos — agrega un elemento (Root, Soporte). El body es el elemento tal cual. */
export const agregarElemento = (clave: ClaveCatalogo, elemento: object) =>
  api.post<unknown>(`/api/catalogos/${clave}/elementos`, elemento)

/** PATCH /api/catalogos/{clave}/elementos/{elemento} — edita solo los campos enviados (Root, Soporte). */
export const editarElemento = (clave: ClaveCatalogo, elemento: string, cambios: object) =>
  api.patch<unknown>(`/api/catalogos/${clave}/elementos/${encodeURIComponent(elemento)}`, cambios)

/** PATCH /api/catalogos/edificios/elementos/{clave}/salones — suma salones a los que ya tiene (400 si alguno ya existe o se repite). Devuelve el edificio completo. */
export const agregarSalones = (claveEdificio: string, salones: string[]) =>
  api.patch<Edificio>(`/api/catalogos/edificios/elementos/${encodeURIComponent(claveEdificio)}/salones`, { salones })

/** PATCH /api/catalogos/edificios/elementos/{clave}/salones/{salon} — renombra un salón (400 si el nombre ya existe, 404 si no existe). Devuelve el edificio completo. */
export const renombrarSalon = (claveEdificio: string, salon: string, nuevo: string) =>
  api.patch<Edificio>(
    `/api/catalogos/edificios/elementos/${encodeURIComponent(claveEdificio)}/salones/${encodeURIComponent(salon)}`,
    { salon: nuevo },
  )
