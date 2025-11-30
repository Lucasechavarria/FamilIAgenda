# 🌌 FamilIAgenda: Cosmic Glass Edition

## Descripción del Proyecto
**FamilIAgenda** es el centro de comando definitivo para la familia moderna. No es solo un calendario; es un **asistente de vida inteligente** que vive en el corazón de tu hogar digital. Fusionando la potencia de la Inteligencia Artificial con una interfaz **"Cosmic Glass"** inmersiva, transforma el caos cotidiano en una sinfonía organizada.

Imagina un panel de control holográfico flotando en el espacio profundo, donde cada evento es una estrella y cada tarea una misión. Con notificaciones en tiempo real que pulsan como cuásares y un chat familiar seguro encriptado, FamilIAgenda mantiene a todos sincronizados, desde las compras del súper hasta las vacaciones soñadas.

## 🎨 Paleta de Colores: "Nebula Dreams"

Esta paleta evoca la profundidad del espacio y la vibrante energía de las nebulosas, utilizando transparencias (glassmorphism) para crear capas de profundidad.

### Fondos (Deep Space)
- **Background**: `#030712` (Gray 950 - Casi negro absoluto)
- **Surface**: `#0f172a` (Slate 900 - Azul profundo)
- **Glass Panel**: `rgba(15, 23, 42, 0.6)` (Con backdrop-blur-xl)

### Acentos (Nebula Glows)
- **Primary (Cyber Cyan)**:
    - Glow: `#22d3ee` (Cyan 400)
    - Base: `#06b6d4` (Cyan 500)
    - Dim: `#0891b2` (Cyan 600)
- **Secondary (Neon Fuchsia)**:
    - Glow: `#e879f9` (Fuchsia 400)
    - Base: `#d946ef` (Fuchsia 500)
    - Dim: `#c026d3` (Fuchsia 600)
- **Accent (Electric Violet)**:
    - Glow: `#a78bfa` (Violet 400)
    - Base: `#8b5cf6` (Violet 500)

### Texto & UI
- **Heading**: `#f8fafc` (Slate 50 - Blanco estelar)
- **Body**: `#cbd5e1` (Slate 300 - Gris polvo lunar)
- **Muted**: `#64748b` (Slate 500 - Gris asteroide)

## ✨ Mejoras de UX Propuestas

1.  **Efecto "Starlight" en Hover**: Los botones y tarjetas emiten un resplandor suave al pasar el mouse, como si se activaran por proximidad.
2.  **Transiciones de "Warp Speed"**: Navegación entre vistas con animaciones fluidas y rápidas (Framer Motion).
3.  **Notificaciones "Pulsar"**: Las alertas importantes laten suavemente en la esquina de la pantalla.
4.  **Glassmorphism Profundo**: Paneles con bordes sutiles brillantes (`border-white/10`) y desenfoque de fondo intenso (`backdrop-blur-xl`).
5.  **Tipografía Futurista**:
    - Títulos: **Outfit** (Geométrica, moderna).
    - Cuerpo: **Inter** (Legible, limpia).

## 🛠️ Plan de Implementación
1.  Actualizar `tailwind.config.js` con la nueva paleta.
2.  Refinar `index.css` para los efectos de vidrio y fondos.
3.  Aplicar clases de animación en componentes clave.
