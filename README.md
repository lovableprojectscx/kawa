# KAWA - Your AI Blueprint

Un ecosistema avanzado de gestión y orquestación asistida por IA diseñado para Fundadores y Operadores de alto rendimiento. KAWA centraliza la visión, la estrategia, las relaciones, la energía y la ejecución en un solo lugar ("Bóvedas"), integrando tecnologías modernas para brindar una experiencia de usuario fluida y reactiva.

## 🚀 Características Principales

El proyecto se divide en diferentes **"Bóvedas" (Vaults)** especializadas:

*   **Bóveda de Visión y Estrategia:** Define tu estrella polar, anti-metas y OKRs.
*   **Bóveda del Fundador:** Monitorea tu energía diaria, estado de ánimo y prevención de burnout.
*   **Bóveda del Operador:** Gestión de proyectos, tareas en estado de flujo (Kanban) y agenda (calendario integrado).
*   **Bóveda de Contexto y Relaciones:** Un CRM inteligente que registra interacciones, "fun facts" de contactos y los enlaza a proyectos.
*   **Bóveda de Conocimiento:** Sistema de almacenamiento de memoria e insights (con soporte para vectores en el futuro).

Además, incluye **Chat IA integrado** en todos los paneles para interactuar con tus bóvedas y consultar contexto en tiempo real.

## 🛠️ Stack Tecnológico

*   **Frontend:** React 18, Vite, TypeScript
*   **Estilos y UI:** Tailwind CSS, Shadcn UI, Radix UI (Componentes Accesibles)
*   **Autenticación y Base de Datos:** Supabase (PostgreSQL), Row Level Security (RLS)
*   **Estado y Data Fetching:** React Query (@tanstack/react-query)
*   **Enrutamiento:** React Router DOM
*   **Iconografía y Animaciones:** Lucide React, Framer Motion
*   **PWA:** Funcionalidad de Progressive Web App con service workers.

## ⚙️ Requisitos Previos

Para ejecutar este proyecto localmente, necesitas tener instalado:

*   [Node.js](https://nodejs.org/) (versión 18 o superior)
*   [npm](https://www.npmjs.com/) (viene con Node.js)
*   Una cuenta y proyecto en [Supabase](https://supabase.com/).

## 🔑 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en un posible `.env.example`, o simplemente añade las siguientes variables con las credenciales de tu proyecto de Supabase:

```env
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase_aqui
VITE_GOOGLE_API_KEY=opcional_clave_para_gemini
```

## 💻 Instalación y Uso Local

1.  **Clonar el repositorio** e instalar dependencias:
    ```bash
    npm install
    ```

2.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

3.  Abrir `http://localhost:8080` (o el puerto que indique Vite) en el navegador.

## 🌐 Despliegue

La aplicación está configurada para ser compilada de manera estática mediante Vite, siendo fácilmente desplegable a plataformas como Vercel, Netlify o GitHub Pages.

```bash
# Construir para producción
npm run build

# Previsualizar el build final localmente
npm run preview
```
