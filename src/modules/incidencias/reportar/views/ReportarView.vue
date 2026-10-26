<script setup lang="ts">
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import AutoComplete from 'primevue/autocomplete'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Textarea from 'primevue/textarea'
import { useCatalogos } from '@/modules/catalogos/composables/useCatalogos'
import { useSelectorUbicacion } from '@/modules/catalogos/composables/useSelectorUbicacion'
import CampoError from '@/shared/components/CampoError.vue'
import FormularioDinamico from '@/shared/components/FormularioDinamico.vue'
import PantallaVacia from '@/shared/components/PantallaVacia.vue'
import SubirArchivos from '@/shared/components/SubirArchivos.vue'
import { PRIORIDADES } from '../../types/incidencia.types'
import { useReportar } from '../composables/useReportar'

const router = useRouter()
const { categorias, edificios, cargando, error, recargar } = useCatalogos()
const {
  form,
  archivos,
  errores,
  mensaje,
  enviando,
  etapaTexto,
  campos,
  bloqueado,
  creada,
  errorEvidencias,
  enviar,
  omitirEvidencias,
} = useReportar()

// Ubicación: dos campos con búsqueda directa (edificio y, al elegirlo, su salón).
const { edificioElegido, salonElegido, sugerenciasEdificio, sugerenciasSalon, buscarEdificio, buscarSalon } = useSelectorUbicacion(form)

async function alEnviar() {
  const ok = await enviar()
  if (ok) return
  // Lleva el foco al primer campo con error
  await nextTick()
  const primero = document.querySelector<HTMLElement>(
    '.invalido :is(input, textarea, [role="combobox"], [role="button"])',
  )
  primero?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  primero?.focus({ preventScroll: true })
}
</script>

