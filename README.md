# 🌟 FamilIAgenda

**Organización Familiar Inteligente Potenciada por IA**

FamilIAgenda es una aplicación web moderna diseñada para transformar la gestión del hogar. Combina un calendario compartido robusto, asignación de tareas, chat en tiempo real y métricas de productividad, todo potenciado por Inteligencia Artificial para automatizar la creación de eventos.

![FamilIAgenda Dashboard](public/pwa-512x512.png)

## 🚀 Características Principales

### 📅 Calendario Inteligente
- **Creación con IA**: Describe tu evento en lenguaje natural ("Cena con los abuelos el viernes a las 8") y la IA lo agendará por ti.
- **Recurrencia Avanzada**: Configura eventos que se repiten (diario, semanal, mensual, anual) con control total sobre días y finalización.
- **Categorización Visual**: 6 categorías (Trabajo, Personal, Familia, Salud, Ocio, Escuela) con colores distintivos.

### 👥 Gestión Familiar
- **Asignación de Tareas**: Asigna responsabilidades a miembros específicos de la familia.
- **Colores Personalizados**: Cada miembro elige su propio color para identificar sus tareas de un vistazo.
- **Perfiles de Usuario**: Gestión de avatares y preferencias personales.

### 📊 Dashboard de Métricas
- **Análisis de Productividad**: Visualiza tareas completadas vs. pendientes.
- **Distribución de Carga**: Gráficos para ver quién hace qué y equilibrar las responsabilidades.
- **Histórico**: Filtra estadísticas por semana, mes o histórico completo.

### 💬 Comunicación
- **Chat Familiar**: Sala de chat integrada en tiempo real para coordinación rápida.
- **Notificaciones**: Alertas sobre nuevos eventos y asignaciones.

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS + Framer Motion (Animaciones)
- **Iconos**: Lucide React
- **Estado**: Context API

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Base de Datos**: PostgreSQL (Supabase) / SQLite (Dev)
- **IA**: Groq API / Google Gemini
- **Testing**: Pytest

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Python 3.10+
- PostgreSQL (opcional, usa SQLite por defecto)

### 1. Backend (API)

```bash
cd app
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r ../requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves API (Groq, Supabase, etc.)

# Iniciar servidor
python -m uvicorn main:app --reload
```

### 2. Frontend (Cliente)

```bash
# En la raíz del proyecto
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🧪 Testing

El proyecto incluye una suite completa de pruebas unitarias y de integración.

```bash
# Ejecutar todas las pruebas
python -m pytest testing/

# Ejecutar con cobertura
python -m pytest --cov=app testing/
```

## 🚀 Despliegue

### Backend (Render)
1. Conectar repositorio a Render.
2. Configurar como Web Service.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Agregar variables de entorno.

### Frontend (Vercel)
1. Importar proyecto en Vercel.
2. Framework Preset: Vite.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configurar `VITE_API_URL` apuntando al backend en Render.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Desarrollado con ❤️ para familias organizadas.**
