# 🏠 FamilIAgenda - Smart Family Calendar

<div align="center">

![FamilIAgenda Logo](https://img.shields.io/badge/FamilIAgenda-Smart%20Calendar-blue?style=for-the-badge)

**Calendario familiar inteligente con IA integrada**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## 🌟 Características

- 📅 **Calendario Familiar Compartido**: Gestiona eventos de toda la familia en un solo lugar
- 🤖 **IA Integrada (Google Gemini)**: Crea eventos con lenguaje natural
- 🔔 **Notificaciones Inteligentes**: Recordatorios automáticos personalizables
- 💬 **Chat Familiar en Tiempo Real**: WebSocket para comunicación instantánea
- ✅ **Gestión de Tareas**: Asigna y completa tareas familiares
- 🎨 **UI Premium**: Diseño moderno con animaciones fluidas
- 🔐 **Autenticación Segura**: JWT + bcrypt para máxima seguridad
- 📱 **Responsive**: Funciona perfectamente en móviles y desktop

---

## 🚀 Tech Stack

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLModel** - ORM con validación Pydantic
- **PostgreSQL** (Supabase) - Base de datos robusta
- **Google Gemini AI** - Procesamiento de lenguaje natural
- **WebSockets** - Comunicación en tiempo real
- **JWT** - Autenticación segura

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Utility-first CSS
- **React Router** - Navegación

---

## 📋 Requisitos Previos

- Python 3.11+
- Node.js 18+
- PostgreSQL (o cuenta de Supabase)
- Google Gemini API Key

---

## ⚙️ Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Lucasechavarria/FamilIAgenda.git
cd FamilIAgenda
```

### 2. Configurar Backend

```bash
# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### 3. Configurar Frontend

```bash
# Instalar dependencias
npm install
```

### 4. Variables de Entorno

Edita `.env` con tus credenciales:

```env
# Database (Producción - Connection Pooler)
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🏃 Ejecutar Localmente

### Backend

```bash
python -m uvicorn app.main:app --reload --port 8000
```

API disponible en: http://localhost:8000
Documentación: http://localhost:8000/docs

### Frontend

```bash
npm run dev
```

App disponible en: http://localhost:5173

---

## 🌐 Deployment

### Backend (Render.com)

1. Conecta tu repositorio en [Render.com](https://render.com)
2. Configura:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Agrega variables de entorno desde `.env.example`

### Frontend (Vercel)

```bash
npm run build
vercel --prod
```

**Ver guía completa**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📁 Estructura del Proyecto

```
FamilIAgenda/
├── app/                    # Backend (FastAPI)
│   ├── routers/           # API endpoints
│   ├── models.py          # Modelos de base de datos
│   ├── schemas.py         # Esquemas Pydantic
│   ├── database.py        # Configuración DB
│   ├── security.py        # Autenticación JWT
│   └── main.py            # Punto de entrada
├── pages/                 # Frontend pages (React)
├── components/            # Componentes reutilizables
├── context/               # React contexts
├── services/              # API services
├── .env.example           # Template de variables
├── DEPLOYMENT.md          # Guía de deployment
└── requirements.txt       # Dependencias Python
```

---

## 🔑 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de un nuevo usuario. El usuario puede crear una nueva familia o unirse a una existente.
  - **Body para crear familia**: `{ "full_name": "...", "email": "...", "password": "...", "create_family_name": "Nombre de la Familia" }`
  - **Body para unirse a familia**: `{ "full_name": "...", "email": "...", "password": "...", "join_family_code": "código-de-invitación" }`
- `POST /api/auth/token` - Login de usuario. Espera un formulario con `username` (tu email) y `password`.

### Eventos
- `GET /api/events` - Listar eventos
- `POST /api/events` - Crear evento
- `PATCH /api/events/{id}` - Actualizar evento
- `DELETE /api/events/{id}` - Eliminar evento

### IA
- `POST /api/ai/interpretar` - Crear evento con lenguaje natural
- `POST /api/ai/suggest-time` - Sugerir mejor horario

### Tareas
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea
- `POST /api/tasks/{id}/complete` - Completar tarea

### Chat
- `WS /api/chat/ws/{family_id}/{token}` - WebSocket chat
- `GET /api/chat/history/{family_id}` - Historial

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Lucas Echavarria**

- GitHub: [@Lucasechavarria](https://github.com/Lucasechavarria)

---

## 🙏 Agradecimientos

- [FastAPI](https://fastapi.tiangolo.com/) por el excelente framework
- [Supabase](https://supabase.com/) por la infraestructura de base de datos
- [Google Gemini](https://ai.google.dev/) por las capacidades de IA
- [Vite](https://vitejs.dev/) por el build tool ultrarrápido

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella! ⭐**

</div>
