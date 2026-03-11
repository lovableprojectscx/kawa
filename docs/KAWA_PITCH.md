# KAWA — Informe Completo de Funciones
### Pitch MVP · Marzo 2026

---

## ¿Qué hace KAWA?

KAWA es un **orquestador estratégico con IA** para fundadores.
Integra en una sola plataforma:
- Tu **visión y estrategia por empresa** (Misión, Visión, Límites)
- Tu **gestión de proyectos y tareas** (vinculados a cada empresa)
- Tu **agenda y calendario**
- Tu **red de contactos clave**
- Tu **bienestar y energía**
- Una **IA con memoria persistente** que conoce el negocio y al fundador

El sistema no solo almacena datos — los conecta y los pone a disposición de la IA, que puede responderte de forma personalizada, recordar lo que le contaste hace semanas, y ayudarte a tomar mejores decisiones.

---

## El Problema

Los fundadores enfrentan un problema de **fragmentación cognitiva**:

| Situación | Consecuencia |
|---|---|
| Usan 5–8 herramientas distintas | El contexto se pierde entre apps |
| No hay IA que los conozca de verdad | Respuestas genéricas que no sirven |
| No registran su energía ni ánimo | Toman decisiones críticas agotados |
| Su red está en WhatsApp y notas sueltas | No hay visibilidad de relaciones |
| No tienen foco escrito | El día se va sin avanzar lo importante |

KAWA resuelve todo esto en **un solo lugar**.

---

## Las 8 Funciones del MVP — Detalle Completo

---

### FUNCIÓN 1: Dashboard Inteligente
**Ruta:** `/dashboard`

#### ¿Qué es?
La pantalla de inicio que muestra el estado completo del fundador al abrir la app. No requiere navegación — todo lo relevante está visible en segundos.

#### ¿Qué contiene?

**Saludo personalizado con la hora:**
> "Buenas tardes, Jaci. Miércoles, 11 de Marzo."

Usa el nombre del usuario y adapta el saludo (buenos días / tardes / noches) automáticamente.

**5 KPI Cards:**
| Card | Dato mostrado | Dónde va al hacer clic |
|---|---|---|
| Empresas | Número de empresas registradas | `/vault/companies` |
| Alineación | Coherencia promedio de tus empresas | `/vault/companies` |
| Proyectos | Proyectos vinculados a tus negocios | `/vault/operator` |
| Tareas | Tareas críticas del día | `/vault/operator` |
| Energía | Último registro de bienestar | `/vault/founder` |

**Gráfico de Ánimo y Energía (últimos 7 días):**
- Área chart con dos líneas: ánimo (morado) y energía (ámbar)
- Muestra la tendencia para que el fundador identifique patrones
- Si hay catch del día, muestra una pill: "Hoy: Media"

**Gráfico de Proyectos por Estado (donut):**
- Distribución visual: activos · en espera · terminados
- Si no hay proyectos: muestra CTA para crear el primero

**Actividad Reciente del Cerebro:**
- Mezcla memorias guardadas + eventos + tareas completadas
- Ordenados por fecha, con icono y tipo (evento / memoria)

**Agenda del día (panel "Hoy"):**
- Lista de eventos del día actual del calendario
- Con hora de inicio y tipo del evento
- CTA "Ver todo" para ir al calendario completo

**Links rápidos de navegación:**
Botones visuales para ir a: Proyectos · Contexto · Bienestar · Contactos

**Aviso de acción pendiente:**
Si el usuario no tiene Norte Estrella definida, aparece un banner al fondo invitándolo a completarla para activar el score de alineación.

---

### FUNCIÓN 2: Chat IA con Memoria
**Ruta:** `/chat`

#### ¿Qué es?
La IA central de KAWA. A diferencia de ChatGPT o Gemini genérico, este chat tiene acceso a toda tu información guardada en el sistema: tu visión, proyectos, últimas memorias, energía reciente y contactos.

#### Flujo completo paso a paso:

**Paso 1 — El usuario escribe**
```
Usuario: "Tengo reunión con el CEO de Winner Organa hoy a las 3pm"
```

