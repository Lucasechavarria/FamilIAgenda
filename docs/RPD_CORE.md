# 🌟 FamilIAgenda: Documento de Requerimientos del Producto (RPD) - Versión Integral

Este documento es la "Única Fuente de Verdad" del proyecto **FamilIAgenda**. Consolida la visión, arquitectura, guías de estilo, estado actual de funcionalidades y el plan de escalabilidad.

---

## 1. Visión y Objetivos

**FamilIAgenda** redefine la organización del hogar mediante la convergencia de calendarios colaborativos, gestión de tareas y **Inteligencia Artificial generativa**.

### 🎯 Objetivos Estratégicos
*   **Simplicidad mediante IA**: Reducir el tiempo de gestión manual en un 80% mediante interpretación NLP.
*   **Transparencia Familiar**: Visualización clara de responsabilidades mediante un sistema de códigos de colores por miembro.
*   **Productividad Basada en Datos**: Proporcionar métricas accionables sobre la distribución de la carga de trabajo familiar.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Backend** | FastAPI (Python 3.10+) | API robusta y de alto rendimiento. |
| **Base de Datos**| PostgreSQL (Supabase) | Persistencia relacional escalable. |
| **ORM** | SQLModel | Unión de SQLAlchemy y Pydantic. |
| **Frontend** | React 18 + Vite | Interfaz de usuario reactiva y rápida. |
| **Estilos** | Tailwind CSS 4.0 | Diseño moderno y utilitario. |
| **Animaciones** | Framer Motion | Experiencia fluida y premium. |
| **IA** | Groq & Gemini | Procesamiento de lenguaje natural. |

---

## 3. Guía de Estilo de Código 🛠️

Para mantener la consistencia y escalabilidad, se deben seguir estas reglas:

### Backend (Python/FastAPI)
*   **Tipado Estricto**: Uso obligatorio de `typing` (List, Optional, etc.).
*   **Modelos**: Utilizar `SQLModel` para definir esquemas que sirvan tanto para la DB como para validación de API.
*   **Rutas**: Seguir la estructura RESTful. Usar `Depends` para inyección de dependencias (Auth, DB Session).
*   **Documentación**: Todos los endpoints deben incluir `summary` y `description`.

### Frontend (TypeScript/React)
*   **Componentes Funcionales**: Uso exclusivo de Hooks (`useState`, `useEffect`, `useContext`).
*   **Prop Types**: Definir interfaces para todas las props de componentes.
*   **Tailwind**: Evitar estilos inline. Usar clases utilitarias de Tailwind. Para lógica de clases, usar `clsx` o `tailwind-merge`.
*   **Accesibilidad**: Asegurar que todos los elementos interactivos tengan `id` único y etiquetas `aria-*` cuando sea necesario.

---

## 4. Estado de Funcionalidades 📊

A continuación se detalla el progreso actual del sistema:

### ✅ Funcionalidades Desarrolladas (Completas)
*   **Gestión de Eventos y Tareas**: CRUD completo y vista de calendario interactiva.
*   **Compañero Proactivo ("Aura")**: Sistema de "Aura Insights" que detecta conflictos, analiza la carga semanal y sugiere optimizaciones dinámicas con presencia en el chat.
*   **Búsqueda Global (Ctrl+K)**: Motor de búsqueda unificado (Spotlight-style) para eventos, tareas y mensajes con filtros y navegación rápida.
*   **Exportación de Reportes PDF**: Generación de informes semanales estéticos con KPIs de productividad familiar y análisis de IA (utilizando `jsPDF`).
*   **Edición Asistida por IA**: "Magic Assistant" en modales de edición que permite modificar eventos mediante lenguaje natural complejos.
*   **Sistema de Deshacer (Undo)**: Reversión instantánea de cambios accidentales aplicados por la IA.
*   **Micro-interacciones Sensoriales**: Feedback hháptico y sonoro para acciones críticas e insights de la IA.
*   **Notificaciones Push Reales**: Implementación de Service Worker (`sw.js`) y suscripción vía Web Push API.
*   **Persistencia de Sincronización Google**: Modelo `UserIntegration` y lógica de renovación de tokens OAuth activa.
*   **Streaming de IA**: Migración total a SSE (Server-Sent Events) para visualización de respuestas palabra por palabra.

### ⏳ Próximos Pasos (Visión Futura)
*   **Modo Offline Extendido**: Edición local con sincronización diferida (Optimistic Updates).
*   **Reconocimiento de Voz Directo**: Crear eventos mediante comandos de voz desde la app móvil.
*   **Integración con Smart Home**: Sincronización con dispositivos IoT para recordatorios físicos.

---

## 5. Arquitectura de Inteligencia Artificial

El flujo de procesamiento sigue este patrón:

1.  **Entrada**: Texto natural del usuario o telemetría del calendario (para Aura).
2.  **Prompt Engineering**: Inyección de contexto familiar, fecha/hora y esquemas estructurados.
3.  **Inferencia**: Groq (Llama 3.3) / Google Gemini (para visión) procesan la solicitud.
4.  **Validación**: El backend garantiza la integridad de los datos antes de la persistencia.

---

## 6. Infraestructura y Seguridad

*   **Hosting**: Render (Backend) y Vercel (Frontend).
*   **Seguridad**:
    *   JWT con expiración de 24h.
    *   Cifrado de contraseñas con Argon2.
    *   Row Level Security (RLS) en Supabase para aislar datos entre familias.

---

> **Última actualización**: 2026-03-28 (Finalización del Roadmap 3.0: Búsqueda, Reportes y Aura Proactiva)
