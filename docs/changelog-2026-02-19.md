# Reporte de Cambios y Entorno (19 de Febrero de 2026)

Este documento resume los problemas de conexión, errores de configuración, y las soluciones aplicadas en el proyecto KAWA durante esta sesión.

## 1. Resolución del error "Failed to fetch" en Login
- **Problema:** Al intentar iniciar sesión o registrarse, la aplicación arrojaba un error `Failed to fetch`.
- **Causa:** Las variables de entorno en el archivo `.env` (`VITE_SUPABASE_URL` y la clave anónima) apuntaban a un proyecto de Supabase (`KAWA` - `hzngwkraexfxkyafmjpl`) que se encontraba pausado temporalmente, lo que impedía la conexión.
- **Solución Aplicada:**
  - Se reactivó el proyecto original `KAWA` en Supabase y se restauraron las credenciales correctas en el archivo `.env` para reestablecer la conexión principal.

## 2. Añadida la funcionalidad de "Cerrar Sesión"
- **Problema:** No había una forma clara en la interfaz de usuario para cerrar la sesión actual de Supabase y volver a la pantalla de login.
- **Cambios Aplicados:**
  - **`src/components/AppSidebar.tsx` (Escritorio):** Se agregó un botón interactivo (ícono 🚪 `LogOut`) en la zona inferior del panel lateral junto a los ajustes del usuario.
  - **`src/components/MobileSidebar.tsx` (Móvil):** Se agregó el mismo botón inferior, mejorando la alineación para que encaje correctamente en la vista de dispositivos móviles.
  - Se implementó la función asíncrona `supabase.auth.signOut()` conectada al componente `toast` para brindar retroalimentación visual al usuario en cada salida exitosa.

## 3. Resolución del "Error al guardar tu configuración inicial" (Onboarding)
- **Problema:** Durante el momento de registro (Onboarding/Wizard), al presionar "Comenzar" luego de llenar la visión y los límites, se presentaba un fallo que no dejaba avanzar.
- **Causa:** El código en `OnboardingWizard.tsx` intentaba usar la función `upsert` (actualizar/insertar) en la tabla `vault_vision`. Para que `upsert` funcione y no arroje el error *"there is no unique or exclusion constraint matching the ON CONFLICT specification"*, la columna de conflicto requerida (`user_id`) debe ser única a nivel de base de datos.
- **Solución Aplicada Directamente en Base de Datos (SQL):**
  - Se ejecutó el comando para agregar la restricción de unicidad:
    ```sql
    ALTER TABLE public.vault_vision ADD CONSTRAINT vault_vision_user_id_key UNIQUE (user_id);
    ```
  - Adicionalmente, se actualizaron y corrigieron las Políticas de Seguridad a Nivel de Fila (RLS) en la tabla `vault_vision` para asegurar que las políticas del tipo `WITH CHECK` permitan inserciones correctas a nombre del usuario registrado.

## 4. Limpieza (Wipe) Completa de la Base de Datos
- **Acción Solicitada:** Volver al estado de inicio, borrando todo tipo de rastro de usuarios y de datos en bóvedas de prueba.
- **Solución Aplicada:**
  - Se ejecutó una sentencia `TRUNCATE CASCADE` en todas las tablas del operador, administrador, y bóvedas (`vault_vision`, `vault_operator_projects`, `vault_founder_energy`, etc.).
  - Se ejecutó un borrado masivo `DELETE FROM auth.users` vaciando todos los usuarios, incluyendo las cuentas maestras de administrador.
  - El proyecto ha quedado reestablecido de fábrica listo para ser utilizado en su pase a producción o nuevas pruebas desde cero.