**Paso 2 — Smart Router analiza la intención**
El sistema usa Gemini para clasificar si el mensaje requiere guardar algo:
- `save_event` → quiere agendar algo
- `save_contact` → menciona a una persona nueva
- `save_memory` → comparte algo importante (decisión, aprendizaje)
- `query` → pregunta sobre sus datos
- `chat` → conversación libre

En este caso: `save_event`

**Paso 3 — Extracción de datos estructurados**
El sistema llama a un segundo prompt especializado que extrae:
```json
{
  "event_title": "[Winner Organa] Reunión con el CEO de Winner Organa",
  "start_time": "2026-03-11T15:00:00-05:00",
  "end_time": "2026-03-11T16:00:00-05:00",
  "type": "meeting"
}
```
Nota: La hora se guarda en el timezone local del usuario (no UTC), gracias a que el prompt incluye `offset: -300`.

**Paso 4 — Tarjeta de Confirmación aparece en el chat**
```
📅 Evento detectado

[Winner Organa] Reunión con el CEO de Winner Organa
📆 11 de marzo · 15:00 — 16:00
🏷️ Reunión

[ Confirmar ✓ ]  [ Cancelar ]
```

**Paso 5 — El usuario confirma**
Al hacer clic en "Confirmar", el dato se guarda en `vault_operator_calendar_events`.

**Paso 6 — La IA responde conversacionalmente**
```
KAWA: "Entendido. ¿Tienes algo que preparar para esta reunión?"
```

---

#### Casos de uso del chat:

**Guardar un evento:**
> "Reunión con Ana mañana a las 10am"

**Guardar un contacto:**
> "Conocí hoy a Pablo Rivas, es CTO de Startup X, puede ser inversor interesado en la ronda seed"

**Guardar una memoria:**
> "Aprendí que cuando tomo decisiones desde el miedo, siempre me arrepiento"

**Consultar tu situación:**
> "¿En qué debo enfocarme hoy?"
> KAWA revisa: las visiones de tus empresas activas + proyectos prioritarios + energía del día.

**Preguntar por una empresa:**
> "¿Cuál es la visión de [Empresa X]?"
> KAWA responde con la estrategia específica guardada en tu bóveda.

---

### FUNCIÓN 3: Proyectos y Tareas
**Ruta:** `/vault/operator`

#### ¿Qué es?
Sistema de gestión de proyectos diseñado para fundadores: simple, visual y sin fricción.

#### Flujo de creación:
1. Clic en "+ Nuevo Proyecto"
2. Completa: nombre, descripción, estado, prioridad (1–5), fecha límite
3. El proyecto aparece en la grilla con todos sus indicadores visuales

#### ¿Qué muestra cada tarjeta de proyecto?
- **Barra de color en el top** → codificada por prioridad (rojo = crítica, naranja = alta, amarillo = media, azul = normal, gris = baja)
- **Estado** con punto de color → verde (Activo) · ámbar (Espera) · rojo/primary (Listo)
- **Anillo de progreso circular** → % de tareas completadas
- **Descripción** en 2 líneas máximo
- **Contador de tareas** → "3/7 tareas"
- **Deadline** → pill con fecha, roja si ya venció

#### Filtros disponibles:
- Todos · Activos · En Espera · Terminados (con contadores en badges)

#### Panel lateral de detalle (Sheet):
Al hacer clic en un proyecto se abre un panel lateral con:
- Campos editables: nombre, descripción, estado, prioridad, deadline
- Lista de tareas con checkboxes (toggle pending/done)
- Barra de progreso lineal animada entre las tareas
- Formulario para agregar nueva tarea
- Botón eliminar (con confirmación)
- Botón guardar cambios

---

### FUNCIÓN 4: Calendario
**Ruta:** `/calendar`

#### ¿Qué es?
Calendario mensual para ver y gestionar todos los eventos del fundador.

#### Vista:
- Navegación mes anterior / mes siguiente
- Grid semanal (Lun–Dom)
- Día de hoy destacado en rosa (color primario)
- Días con eventos muestran un punto indicador
- Panel lateral derecho con eventos del día seleccionado

