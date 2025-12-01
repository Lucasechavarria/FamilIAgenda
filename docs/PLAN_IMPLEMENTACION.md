# 📋 Plan de Implementación - Funcionalidades Pendientes

## ✅ Completado
1. **ChatWidget Arreglado** - Fix del error de React DOM

## 🎯 Por Implementar

### 1. Creación Manual de Eventos
**Objetivo**: Permitir agregar eventos sin IA

**Componentes a crear**:
- `EventModal.tsx` - Modal para crear/editar eventos
- Botón "+" en CalendarView

**Campos del formulario**:
- Título
- Descripción
- Fecha inicio
- Fecha fin
- Categoría (trabajo, personal, familia, salud, ocio)
- Asignar a miembros

### 2. Sistema de Familias Mejorado
**Objetivo**: Múltiples calendarios por usuario

**Funcionalidades**:
- Calendario Personal (privado)
- Calendario Familiar (compartido)
- Ver/ocultar calendarios
- Invitar miembros a la familia

**Componentes**:
- `CalendarSelector.tsx` - Selector de calendarios
- `FamilyManager.tsx` - Gestión de miembros

### 3. Asignación de Tareas
**Objetivo**: Asignar y reasignar tareas a miembros

**Funcionalidades**:
- Asignar evento a uno o más miembros
- Reasignar tareas
- Notificar al asignado
- Ver tareas asignadas a mí

**Componentes**:
- `TaskAssignment.tsx` - Componente de asignación
- Actualizar `EventModal` con selector de miembros

## 📊 Prioridades

| Funcionalidad | Prioridad | Tiempo Estimado |
|---------------|-----------|-----------------|
| Creación Manual de Eventos | 🔴 ALTA | 30 min |
| Sistema de Familias | 🟡 MEDIA | 45 min |
| Asignación de Tareas | 🟢 BAJA | 30 min |

## 🚀 Orden de Implementación

1. **EventModal** (Crear eventos manualmente)
2. **CalendarSelector** (Múltiples calendarios)
3. **TaskAssignment** (Asignar tareas)

Total estimado: ~2 horas

¿Empezamos con el EventModal?
