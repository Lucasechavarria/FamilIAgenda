# 🧪 Testing Guide - FamilIAgenda

## Estado Actual de Tests

### ✅ Tests Funcionando
- **test_auth.py**: 4/4 tests
  - ✅ Registro de usuario
  - ✅ Login
  - ✅ Obtener usuario actual (/me)
  - ✅ Actualizar color de usuario

### ⚠️ Tests con Issues
- **test_events.py**: Requieren mocks adicionales
- **test_metrics.py**: Requieren family_id correcto
- **test_tasks.py**: Requieren validación de schemas
- **test_chat.py**: Requieren manejo de sesión

## Ejecutar Tests

### Todos los Tests
```bash
python -m pytest testing/ -v
```

### Tests Específicos
```bash
# Solo autenticación
python -m pytest testing/test_auth.py -v

# Con cobertura
python -m pytest testing/ --cov=app --cov-report=html
```

### Smoke Test (End-to-End)
```bash
# Asegúrate de que el servidor esté corriendo
$env:DATABASE_URL="sqlite:///./database.db"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# En otra terminal
python smoke_test.py
```

## CI/CD

### GitHub Actions
El proyecto incluye workflow de CI/CD en `.github/workflows/tests.yml` que:
- ✅ Ejecuta automáticamente en cada push
- ✅ Corre todos los tests con pytest
- ✅ Genera reporte de cobertura
- ✅ Sube resultados a Codecov

### Configuración Local
```bash
# Instalar dependencias de testing
pip install -r requirements.txt

# Inicializar BD de pruebas
$env:DATABASE_URL="sqlite:///./test_database.db"
python init_db.py
```

## Próximos Pasos

1. ✅ Resolver error 500 en /me - **COMPLETADO**
2. ⚠️ Corregir tests de eventos, métricas, tareas y chat
3. ✅ Configurar CI/CD - **COMPLETADO**
4. 📝 Agregar tests para IA y notificaciones
5. 📊 Alcanzar 80%+ de cobertura de código

## Notas Importantes

- Los tests usan SQLite en memoria para aislamiento
- Mocks necesarios para Firebase y APScheduler
- El endpoint /me funciona correctamente cuando la BD está inicializada
- Smoke test pasa completamente con servidor corriendo
