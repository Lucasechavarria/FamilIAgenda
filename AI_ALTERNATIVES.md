# Alternativas de IA Gratuitas para FamilIAgenda

## 🆓 Opciones de IA Gratuitas

### 1. **Groq (RECOMENDADO) ⭐**
- **Modelo**: Llama 3.1 70B, Mixtral 8x7B
- **Velocidad**: Extremadamente rápido (más rápido que GPT-4)
- **Límite gratuito**: 14,400 requests/día
- **API Key**: https://console.groq.com/keys
- **Ventajas**: 
  - Muy rápido
  - Excelente para parsing de texto a JSON
  - Generoso límite gratuito
  - Sin tarjeta de crédito requerida

### 2. **Together AI**
- **Modelos**: Llama 3, Mixtral, Qwen
- **Límite gratuito**: $25 de crédito inicial
- **API Key**: https://api.together.xyz/settings/api-keys
- **Ventajas**:
  - Compatible con OpenAI API
  - Múltiples modelos disponibles
  - Buen rendimiento

### 3. **Hugging Face Inference API**
- **Modelos**: Mistral, Llama, Phi-3
- **Límite gratuito**: 1000 requests/día
- **API Key**: https://huggingface.co/settings/tokens
- **Ventajas**:
  - Completamente gratis
  - Muchos modelos disponibles
  - Sin tarjeta de crédito

### 4. **OpenRouter**
- **Modelos**: Acceso a múltiples proveedores
- **Límite gratuito**: $1 de crédito inicial
- **API Key**: https://openrouter.ai/keys
- **Ventajas**:
  - Acceso a muchos modelos
  - Fallback automático
  - Precios muy bajos

## 🔧 Implementación Recomendada: Groq

### Paso 1: Obtener API Key
1. Ve a https://console.groq.com/
2. Crea una cuenta (gratis, sin tarjeta)
3. Ve a "API Keys" y crea una nueva
4. Copia la key

### Paso 2: Instalar dependencia
```bash
pip install groq
```

### Paso 3: Actualizar código
El código ya está preparado para usar Groq como alternativa.
Solo necesitas:
1. Agregar `groq` a `requirements.txt`
2. Configurar `GROQ_API_KEY` en Render
3. El código detectará automáticamente qué API usar

## 📊 Comparación

| Proveedor | Velocidad | Límite Gratis | Calidad | Facilidad |
|-----------|-----------|---------------|---------|-----------|
| Groq | ⭐⭐⭐⭐⭐ | 14,400/día | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Together AI | ⭐⭐⭐⭐ | $25 crédito | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Hugging Face | ⭐⭐⭐ | 1000/día | ⭐⭐⭐ | ⭐⭐⭐ |
| OpenRouter | ⭐⭐⭐⭐ | $1 crédito | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Gemini | ⭐⭐⭐⭐ | 60/min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🎯 Recomendación Final

**Usa Groq** - Es la mejor opción para tu caso de uso:
- Gratis y generoso
- Muy rápido
- Excelente para convertir texto a JSON
- No requiere tarjeta de crédito
- Fácil de integrar

Si Groq no funciona, **Together AI** es la segunda mejor opción.
