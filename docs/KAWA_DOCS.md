# KAWA — Documentación Completa del Sistema
**Versión:** MVP · **Fecha:** Marzo 2026

---

## Índice
1. [Visión General](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Base de Datos](#3-base-de-datos)
4. [Páginas](#4-páginas)
5. [Componentes Clave](#5-componentes-clave)
6. [Servicios y Librerías](#6-servicios-y-librerías)
7. [Flujo de IA — Chat & Confirmación](#7-flujo-de-ia--chat--confirmación)
8. [Navegación](#8-navegación)

---

## 1. Visión General

KAWA es un **orquestador estratégico para fundadores**. Conecta visión, proyectos, bienestar y red de contactos en un solo sistema, con una IA central que analiza el contexto guardado y da respuestas personalizadas.

**Stack:**
| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + CSS custom |
| Animaciones | Framer Motion |
| Routing | React Router v6 |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| IA | Google Gemini (via Edge Function) |
| Embeddings | Google Embedding API (text-embedding-004) |
| Gráficas | Recharts |

---

## 2. Arquitectura

```
src/
├── pages/              ← Páginas principales
│   ├── Dashboard.tsx
│   ├── Chat.tsx
│   ├── ProjectsPage.tsx
│   ├── CalendarPage.tsx
│   ├── VaultContext.tsx
│   ├── VaultFounder.tsx
│   ├── VaultContacts.tsx
│   ├── CompaniesPage.tsx   ← Nueva gestión de empresas
│   └── Settings.tsx
├── components/
│   ├── AppLayout.tsx       ← Layout principal (sidebar + mobile header)
│   ├── AppSidebar.tsx      ← Sidebar desktop
│   ├── BottomNav.tsx       ← Navegación mobile (floating pill)
│   ├── context/
│   │   ├── AddPersonDialog.tsx
│   │   └── EditPersonDialog.tsx
│   ├── founder/
│   │   ├── EnergyCheckinDialog.tsx
│   │   └── DailyCheckinManager.tsx
│   ├── operator/
│   │   ├── CreateProjectDialog.tsx
│   │   └── CreateCompanyDialog.tsx ← Nuevo selector/creador de empresas
│   └── onboarding/
│       └── OnboardingWizard.tsx
├── lib/
│   ├── supabase.ts         ← Cliente Supabase
│   ├── gemini.ts           ← generateEmbedding()
│   ├── chatService.ts      ← Toda la lógica del Chat IA
│   ├── documentService.ts  ← Carga de documentos con embeddings
│   └── nav-items.ts        ← Definición de rutas de navegación
└── index.css               ← Tokens de diseño, utilidades mobile
```

---

## 3. Base de Datos

### `vault_companies`
Almacena la estrategia específica de cada empresa.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `name` | TEXT | Nombre de la entidad |
| `vision` | TEXT | Visión a largo plazo |
| `mission` | TEXT | Misión y propósito |
| `anti_goals` | JSONB (array) | Lo que la empresa decidió NO hacer |
| `color` | TEXT | Color identificativo (hex) |
| `created_at` | TIMESTAMPTZ | |

---

---

### `vault_founder_energy`
Registro de check-ins de energía y ánimo.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `mood_score` | INT (1–5) | Ánimo del día |
| `energy_level` | TEXT (high/medium/low) | Nivel de energía |
| `notes` | TEXT | Nota libre del check-in |
| `checkin_date` | TIMESTAMPTZ | Fecha/hora del registro |
| `stress_triggers` | JSONB | Disparadores de estrés (no en UI aún) |

---

### `vault_operator_projects`
Proyectos del Operador.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `name` | TEXT | Nombre del proyecto |
| `description` | TEXT | Descripción |
| `status` | TEXT | `active` / `backlog` / `done` |
| `priority` | INT (1–5) | Nivel de prioridad |
| `deadline` | TIMESTAMPTZ | Fecha límite |
| `company_id` | UUID → vault_companies | Empresa vinculada (opcional) |

---

### `vault_operator_tasks`
Tareas asociadas a proyectos.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `project_id` | UUID → vault_operator_projects | |
| `name` | TEXT | Nombre de la tarea |
| `status` | TEXT | `pending` / `done` |

---

### `vault_operator_calendar_events`
Eventos del calendario.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `event_title` | TEXT | Título del evento |
| `start_time` | TIMESTAMPTZ | Inicio (con timezone correcto) |
| `end_time` | TIMESTAMPTZ | Fin del evento |
| `type` | TEXT | `meeting` / `call` / `task` / `deadline` / `block` |

---

### `vault_context_people`
Red de contactos del fundador.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `name` | TEXT | Nombre del contacto |
| `role` | TEXT | Rol / relación |
| `last_interaction_summary` | TEXT | Resumen de la última interacción |
| `personal_facts` | VECTOR(1536) | Embedding de datos clave (búsqueda semántica) |
| `linked_project_id` | UUID → vault_operator_projects | Proyecto vinculado (sin UI aún) |

---

### `vault_memories`
Memorias que la IA extrae del chat.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `content` | TEXT | Contenido de la memoria |
| `type` | TEXT | `situation` / `decision` / `insight` / `relationship` |
| `memory_date` | TIMESTAMPTZ | Fecha de la memoria |
| `embedding` | VECTOR(1536) | Para búsqueda semántica |

---

### `vault_insights`
Insights generados por la IA.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → auth.users | |
| `content` | TEXT | Texto del insight |
| `created_at` | TIMESTAMPTZ | |

---

## 4. Páginas

### `Dashboard.tsx`
**Ruta:** `/dashboard`

Dashboard principal con métricas en tiempo real.

**Estado que carga:**
- `companies` — de `vault_companies`
- `activeProjects` — count de `vault_operator_projects` con `status=active`
- `pendingTasks` — count de `vault_operator_tasks` con `status=pending`
- `contactsCount` — count de `vault_context_people`
- `latestEnergy` — último registro de `vault_founder_energy`
- `energyData[]` — últimos 7 días de energy + mood para el gráfico
- `projectStats[]` — distribución de proyectos por estado (para el donut chart)
- `recentActivity[]` — actividad reciente mezclando events + memories + tasks
- `todayEvents[]` — eventos del calendario del día de hoy

**Funciones:**
| Función | Descripción |
|---|---|
| `load()` | Carga todo el estado en paralelo con `Promise.all` |
| `getGreeting()` | Retorna "Buenos días/tardes/noches" según la hora |
| `dayLabel(dateStr)` | Formatea fecha como día de semana corto |
| `energyToNum(level)` | Convierte `high/medium/low` a `3/2/1` para el gráfico |
| `CustomTooltip` | Tooltip personalizado para los gráficos Recharts |

**Componentes de UI:**
- KPI Cards (Alineación, Proyectos, Tareas, Energía, Contactos) — clicables, navegan a cada sección
- AreaChart (Estado de Ánimo y Energía — últimos 7 días)
- PieChart (Proyectos por estado)
- BarChart (Actividad reciente)
- Agenda del día (eventos de hoy)

---

### `Chat.tsx`
**Ruta:** `/chat`

Interfaz de chat con la IA KAWA.

**Flujo completo:**
1. Usuario escribe mensaje → `sendMessage()` en `chatService.ts`
2. Smart Router clasifica la intención
3. Si contiene datos guardables → devuelve `ConfirmationCard` en el chat
4. Usuario aprueba → `confirmAndSave()` guarda en Supabase
5. Si es consulta → IA busca en `vault_memories` por embedding y responde

**Estado:**
- `messages[]` — historial de mensajes con `role: user | assistant | confirmation`
- `isLoading` — spinner durante la llamada a la IA
- `pendingData` — datos extraídos esperando confirmación del usuario

---

### `ProjectsPage.tsx`
**Ruta:** `/vault/operator`

Gestión de proyectos y tareas.

**Estado:**
- `projects[]` — todos los proyectos del usuario
- `tasks[]` — todas las tareas
- `filter` — `all | active | backlog | done`
- `selectedProject` — proyecto abierto en el Sheet lateral

**Funciones:**
| Función | Descripción |
|---|---|
| `fetchAll()` | Carga proyectos y tareas en paralelo |
| `openProject(p)` | Abre el Sheet de detalle pre-rellenado |
| `handleSaveProject()` | Actualiza nombre, descripción, estado, prioridad, deadline |
| `handleDeleteProject()` | Elimina el proyecto (con confirm) |
| `handleAddTask(e)` | Inserta nueva tarea en `vault_operator_tasks` |
| `toggleTask(task)` | Alterna `pending` ↔ `done` con optimistic update |
| `deleteTask(id)` | Elimina una tarea con optimistic remove |

**Componentes internos:**
- `CircleProgress` — anillo SVG animado de progreso
- `ProjectCard` — tarjeta con barra de color por prioridad, anillo de progreso, deadline pill

---

### `CalendarPage.tsx`
**Ruta:** `/calendar`

Calendario mensual con eventos guardados.

**Estado:**
- `events[]` — eventos del mes actual desde `vault_operator_calendar_events`
- `selectedDate` — día seleccionado
- `editingEvent` — evento que se está editando (null = modo crear)
- `modalOpen` — visibilidad del modal de edición/creación

**Funciones:**
| Función | Descripción |
|---|---|
| `fetchEvents()` | Carga eventos del mes con filtro por `user_id` y rango de fecha |
| `handleAddEvent(form)` | Inserta nuevo evento. `startTime` y `endTime` se calculan desde el form como `new Date(y,m,d,h,min).toISOString()` |
| `handleEditEvent(event)` | Abre el modal pre-rellenado con datos del evento a editar |
| `handleSaveEvent(form)` | Si hay `editingEvent` → UPDATE, si no → INSERT |
| `handleDeleteEvent(id)` | Elimina evento y refresca |

**Modal de evento:**
Campos: título, tipo (`meeting/call/task/deadline/block`), fecha inicio, hora inicio, hora fin.

---

### `VaultContext.tsx`
**Ruta:** `/vault/context`

Vista de contexto con tabs: Foco · Memorias · Red · Bienestar.

**Tabs:**
| Tab | Fuente de datos | Acción principal |
|---|---|---|
| Foco | `vault_vision` | Editar `north_star` + `anti_goals` inline |
| Memorias | `vault_memories` + `vault_insights` (combinados y ordenados por fecha) | Eliminar por hover |
| Red | `vault_context_people` (preview 4 contactos) | Navegar a `/vault/contacts` |
| Bienestar | `vault_founder_energy` (último registro) | Navegar a `/vault/founder` |

**Funciones:**
| Función | Descripción |
|---|---|
| `fetchAll()` | Carga los 5 queries en paralelo |
| `handleSaveVision()` | UPSERT en `vault_vision` (insert si no existe, update si existe por `id`) |
| `handleDeleteMemory(id, type)` | Elimina de `vault_memories` o `vault_insights` según el tipo |

---

### `VaultFounder.tsx`
**Ruta:** `/vault/founder`

Seguimiento de energía y bienestar del fundador.

**Datos:**
- Historial completo de `vault_founder_energy` ordenado por fecha
- Gráfico de ánimo y energía (AreaChart)
- Card del último check-in

**Usa:** `EnergyCheckinDialog` para registrar nuevos check-ins.

---

### `VaultContacts.tsx`
**Ruta:** `/vault/contacts`

Red de contactos del fundador.

**Funciones:**
| Función | Descripción |
|---|---|
| `fetchContacts()` | Lee `vault_context_people` ordenado por `created_at DESC` |
| Abrir `AddPersonDialog` | Crea nuevo contacto con embedding |
| Abrir `EditPersonDialog` | Edita contacto existente y regenera embedding |
| Eliminar por swipe/botón | DELETE en `vault_context_people` |

---

### `VaultVision.tsx`
**Ruta:** `/vault/vision` (acceso también desde VaultContext tab Foco)

Editor completo de la visión estratégica.

**Funciones:**
| Función | Descripción |
|---|---|
| `fetchVision()` | Lee `vault_vision` con `maybeSingle()` |
| `handleSave()` | UPSERT en `vault_vision` con `north_star` + `anti_goals` |
| `addAntiGoal()` | Agrega item vacío al array local |
| `removeAntiGoal(i)` | Elimina item por índice |
| `updateAntiGoal(i, v)` | Actualiza texto de item |

---

## 5. Componentes Clave

### `AddPersonDialog.tsx`
Dialog para agregar contactos manualmente.

**Campos:** Nombre · Rol · Resumen/Contexto · Datos Clave

**`handleSave()`:**
1. Construye `factsText` = `"Rol: X. Datos clave: Y"`
2. Llama `generateEmbedding(factsText)` → `number[]`
3. INSERT en `vault_context_people`:
   - `name`, `role`, `last_interaction_summary` (limpio, solo el resumen)
   - `personal_facts` = vector VECTOR(1536)

---

### `EditPersonDialog.tsx`
Dialog para editar contactos. **Añade** campo "Datos Clave" que faltaba.

**`handleSave()`:**
1. Construye `factsText` = `"Rol: X. Datos clave: Y. Contexto: Z"`
2. Genera embedding y actualiza `personal_facts` si hay texto
3. UPDATE selectivo (solo actualiza `personal_facts` si se generó un vector)

---

### `EnergyCheckinDialog.tsx`
Dialog modal para registrar check-in de energía.

**Campos:** Ánimo (1–5) · Nivel de energía (high/medium/low) · Notas

**`handleCheckin()`:** INSERT en `vault_founder_energy` con `checkin_date: new Date().toISOString()`

Puede ser controlado (con `openProp` + `onOpenChangeProp`) o no controlado (estado interno).

---

### `DailyCheckinManager.tsx`
Componente global montado en `AppLayout`. Verifica si el usuario ya hizo check-in hoy y muestra un recordatorio flotante si no lo hizo.

---

### `CreateProjectDialog.tsx`
Dialog para crear nuevos proyectos.

**Campos:** Nombre · Descripción · Estado · Prioridad · Deadline

**INSERT** en `vault_operator_projects`.

---

### `OnboardingWizard.tsx`
Wizard inicial que guía al usuario a configurar su visión y primer proyecto. Se muestra automáticamente si el usuario no tiene datos en `vault_vision`.

---

### `AppLayout.tsx`
Layout raíz de todas las páginas autenticadas.

- Desktop: `AppSidebar` (fijo a la izquierda, 208px)
- Mobile: header sticky + `BottomNav` (floating pill)
- Monta `OnboardingWizard` y `DailyCheckinManager` de forma global

---

### `BottomNav.tsx`
Navegación mobile — 4 tabs principales + botón "Más".

- Diseño: **floating pill** con `backdrop-blur-xl`
- Estado activo: fondo `primary/10` + ícono en color primario
- "Más" abre un sheet con animación `spring` (Framer Motion)
- Soporta `safe-area-inset-bottom` para iPhones con home indicator

---

## 6. Servicios y Librerías

### `lib/supabase.ts`
Exporta el cliente Supabase configurado con `SUPABASE_URL` y `SUPABASE_ANON_KEY`.

```ts
import { supabase } from "@/lib/supabase";
```

---

### `lib/gemini.ts`

#### `generateEmbedding(text: string): Promise<number[]>`
Llama a la API de Google Embeddings (modelo `text-embedding-004`) y retorna un vector de 1536 dimensiones.

**Uso:** Se llama antes de insertar cualquier dato que vaya a columnas VECTOR en Supabase (`vault_memories.embedding`, `vault_context_people.personal_facts`).

---

### `lib/chatService.ts`

El núcleo de la IA. Contiene:

#### `sendMessage(message, userId, history)`
Función principal del chat. Ejecuta el **Smart Router**:
1. Construye el prompt del sistema con contexto del usuario (visión, últimas memorias, proyectos activos, energía reciente)
2. Llama a Gemini para clasificar la intención: `save_event | save_contact | save_memory | query | chat`
3. Si es guardable → extrae datos estructurados con `extractContextData()`
4. Retorna `{ reply, pendingData }` al componente de Chat

#### `extractContextData(message, type, userId)`
Usa otro prompt especializado para extraer datos estructurados del mensaje del usuario según el tipo detectado.

**Manejo de timezone:**
El prompt incluye la hora local del usuario + offset UTC (`new Date().toISOString()` + `getTimezoneOffset()`). Esto asegura que "a las 3pm" se guarde como `15:00:00-05:00` (hora local), no como `20:00:00Z` (UTC).

#### `confirmAndSave(type, data, userId)`
Ejecuta el guardado definitivo tras la aprobación del usuario:

| Tipo | Tabla | Campos guardados |
|---|---|---|
| `event` | `vault_operator_calendar_events` | `event_title`, `start_time`, `end_time`, `type` |
| `contact` | `vault_context_people` | `name`, `role`, `last_interaction_summary`, `personal_facts` (VECTOR) |
| `memory` | `vault_memories` | `content`, `type`, `memory_date`, `embedding` (VECTOR) |

Para `contact` y `memory`, genera el embedding **antes** del INSERT.

#### `searchVaultMemories(query, userId)`
Búsqueda semántica en `vault_memories`:
1. Genera embedding del query
2. Llama a función RPC de Supabase `match_memories` (vector similarity search)
3. Retorna las memorias más relevantes para incluir en el contexto del prompt

---

### `lib/documentService.ts`
Servicio para cargar documentos y fragmentarlos en chunks con embeddings. Usado para la base de conocimiento de KAWA.

#### `uploadDocument(file, userId)`
1. Lee el archivo
2. Lo divide en chunks de ~500 palabras
3. Para cada chunk → `generateEmbedding(chunk)` → guarda en tabla de documentos

---

### `lib/nav-items.ts`
Define los ítems de navegación compartidos entre `AppSidebar` y `BottomNav`.

```ts
export const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat",      icon: MessageSquare,   label: "Chat IA" },
  { to: "/vault/operator", icon: Briefcase,  label: "Proyectos" },
  { to: "/vault/context",  icon: Globe,      label: "Contexto" },
  { to: "/calendar",  icon: CalendarDays,    label: "Calendario" },
];
```

Los primeros 4 van en el `BottomNav` principal. El resto va en el menú "Más".

---

## 7. Flujo de IA — Chat & Confirmación

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario escribe mensaje en Chat.tsx                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ sendMessage()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Smart Router (chatService.ts)                              │
│  • Lee contexto: northStar, últimas memorias, proyectos     │
│  • Detecta intención: save_event / save_contact /           │
│    save_memory / query / chat                               │
└──────────┬──────────────────────────────┬───────────────────┘
           │ Guardable                     │ Consulta / Chat
           ▼                              ▼
┌───────────────────────┐     ┌────────────────────────────┐
│ extractContextData()  │     │ searchVaultMemories()      │
│ • Extrae datos        │     │ • Vector search en BD      │
│   estructurados       │     │ • Inyecta contexto en      │
│ • Hora local + TZ     │     │   el prompt de respuesta   │
└──────────┬────────────┘     └──────────────┬─────────────┘
           │                                 │
           ▼                                 ▼
┌───────────────────────┐     ┌────────────────────────────┐
│ ConfirmationCard UI   │     │ Respuesta de texto normal  │
│ • Muestra datos       │     │ en el chat                 │
│   extraídos           │     └────────────────────────────┘
│ • Usuario confirma ✓  │
└──────────┬────────────┘
           │ confirmAndSave()
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase INSERT                                            │
│  • Genera embedding si es contact o memory                  │
│  • Guarda con hora en timezone correcto                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Navegación

### Rutas públicas
| Ruta | Componente |
|---|---|
| `/` | `LandingPage` |
| `/features` | `FeaturesPage` |
| `/pricing` | `PricingPage` |
| `/login` | `Login` |

### Rutas protegidas (requieren auth)
| Ruta | Componente |
|---|---|
| `/dashboard` | `Dashboard` |
| `/chat` | `Chat` |
| `/vault/operator` | `ProjectsPage` |
| `/vault/founder` | `VaultFounder` |
| `/vault/context` | `VaultContext` |
| `/vault/contacts` | `VaultContacts` |
| `/calendar` | `CalendarPage` |
| `/settings` | `Settings` |

Todas las rutas protegidas están envueltas en `<AuthGuard>` que redirige a `/login` si no hay sesión activa.

---

## Pendientes / Roadmap

| Feature | Estado |
|---|---|
| `current_okr` y `why_story` en VaultVision | Sin UI |
| `stress_triggers` en check-in energía | Sin UI |
| `linked_project_id` en contactos | Sin selector |
| Búsqueda semántica de personas en chat | Backend OK, UI pendiente |
| Generación automática de insights | No implementado |
| Modo claro | Tokens listos en CSS, sin toggle |