<template>
  <section class="reportar">
    <div class="pagina-titulo">
      <h1>Reportar falla</h1>
      <p>Describe el problema y adjunta fotos si ayudan a entenderlo.</p>
    </div>

    <!-- Estados de los catálogos: carga / error / vacío -->
    <div v-if="cargando && !categorias.length" class="tarjeta-base cargando" aria-busy="true">
      <Skeleton height="2.5rem" />
      <Skeleton height="6rem" />
      <Skeleton height="2.5rem" />
    </div>

    <div v-else-if="error && !categorias.length" class="tarjeta-base">
      <PantallaVacia
        icono="pi pi-exclamation-triangle"
        titulo="No se pudieron cargar los catálogos"
        :texto="error"
      >
        <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="recargar" />
      </PantallaVacia>
    </div>

    <div v-else-if="!categorias.length || !edificios.length" class="tarjeta-base">
      <PantallaVacia
        titulo="Aún no se puede reportar"
        texto="No hay categorías o edificios registrados. Avisa a Soporte de TI."
      />
    </div>

    <form v-else class="tarjeta-base formulario" novalidate @submit.prevent="alEnviar">
      <Message v-if="mensaje" :severity="creada ? 'warn' : 'error'" :closable="false">
        {{ mensaje }}
      </Message>

      <!-- Fila 1: título, ubicación y prioridad -->
      <div class="rejilla">
        <div class="campo c4" :class="{ invalido: !!errores.titulo }">
          <div class="cabecera-campo">
            <label for="titulo">Título de la falla <span class="req" aria-hidden="true">*</span></label>
            <small class="contador">{{ form.titulo.length }}/150</small>
          </div>
          <InputText
            id="titulo"
            v-model="form.titulo"
            maxlength="150"
            placeholder="Ej. Sin internet en el Laboratorio 3"
            :invalid="!!errores.titulo"
            :disabled="bloqueado || enviando"
            fluid
          />
          <CampoError :mensaje="errores.titulo" />
          <small v-if="!errores.titulo" class="ayuda">Sé breve y específico: el problema central y el equipo afectado.</small>
        </div>

        <div class="campo c3" :class="{ invalido: !!errores.claveEdificio }">
          <label for="edificio">Edificio <span class="req" aria-hidden="true">*</span></label>
          <AutoComplete
            v-model="edificioElegido"
            input-id="edificio"
            :suggestions="sugerenciasEdificio"
            option-label="nombre"
            placeholder="Escribe para buscar"
            dropdown
            dropdown-mode="blank"
            force-selection
            complete-on-focus
            :min-length="0"
            :invalid="!!errores.claveEdificio"
            :disabled="bloqueado || enviando"
            fluid
            @complete="buscarEdificio"
          />
          <CampoError :mensaje="errores.claveEdificio" />
        </div>

        <div class="campo c3" :class="{ invalido: !!errores.salon }">
          <label for="salon">Salón <span class="req" aria-hidden="true">*</span></label>
          <AutoComplete
            v-model="salonElegido"
            input-id="salon"
            :suggestions="sugerenciasSalon"
            :placeholder="form.claveEdificio ? 'Escribe para buscar' : 'Primero elige el edificio'"
            dropdown
            dropdown-mode="blank"
            force-selection
            complete-on-focus
            :min-length="0"
            :invalid="!!errores.salon"
            :disabled="bloqueado || enviando || !form.claveEdificio"
            fluid
            @complete="buscarSalon"
          />
          <CampoError :mensaje="errores.salon" />
        </div>

        <div class="campo c2" :class="{ invalido: !!errores.prioridad }">
          <label for="prioridad">Prioridad</label>
          <Select
            v-model="form.prioridad"
            input-id="prioridad"
            :options="PRIORIDADES"
            option-label="etiqueta"
            option-value="valor"
            :invalid="!!errores.prioridad"
            :disabled="bloqueado || enviando"
            fluid
          />
          <CampoError :mensaje="errores.prioridad" />
        </div>
      </div>

      <!-- Fila 2: descripción amplia | categoría y sus detalles -->
      <div class="rejilla centro">
        <div class="campo c7" :class="{ invalido: !!errores.descripcion }">
          <div class="cabecera-campo">
            <label for="descripcion">Descripción detallada <span class="req" aria-hidden="true">*</span></label>
            <small class="contador">{{ form.descripcion.length }}/2000</small>
          </div>
          <Textarea
            id="descripcion"
            v-model="form.descripcion"
            rows="9"
            maxlength="2000"
            auto-resize
            placeholder="¿Qué pasó, desde cuándo, qué síntomas hay y a quién afecta?"
            :invalid="!!errores.descripcion"
            :disabled="bloqueado || enviando"
            fluid
          />
          <CampoError :mensaje="errores.descripcion" />
        </div>

        <div class="c5 derecha">
          <div class="campo" :class="{ invalido: !!errores.categoria }">
            <label for="categoria">Categoría de servicio <span class="req" aria-hidden="true">*</span></label>
            <Select
              v-model="form.categoria"
              input-id="categoria"
              :options="categorias"
              option-label="nombre"
              option-value="clave"
              placeholder="Selecciona una categoría"
              :invalid="!!errores.categoria"
              :disabled="bloqueado || enviando"
              fluid
            />
            <CampoError :mensaje="errores.categoria" />
          </div>

          <fieldset v-if="campos.length" class="detalles">
            <legend>Detalles de la categoría</legend>
            <FormularioDinamico
              v-model="form.detalleEspecifico"
              :campos="campos"
              :errores="errores"
              :disabled="bloqueado || enviando"
            />
          </fieldset>
          <p v-else-if="form.categoria" class="sin-detalles">Esta categoría no pide datos adicionales.</p>
        </div>
      </div>

      <!-- Fila 3: evidencias a todo el ancho -->
      <div class="campo evidencias">
        <span class="etiqueta-grupo">Evidencias y adjuntos <small class="opcional">(opcional)</small></span>
        <SubirArchivos v-model="archivos" :disabled="enviando" :error="errorEvidencias" />
      </div>

      <div class="acciones">
        <template v-if="creada">
          <Button
            type="button"
            label="Continuar sin evidencias"
            severity="secondary"
            :disabled="enviando"
            @click="omitirEvidencias"
          />
          <Button
            type="submit"
            label="Reintentar adjuntar"
            icon="pi pi-refresh"
            :loading="enviando"
          />
        </template>
        <template v-else>
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            :disabled="enviando"
            @click="router.push({ name: 'inicio' })"
          />
          <Button
            type="submit"
            icon="pi pi-send"
            :label="enviando ? etapaTexto : 'Enviar reporte de falla'"
            :loading="enviando"
          />
        </template>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* A todo el ancho de la pantalla (sin tope), como el resto de las vistas. */
.reportar {
  width: 100%;
}
.cargando,
.formulario {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.formulario {
  padding: 28px 32px;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}
.c2 { grid-column: span 2; }
.c3 { grid-column: span 3; }
.c4 { grid-column: span 4; }
.c5 { grid-column: span 5; }
.c6 { grid-column: span 6; }
.c7 { grid-column: span 7; }
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.evidencias {
  container-type: inline-size;
}
.derecha {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
label,
.etiqueta-grupo {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #334155;
}
.req {
  color: #e11d48;
}
.opcional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--on-surface-variant);
}
.cabecera-campo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.contador {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  color: #94a3b8;
}
.ayuda {
  color: #94a3b8;
  font-size: 0.72rem;
}
.detalles {
  margin: 0;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  min-width: 0;
}
.detalles legend {
  padding: 0 8px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #334155;
}
.sin-detalles {
  color: var(--on-surface-variant);
  font-size: 0.8rem;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}
@media (max-width: 1024px) {
  .c2,
  .c3 { grid-column: span 6; }
  .c4,
  .c5,
  .c6,
  .c7 { grid-column: span 12; }
}
@media (max-width: 760px) {
  .formulario {
    padding: 18px 16px;
  }
  .c2,
  .c3 { grid-column: span 12; }
  .acciones {
    flex-direction: column-reverse;
  }
}
</style>