#### Tipos de eventos:
| Tipo | Descripción |
|---|---|
| `meeting` | Reunión |
| `call` | Llamada |
| `task` | Tarea con tiempo asignado |
| `deadline` | Fecha límite de entrega |
| `block` | Bloque de tiempo bloqueado |

#### Creación manual:
1. Clic en "+ Nuevo evento" o en un día del calendario
2. Modal con: título · tipo · fecha inicio · hora inicio · hora fin
3. Se guarda en `vault_operator_calendar_events` con timezone correcto

#### Creación por IA:
El usuario escribe en el chat:
> "Tengo demo con inversores el jueves a las 11am"

La IA extrae los datos, muestra la tarjeta de confirmación, y al aprobar se guarda automáticamente con la hora en el timezone del usuario.

#### Edición:
- Clic en el ícono de edición de cualquier evento → abre modal pre-rellenado
- Se puede cambiar título, tipo, hora de inicio y fin
- Botón de eliminar en el modal

---

### FUNCIÓN 5: Contexto — El Cerebro de KAWA
**Ruta:** `/vault/context`

#### ¿Qué es?
La sección más importante del sistema. Almacena todo lo que la IA necesita saber sobre el fundador. Tiene 4 tabs:

---

#### Tab 1: Empresas (Visión Multi-Entidad)
**¿Qué guarda?**
- **Misión y Visión** por cada una de tus empresas.
- **Anti-objetivos (Límites)**: Qué decidió NO hacer cada empresa.
- **Identidad**: Colores y nombres que personalizan la experiencia.

**¿Cómo lo usa la IA?**
KAWA entiende que puedes liderar varios frentes. Al hablar de un proyecto, sabe a qué empresa pertenece y qué objetivos estratégicos debe cumplir esa entidad en particular.

---

#### Tab 2: Memorias
**¿Qué guarda?**
- Memorias que le contaste en el chat (decisiones, aprendizajes, situaciones)
- Insights generados por la IA
- Ordenados cronológicamente

**Ejemplo de memorias:**
- 🧠 "Cuando trabajé bajo presión el Q3, tomé decisiones reactivas que me costaron 2 clientes"
- 💡 Insight: "Tu energía baja correlaciona con cierres de semana sin revisión de prioridades"

**¿Cómo las usa la IA?**
Antes de responderte, KAWA hace una búsqueda semántica en tus memorias para incluir contexto relevante en su respuesta.

**Acción disponible:** Eliminar cualquier memoria con hover + botón de papelera.

---

#### Tab 3: Red (Contactos preview)
Muestra un preview de tus últimos 4 contactos con nombre, rol y avatar con iniciales.

Link directo a la lista completa de contactos.

---

#### Tab 4: Bienestar
Muestra el último check-in de energía:
- Ánimo en grande (ej. "2/5")
- Nivel de energía con color (Alta ⚡ / Media 🔋 / Baja 🪫)
- Nota del check-in si la escribiste

Link directo al registro completo de bienestar.

---

### FUNCIÓN 6: Red de Contactos
**Ruta:** `/vault/contacts`

#### ¿Qué es?
La agenda inteligente del fundador. No es solo una lista de nombres — cada contacto tiene un embedding vectorial que permite a la IA hacer búsquedas semánticas.

#### Datos por contacto:
| Campo | Descripción |
|---|---|
| Nombre | Nombre completo |
| Rol / Relación | Socia/o · Cliente · Proveedor · Mentora · Equipo · Inversor |
| Resumen / Contexto | Última interacción, en qué trabajan, qué los conecta |
| Datos Clave | Hechos personales (ej. "Vegano · CEO de Empresa X · Cumpleaños 15 marzo") |
| Embedding | Vector 1536 dimensiones para búsqueda semántica |

#### Flujo de creación manual:
1. Clic en "+ Agregar Contacto"
2. Llenar nombre, rol, resumen y datos clave
3. Al guardar → se genera un **embedding vectorial** de los datos
4. El contacto queda disponible para búsqueda semántica de la IA

