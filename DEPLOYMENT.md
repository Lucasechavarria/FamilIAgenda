# Guía de Deployment - Smart Family Calendar

## 🚀 Deployment Rápido

### Opción 1: Render.com (Recomendado - Gratis)

#### Backend

1. **Crear cuenta en [Render.com](https://render.com)**

2. **Crear nuevo Web Service**:
   - Connect tu repositorio de GitHub
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Configurar Variables de Entorno**:
   ```
   DATABASE_URL=postgresql://postgres.vikyhkrozbbptxcrtgcx:BnzMMVPLAs4DsjaO@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   SUPABASE_URL=https://vikyhkrozbbptxcrtgcx.supabase.co
   SUPABASE_KEY=[tu-anon-key]
   SECRET_KEY=[generar-nuevo]
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   GEMINI_API_KEY=[tu-api-key]
   ```

4. **Deploy**: Render automáticamente hace deploy

#### Frontend

1. **Build local**:
   ```bash
   npm run build
   ```

2. **Deploy a Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Configurar variables de entorno en Vercel**:
   - `VITE_API_URL`: URL de tu backend en Render

---

## 📋 Checklist Pre-Deployment

### Backend
- [x] Connection Pooler configurado
- [ ] Variables de entorno en .env.example documentadas
- [ ] SECRET_KEY generada (no usar la de desarrollo)
- [ ] Backend inicia sin errores localmente
- [ ] Todas las rutas API responden

### Frontend
- [ ] `npm run build` completa sin errores
- [ ] VITE_API_URL apunta al backend correcto
- [ ] Login/Register funciona end-to-end

### Base de Datos
- [ ] Tablas creadas en Supabase
- [ ] RLS policies configuradas (si aplica)
- [ ] Connection Pooler habilitado

---

## 🔧 Configuración de Producción

### 1. Generar SECRET_KEY Segura

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Configurar CORS en Backend

En `app/main.py`, actualizar orígenes permitidos:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tu-frontend.vercel.app",
        "https://tu-dominio.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Configurar Frontend para Producción

Crear `.env.production`:
```
VITE_API_URL=https://tu-backend.onrender.com
```

---

## 🔍 Verificación Post-Deployment

### Backend
```bash
curl https://tu-backend.onrender.com/
# Debe retornar: {"message": "FamilIAgenda API - Funcionando correctamente"}
```

### Frontend
1. Abrir https://tu-frontend.vercel.app
2. Intentar registro de usuario
3. Verificar login
4. Crear un evento de prueba

---

## 🐛 Troubleshooting

### Error: "Connection refused" en producción
- Verificar que DATABASE_URL use el Connection Pooler (puerto 6543)
- Confirmar que `pgbouncer=true` esté en la URL

### Error: "CORS policy"
- Agregar dominio del frontend a `allow_origins` en `main.py`

### Error: "Invalid token"
- Verificar que SECRET_KEY sea la misma en todas las instancias del backend
- Regenerar token en el frontend

---

## 📊 Monitoreo

### Logs en Render
```bash
# Ver logs en tiempo real
render logs -f
```

### Logs en Vercel
- Dashboard → Project → Deployments → View Function Logs

---

## 🔐 Seguridad

### Checklist de Seguridad
- [ ] SECRET_KEY única y segura (32+ caracteres)
- [ ] No exponer SUPABASE_KEY en el frontend (usar anon key)
- [ ] CORS configurado solo para dominios confiables
- [ ] HTTPS habilitado (automático en Render/Vercel)
- [ ] Variables sensibles en variables de entorno, NO en código

---

## 💰 Costos Estimados

### Tier Gratuito
- **Render**: 750 horas/mes gratis
- **Vercel**: 100GB bandwidth/mes gratis
- **Supabase**: 500MB DB, 2GB bandwidth gratis

### Escalamiento
- **Render Pro**: $7/mes (mejor performance)
- **Vercel Pro**: $20/mes (más bandwidth)
- **Supabase Pro**: $25/mes (8GB DB)

---

## 🎯 Próximos Pasos

1. Hacer deploy del backend a Render
2. Hacer deploy del frontend a Vercel
3. Probar flujo completo de usuario
4. Configurar dominio personalizado (opcional)
5. Configurar CI/CD para auto-deploy (opcional)
