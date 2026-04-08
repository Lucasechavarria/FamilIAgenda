# FamilIAgenda: API Documentation

This document provides detailed documentation for the FamilIAgenda API.

## Authentication (`/api/auth`)

### `POST /register`

Registers a new user and optionally creates or joins a family.

**Request Body:**

```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "securepassword123",
  "create_family_name": "The Doe Family",
  "join_family_code": null
}
```

**Response Body:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_name": "John Doe",
  "user_email": "user@example.com"
}
```

### `POST /token`

Logs in a user and returns a JWT access token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response Body:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_name": "John Doe",
  "user_email": "user@example.com"
}
```

### `GET /family/members`

Retrieves a list of family members for the currently authenticated user.

**Response Body:**

```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "avatar_url": null
  },
  {
    "id": 2,
    "full_name": "Jane Doe",
    "avatar_url": null
  }
]
```

## Artificial Intelligence (`/api/ai`)

### `POST /interpretar`

Interprets natural language text to create an event.

**Request Body:**

```json
{
  "texto": "Reunión con el equipo mañana a las 10am"
}
```

**Response Body:**

```json
{
  "title": "Reunión con el equipo",
  "start_time": "2023-10-27T10:00:00",
  "end_time": "2023-10-27T11:00:00",
  "category": "trabajo",
  "description": ""
}
```

### `POST /suggest-time`

Suggests the best time for a new event based on the user's existing schedule.

**Request Body:**

```json
{
  "texto": "Llamada rápida con Jane"
}
```

**Response Body:**

```json
{
  "suggested_time": "2023-10-27T14:30:00",
  "duration_minutes": 15,
  "reason": "Hay un hueco disponible entre tus reuniones de la tarde.",
  "alternative_times": [
    "2023-10-27T16:00:00",
    "2023-10-28T09:00:00"
  ]
}
```

### `POST /analyze-routine`

Analyzes the user's upcoming tasks and events to provide optimization suggestions.

**Response Body:**

```json
{
  "alerts": [
    "Tienes dos reuniones superpuestas mañana a las 11am."
  ],
  "suggestions": [
    "Considera agrupar las tareas de recados para el viernes por la tarde."
  ],
  "score": 78
}
```

## Events (`/api/events`)

### `POST /`

Creates a new event.

**Request Body:**

```json
{
  "title": "Cita con el dentista",
  "description": "Revisión anual",
  "start_time": "2023-11-15T10:00:00",
  "end_time": "2023-11-15T11:00:00",
  "category": "salud",
  "visibility": "family"
}
```

**Response Body:**

```json
{
  "id": 1,
  "owner_id": 1,
  "family_id": 1,
  "title": "Cita con el dentista",
  "description": "Revisión anual",
  "start_time": "2023-11-15T10:00:00",
  "end_time": "2023-11-15T11:00:00",
  "category": "salud",
  "visibility": "family"
}
```

### `GET /`

Retrieves a list of events for the currently authenticated user.

**Response Body:**

```json
[
  {
    "id": 1,
    "owner_id": 1,
    "family_id": 1,
    "title": "Cita con el dentista",
    "description": "Revisión anual",
    "start_time": "2023-11-15T10:00:00",
    "end_time": "2023-11-15T11:00:00",
    "category": "salud",
    "visibility": "family"
  }
]
```

### `GET /{event_id}`

Retrieves a single event by its ID.

**Response Body:**

```json
{
  "id": 1,
  "owner_id": 1,
  "family_id": 1,
  "title": "Cita con el dentista",
  "description": "Revisión anual",
  "start_time": "2023-11-15T10:00:00",
  "end_time": "2023-11-15T11:00:00",
  "category": "salud",
  "visibility": "family"
}
```

### `PATCH /{event_id}`

Updates an existing event.

**Request Body:**

```json
{
  "title": "Cita con el dentista (confirmada)",
  "description": "Revisión anual - Confirmada"
}
```

**Response Body:**

```json
{
  "id": 1,
  "owner_id": 1,
  "family_id": 1,
  "title": "Cita con el dentista (confirmada)",
  "description": "Revisión anual - Confirmada",
  "start_time": "2023-11-15T10:00:00",
  "end_time": "2023-11-15T11:00:00",
  "category": "salud",
  "visibility": "family"
}
```

### `DELETE /{event_id}`

Deletes an event by its ID.

## Tasks (`/api/tasks`)

### `POST /`

Creates a new task.

**Request Body:**

```json
{
  "title": "Lavar los platos",
  "description": "Usar el jabón nuevo",
  "due_date": "2023-11-10T20:00:00",
  "assigned_to_id": 2
}
```

**Response Body:**

```json
{
  "id": 1,
  "family_id": 1,
  "created_by_id": 1,
  "title": "Lavar los platos",
  "description": "Usar el jabón nuevo",
  "due_date": "2023-11-10T20:00:00",
  "assigned_to_id": 2,
  "status": "pending",
  "is_recurring": false,
  "recurrence_pattern": null,
  "notification_config": "{\"pre\": [15], \"post\": false}",
  "completed_at": null,
  "completed_by_id": null
}
```

### `GET /`

Retrieves a list of tasks for the current family.

**Query Parameters:**

*   `status` (string, optional): Filter by task status (e.g., "pending", "completed").

**Response Body:**

```json
[
  {
    "id": 1,
    "family_id": 1,
    "created_by_id": 1,
    "title": "Lavar los platos",
    "description": "Usar el jabón nuevo",
    "due_date": "2023-11-10T20:00:00",
    "assigned_to_id": 2,
    "status": "pending",
    "is_recurring": false,
    "recurrence_pattern": null,
    "notification_config": "{\"pre\": [15], \"post\": false}",
    "completed_at": null,
    "completed_by_id": null
  }
]
```

### `GET /{task_id}`

Retrieves a single task by its ID.

**Response Body:** (Same as the single task object above)

### `PATCH /{task_id}`

Updates an existing task.

**Request Body:**

```json
{
  "title": "Lavar los platos y secarlos",
  "assigned_to_id": 1
}
```

**Response Body:** (The updated task object)

### `POST /{task_id}/complete`

Marks a task as complete.

**Response Body:** (The completed task object with `"status": "completed"`)

### `DELETE /{task_id}`

Deletes a task by its ID.

## Chat (`/api/chat`)

### `GET /history/{family_id}`

Retrieves the chat history for a specific family.

**Response Body:**

```json
[
  {
    "id": 1,
    "family_id": 1,
    "user_id": 1,
    "content": "Hola familia!",
    "created_at": "2023-10-27T10:00:00",
    "user_name": "John Doe"
  }
]
```

### `WS /ws/{family_id}/{token}`

Establishes a WebSocket connection for real-time chat.

**Sent Message:**

```json
{
  "content": "Hola a todos!"
}
```

**Received Message:**

```json
{
  "type": "chat",
  "id": 2,
  "user_id": 2,
  "user_name": "Jane Doe",
  "content": "Hola a todos!",
  "created_at": "2023-10-27T10:01:00"
}
```