#### ¿Qué es el embedding y para qué sirve?
Es una representación matemática del texto en un espacio de 1536 dimensiones. Permite que la IA encuentre a alguien aunque no recuerdes exactamente el nombre.

**Ejemplo:**
> Usuario: "¿Quién de mi red trabaja en fintech y puede ayudarme con una introducción?"
> KAWA busca en todos los contactos por similaridad semántica y encuentra a la persona relevante.

#### Edición de contacto:
- Clic en el contacto → abre diálogo de edición
- Incluye campo de "Datos Clave" nuevo
- Al guardar se **regenera el embedding** con los datos actualizados

---

### FUNCIÓN 7: Bienestar del Fundador
**Ruta:** `/vault/founder`

#### ¿Qué es?
Sistema de seguimiento del estado físico y mental del fundador.

#### ¿Por qué importa?
Los fundadores toman decisiones importantes todos los días. Cuando están agotados, las decisiones son peores. KAWA registra patrones de bienestar para que el fundador se conozca mejor — y para que la IA adapte sus respuestas según el estado del día.

#### Check-in diario:
**Recordatorio automático:**
Cada día, KAWA muestra un toast de recordatorio al abrir la app si todavía no hiciste el check-in del día.

**3 campos del check-in:**
1. **Ánimo** (1–5):
   - 5 = 😁 Excelente
   - 4 = 🙂 Bien
   - 3 = 😐 Normal
   - 2 = 😕 Bajo
   - 1 = 😫 Agotado

2. **Nivel de energía:**
   - Alta ⚡ (verde)
   - Media 🔋 (ámbar)
   - Baja 🪫 (rojo)

3. **Nota libre** (opcional):
   > "Dormí mal, tenía ansiedad por el pitch de mañana"

#### ¿Qué muestra la página?
- Último check-in con fecha, ánimo, energía y nota
- Gráfico de área con la tendencia de los últimos 7 días (ánimo + energía en dos líneas)
- Historial completo de check-ins

#### ¿Cómo usa la IA este dato?
Cuando el fundador pregunta "¿qué debo hacer hoy?", si la energía está en "Baja", KAWA puede sugerir tareas menos demandantes o recordarle que cuide su energía antes de decisiones importantes.

---

### FUNCIÓN 8: Norte Estrella — Enfoque Estratégico
**Ruta:** `/vault/vision` (también accesible desde Contexto → tab Foco)

#### ¿Qué es?
El documento más importante del sistema. Define hacia dónde va el fundador y qué NO hará para proteger ese foco.

#### ¿Qué guarda?
**Foco Actual (Norte Estrella):**
Una oración clara, específica y accionable. Se recomienda enfocarlo a 1–2 semanas.

Ejemplo malo: "Crecer mi empresa"
Ejemplo bueno: "Cerrar 5 ventas esta semana en Idenza usando el canal de referidos"

**Lo que NO haré (Anti-metas):**
Lista de límites explícitos para proteger el foco.
- "No entraré en negociaciones de más de 2 horas esta semana"
- "No voy a tomar reuniones sin agenda"
- "No voy a empezar el módulo de marketing hasta terminar ventas"

#### ¿Cómo usa esto el sistema?
1. **El Dashboard** calcula un "% de Alineación" basado en si las actividades recientes tienen relación con el Norte Estrella
2. **El Chat IA** siempre tiene el Norte Estrella en su contexto, así puede evaluar si lo que te propone está alineado con tu objetivo
3. **Las respuestas de la IA** son diferentes si tienes o no tienes Norte Estrella definida

---

## Cómo se Conecta Todo — El Mapa de la IA

