# Documentación Funcional de KAWA: Arquitectura y Conexiones

Este documento detalla la estructura profunda de KAWA, especificando cada área del sistema, sus funciones concretas y cómo fluyen los datos entre ellas para lograr la "Magia" de un Asistente Operativo Autónomo.

---

## 1. Módulo "Vault Context" (El Cerebro Estratégico)
Esta es la base de datos de conocimiento a largo plazo. Su objetivo es que la IA entienda *quién eres*, *cómo piensas* y *con quién te rodeas*.

### A. Foco y Límites (Visión)
*   **Función:** Define tu "Norte Estrella" (objetivo principal actual) y tus "Anti-Metas" (límites innegociables).
*   **Conexión:** Se inyecta en el `system_prompt` de cada chat. La IA usa el Norte Estrella para darte consejos alineados y usa las Anti-Metas como un filtro de restricción (ej. si dices "trabajaré el fin de semana" y tu anti-meta es "No trabajar fines de semana", la IA te advertirá).

### B. Memorias y Aprendizajes (RAG Context)
*   **Función:** Una bitácora de reflexiones, errores del pasado, reglas de negocio o ideas sueltas.
*   **Conexión:** Almacenadas en Supabase con "Embeddings" (Vectores). Cuando chateas con la IA sobre un tema, el sistema busca matemáticamente las memorias más similares a lo que estás hablando y se las envía ocultas a la IA para darle contexto histórico específico. Además, el "Smart Router" (ver sección 4) guarda memorias aquí automáticamente.

### C. Círculo (CRM de Contactos)
*   **Función:** Directorio de personas clave, proveedores, socios o clientes, con su rol y un resumen de tu relación con ellos.
*   **Conexión:** Si la IA detecta que nombras a una persona importante en el chat, la guarda aquí. Luego, si preguntas "Cuáles eran los datos del de marketing?", la IA busca en este módulo y te responde con precisión.

### D. Energía y Bienestar (Founder Health)
*   **Función:** Registro diario (o semanal) de tu nivel de energía (Baja/Media/Alta) y estado de ánimo (1 al 5).
*   **Conexión:** Se envía como el estado "Actual" al chat de la IA. Permite que la IA module su tono y recomendaciones. Si tu energía es "Baja", priorizará sugerirte delegar tareas o descansar en lugar de agregar trabajo operativo.

---

## 2. Módulo "Vault Operator" (El Motor de Ejecución)
Es la zona de "Hacer". Aquí se aterriza la estrategia en acciones medibles.

### A. Kanban de Proyectos por Empresa (Workspaces)
*   **Función:** Tableros visuales donde los proyectos se mueven entre Backlog, En Progreso y Terminado.
*   **Conexión:** Los proyectos están segmentados por el campo `workspace` (Ej. "Agencia", "Startup"). Al chatear, la IA recibe la lista de proyectos *agrupada por empresa*, permitiéndole actuar como un Project Manager específico para el negocio del que le estás hablando.

### B. Tareas de Proyectos
*   **Función:** Cada proyecto en el Kanban tiene un checklist de tareas hijas.
*   **Conexión:** Calculan automáticamente el progreso (%) del proyecto mostrado en la tarjeta del Kanban. La IA lee las tareas "Pendientes" para decirte exactamente qué tienes que hacer hoy si se lo preguntas.

### C. Calendario de Eventos
*   **Función:** Agenda de reuniones, bloques de tiempo profundo o fechas límite.
*   **Conexión:** Alimentado silenciosamente por el chat (Smart Router). Si dices *"Tengo reunión mañana a las 10am"*, la IA crea el evento en esta base de datos para que lo veas visualmente en el calendario del sistema.

---

## 3. Módulo "Chat & Sesiones" (La Interfaz del Socio)
La forma natural de interactuar con todo tu "Cerebro".

### A. Historial de Sesiones
*   **Función:** Múltiples hilos de chat separados (similar a ChatGPT) para mantener conversaciones temáticas organizadas (ej. "Brainstorming Agencia", "Reflexiones de Domingo").
*   **Conexión:** Guarda los mensajes en `chat_messages` atados a un `session_id`. Permite retomar discusiones pasadas con todo su contexto intacto.

---

## 4. El "Smart Router" (El Orquestador Invisible)
*La pieza de ingeniería más crítica del sistema.*

*   **Función:** Es una función secundaria que corre *después* de que la IA te responde en el chat. Analiza la conversación completa que acabas de tener usando un prompt especializado capaz de extraer formato estructurado (JSON).
*   **Conexiones y Flujos de Datos Autónomos:**
    1.  **Evaluación de Alineación:** Revisa tu Visión (Norte Estrella/Anti-metas). Si la conversación entra en conflicto con tus reglas, guarda una alerta roja en `Memorias`.
    2.  **Extracción de Calendario:** Si detecta un compromiso temporal, inserta una fila en `vault_operator_calendar_events`.
    3.  **Extracción de Contactos:** Si detecta que presentaste a un humano, inserta una fila en `vault_context_people` con un "Embedding" de sus datos personales.
    4.  **Extracción de Memorias y Workspace:** Si detecta contexto valioso, lo guarda en `vault_memories`. **NUEVO:** Extrae si estabas hablando de un `workspace` (Empresa) específico y le pega la etiqueta `[Workspace: TuEmpresa]` al contenido antes de guardarlo.

## Diagrama de Flujo del "Cerebro" (Resumen)

\`\`\`
[TÚ] ---> Hablas en el [CHAT]
            |
            v
1. [INYECCIÓN]: El Chat recolecta Módulo 1 (Visión, Energía) + Módulo 2 (Kanban por Empresa) y se lo envía entero a GEMINI para que te responda inteligentemente.
            |
            v
2. [RESPONDE]: Gemini te da un consejo brillante basado en tus propias reglas y datos.
            |
            v
3. [SMART ROUTER]: Analiza silenciosamente el chat.
            |--> ¿Habló de un evento? ---> Guarda en [Calendario]
            |--> ¿Habló de una persona? -> Guarda en [Círculo]
            |--> ¿Habló de una empresa? -> Lo etiqueta y guarda como [Memoria RAG]
\`\`\`
