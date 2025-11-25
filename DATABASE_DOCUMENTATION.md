# Documentación de Base de Datos - FamilIAgenda

## Arquitectura General
El sistema utiliza una arquitectura **User-Centric** donde cada usuario tiene su propia cuenta y puede pertenecer a múltiples familias. Los eventos pueden ser privados (solo el creador) o compartidos con familias.

## Diagrama de Relaciones
```mermaid
erDiagram
    USERS ||--o{ FAMILY_MEMBERS : "pertenece a"
    FAMILIES ||--o{ FAMILY_MEMBERS : "tiene"
    USERS ||--o{ EVENTS : "crea"
    FAMILIES ||--o{ EVENTS : "contiene"
    USERS ||--o{ NOTIFICATION_TOKENS : "posee"
    EVENTS ||--o{ EVENT_SHARES : "compartido con"
    FAMILIES ||--o{ TASKS : "tiene"
    USERS ||--o{ TASKS : "asignado a"
    FAMILIES ||--o{ MESSAGES : "tiene chat"
    
    USERS {
        int id PK
        string email UK
        string full_name
        string hashed_password
        string avatar_url
        datetime created_at
    }
    
    FAMILIES {
        int id PK
        string name
        string invitation_code UK
        datetime created_at
    }

    FAMILY_MEMBERS {
        int family_id PK,FK
        int user_id PK,FK
        string role
        datetime joined_at
    }

    EVENTS {
        int id PK
        string title
        string description
        datetime start_time
        datetime end_time
        string category
        string visibility
        string location
        int owner_id FK
        int family_id FK
    }
    
    EVENT_SHARES {
        int id PK
        int event_id FK
        int shared_with_user_id FK
        boolean can_edit
        datetime shared_at
    }
    
    TASKS {
        int id PK
        int family_id FK
        int assigned_to_id FK
        string title
        string status
        datetime due_date
        string category
        string priority
        boolean is_recurring
        jsonb notification_config
        datetime last_notified_at
    }
    
    MESSAGES {
        int id PK
        int family_id FK
        int user_id FK
        string content
        datetime created_at
    }

    NOTIFICATION_TOKENS {
        int id PK
        string token UK
        string device_info
        int user_id FK
    }
```

## Tablas Principales (Actualizado a Plural)

### 1. `users`
Información de cuenta y perfil. Evita conflicto con palabra reservada `user`.

### 2. `families`
Grupos de usuarios que comparten calendario y tareas.

### 3. `family_members`
Tabla pivote N:M entre usuarios y familias con roles.

### 4. `events`
Eventos con soporte de visibilidad granular y ubicación.
- **Constraint**: `end_time > start_time`

### 5. `event_shares`
Permite compartir eventos específicos con usuarios individuales fuera de la lógica familiar.

### 6. `tasks`
Gestión de tareas con soporte avanzado para rutinas:
- **`priority`**: 'critical' activa alertas persistentes.
- **`notification_config`**: Tipo `JSONB` para consultas eficientes.
- **Constraint**: `is_recurring` requiere `recurrence_pattern`.

### 7. `messages`
Historial de mensajes del chat familiar en tiempo real.

### 8. `notification_tokens`
Tokens FCM para envío de alertas a dispositivos.

## Seguridad (RLS)
Todas las tablas tienen **Row Level Security (RLS)** habilitado.
- Si usas el Backend FastAPI, este se conecta con privilegios de servicio (Service Role) y gestiona la seguridad en la capa de aplicación.
- Si conectas el Frontend directamente, las políticas RLS restringirán el acceso.
