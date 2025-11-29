# 🚀 Guía Rápida: Solución al Error 500 de IA

## 📊 Situación Actual

Tu API key de Gemini está configurada: `AIzaSyDbfgzARui7wto89yY1nmSK9Ig9o_sVAck`

El error 500 puede deberse a:
1. **Límite de cuota de Gemini alcanzado** (60 requests/minuto en plan gratuito)
2. **Problema de red/firewall en Render**
3. **Formato de respuesta inesperado de Gemini**

## ✅ Soluciones Implementadas

### 1. Mejor Logging (Ya Desplegado)
He agregado logging detallado en `app/routers/ai.py` para ver exactamente qué está fallando.

**Próximos pasos:**
1. Ve a Render → Logs
2. Intenta crear un evento con IA desde el frontend
3. Busca en los logs mensajes que empiecen con 🤖, ✅ o ❌
4. Comparte esos logs conmigo para diagnosticar

### 2. Alternativa Gratuita: Groq AI (RECOMENDADO) ⭐

**Groq es MEJOR que Gemini para tu caso:**
- ✅ Completamente gratis
- ✅ 14,400 requests/día (vs 60/min de Gemini)
- ✅ Más rápido que GPT-4
- ✅ Excelente para parsing de texto
- ✅ Sin tarjeta de crédito

**Cómo activar Groq (5 minutos):**

#### Paso 1: Obtener API Key de Groq
1. Ve a: https://console.groq.com/
2. Crea una cuenta (gratis, sin tarjeta)
3. Ve a "API Keys" → "Create API Key"
4. Copia la key (empieza con `gsk_...`)

#### Paso 2: Configurar en Render
1. Ve a tu dashboard de Render
2. Selecciona `familiagenda-api`
3. Ve a "Environment" → "Environment Variables"
4. Agrega nueva variable:
   - **Key**: `GROQ_API_KEY`
   - **Value**: `gsk_...` (tu key de Groq)
5. Guarda (Render se redespliegará automáticamente)

#### Paso 3: Verificar
Espera 2-3 minutos y revisa los logs de Render.
Deberías ver: `✅ Usando Groq AI (gratis y rápido)`

## 🔍 Diagnóstico del Error Actual

Para entender qué está pasando con Gemini, necesito que hagas esto:

1. **Ve a Render Logs**
2. **Intenta crear un evento** desde el frontend
3. **Copia los logs** que aparezcan (especialmente los que tengan emojis 🤖 ✅ ❌)
4. **Compártelos conmigo**

Los logs me dirán exactamente en qué paso está fallando:
- ❌ API Key no configurada
- ❌ Error de cuota/límite
- ❌ Error de parsing JSON
- ❌ Error de red

## 🎯 Recomendación Final

**Opción 1 (Más Rápida): Usar Groq**
- Toma 5 minutos
- Gratis para siempre
- Más rápido y confiable
- Sigue los pasos de arriba

**Opción 2 (Diagnóstico): Arreglar Gemini**
- Comparte los logs de Render
- Diagnosticaremos el problema exacto
- Puede ser límite de cuota

## 📝 Archivos Creados

He creado estos archivos de ayuda:
- `AI_ALTERNATIVES.md` - Comparación de todas las opciones de IA
- `app/routers/ai_v2.py` - Versión mejorada con soporte Groq
- `FIXES_SUMMARY.md` - Resumen de todas las correcciones

## ❓ Siguiente Paso

**¿Qué prefieres?**

A) **Usar Groq** (5 min, gratis, confiable)
   → Te doy la key o te ayudo a obtenerla

B) **Diagnosticar Gemini** (necesito los logs)
   → Comparte los logs de Render cuando intentes crear un evento

C) **Otra alternativa de IA**
   → Together AI, Hugging Face, etc. (ver AI_ALTERNATIVES.md)