```
┌──────────────────────────────────────────────────────────┐
│                    TÚ (el fundador)                      │
│    hablas, escribes, confirmas, haces check-in           │
└─────────────────────────┬────────────────────────────────┘
                          │
                    ┌─────▼──────┐
                    │ CHAT IA    │  ← Punto de entrada principal
                    └─────┬──────┘
                          │
         ┌────────────────▼────────────────────┐
         │         SMART ROUTER                │
         │  Detecta intención del mensaje      │
         └─┬──────────┬──────────┬─────────────┘
           │          │          │
     save_event  save_contact  save_memory    query/chat
           │          │          │                │
           ▼          ▼          ▼                ▼
    Confirmación  Confirmación  Confirmación  Búsqueda
    de evento     de contacto   de memoria    semántica
           │          │          │            en memorias
           └──────────┴──────────┘                │
                      │                           │
               Usuario aprueba                    │
                      │                           │
               ┌──────▼──────────────────────┐    │
               │   SUPABASE (Base de datos)  │    │
               │  vault_calendar_events      │    │
               │  vault_context_people       │    │
               │  vault_memories             │◄───┘
               │  vault_vision               │
               │  vault_founder_energy       │
               └─────────────────────────────┘
                      │
               Todo este contexto
               alimenta la IA en
               cada conversación
```

---

## Por Qué Es Diferente a Todo lo Que Existe

| Herramienta | ¿Qué hace bien? | ¿Qué le falta? |
|---|---|---|
| **Notion** | Documentación flexible | Sin IA real, sin contexto personal, sin memoria |
| **ChatGPT** | Conversación inteligente | Sin memoria, no sabe quién eres, sin datos propios |
| **Asana / Linear** | Gestión de proyectos | Solo proyectos, sin visión, sin bienestar, sin IA |
| **Google Calendar** | Agenda y eventos | No se conecta con nada, sin IA, sin contexto |
| **Notion AI** | IA sobre documentos | Sin conexión entre secciones, sin memoria de ti |
| **KAWA** | **Todo lo anterior junto** | **Con IA que te conoce y conecta todo** |

**La diferencia clave:** En KAWA, la IA no responde en el vacío. Responde sabiendo que tu energía está baja, que tu proyecto "Ventas Q1" tiene un deadline esta semana, que Ana Torres es tu socia y que tu Norte Estrella es cerrar 5 ventas. Esa combinación no existe en ninguna otra herramienta.

---

## Estado del MVP — Qué Funciona Hoy

| Módulo | Funcionalidad | Estado |
|---|---|---|
| **Dashboard** | KPIs en tiempo real, gráficos, agenda del día | ✅ Completo |
| **Chat IA** | Smart Router, detección de intención | ✅ Completo |
| **Chat IA** | Tarjeta de confirmación antes de guardar | ✅ Completo |
| **Chat IA** | Búsqueda semántica en memorias | ✅ Completo |
| **Chat IA** | Timezone correcto en eventos | ✅ Completo |
| **Empresas** | Gestión multi-empresa (Visión, Misión, Anti-metas) | ✅ Completo |
| **Proyectos** | Vincular proyectos a empresas con badges coloridos | ✅ Completo |
| **Filtros** | Filtrar todo el trabajo por empresa específica | ✅ Completo |
| **Dashboard** | Resumen visual de visiones de empresas | ✅ Completo |
| **Recordatorio daily** | Toast automático si no hiciste check-in | ✅ Completo |
| **Mobile** | Diseño responsive, nav flotante, safe-area | ✅ Completo |
| **Autenticación** | Login con Supabase Auth, rutas protegidas | ✅ Completo |
| **Modo oscuro** | Dark mode por defecto | ✅ Completo |

### Próximos pasos (Post-MVP):
| Feature | Descripción |
|---|---|
| Modo claro | Toggle dark/light |
| OKRs y Why Story | Más profundidad en la visión estratégica |
| Stress triggers | Registro de factores que afectan el bienestar |
| Generación de insights automáticos | La IA genera insights sin que tengas que pedirlos |
| Vinculación contacto-proyecto | Asociar contactos directamente a proyectos |

---

## Para el Pitch — Frases de Posicionamiento

> **Una línea:**
> "KAWA es el segundo cerebro con IA para fundadores que quieren operar con claridad, sin el caos."

> **Para inversores:**
> "Construimos la capa de contexto personal que hace que la IA sea verdaderamente útil para los tomadores de decisiones más exigentes: los fundadores."

> **Para fundadores:**
> "¿Cuántas veces en el día cambias de herramienta y pierdes el hilo? KAWA lo conecta todo y tiene una IA que ya sabe quién eres."
