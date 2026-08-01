# 🎱 Tómbola de Bingo

Aplicación web profesional de **Tómbola de Bingo** con animaciones premium, diseño moderno y experiencia de usuario de primera clase.

100% client-side. Sin backend. Sin instalación. Abre `index.html` y juega.

---

## ✨ Características

- **Tómbola animada** — Esfera con 75 bolas que giran con física simulada (gravedad, rebote, fricción)
- **Secuencia de extracción de 12 pasos** — Aceleración, giro, eyección, zoom, iluminación, partículas y celebración
- **Cuadrícula B-I-N-G-O** — 5 columnas coloreadas con marcado visual (verde = extraído, amarillo = último)
- **Historial completo** — Registro de cada extracción con número, hora y orden
- **Cronómetro** — Tiempo transcurrido con precisión de milisegundos
- **Sonidos procedurales** — Generados con Web Audio API (sin archivos externos)
- **Tema claro/oscuro** — Cambio instantáneo
- **Pantalla completa** — Fullscreen API con ocultación total de UI del navegador
- **Responsive** — Desde móvil hasta 4K, ultrawide y proyectores
- **Atajos de teclado** — Espacio, F11, N, P, M, T, H, Esc
- **Accesible** — ARIA labels, prefers-reduced-motion, semántica HTML5

---

## 🚀 Cómo Ejecutar

### Opción 1: Doble clic
1. Navega a la carpeta del proyecto
2. Haz **doble clic** en `index.html`
3. Se abrirá en tu navegador predeterminado

> **Nota:** Los ES Modules requieren que el archivo se sirva desde un servidor. Si encuentras errores CORS al abrir con doble clic, usa la Opción 2.

### Opción 2: Servidor local (recomendado)

Con **Python**:
```bash
cd bingo-tombola
python -m http.server 8080
# Abrir http://localhost:8080
```

Con **Node.js** (npx):
```bash
cd bingo-tombola
npx serve .
# Abrir http://localhost:3000
```

Con **VS Code**: Instala la extensión **Live Server** y haz clic en "Go Live".

---

## 🎮 Cómo Jugar

1. Haz clic en **Nuevo Juego** para iniciar
2. Presiona **Siguiente Número** (o `Espacio`) para extraer una bola
3. La tómbola girará y mostrará el número con animación
4. Los números se marcan automáticamente en la cuadrícula B-I-N-G-O
5. El historial registra cada extracción con la hora exacta
6. Cuando se extraigan las 75 bolas, aparecerá la pantalla de finalización

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Extraer siguiente número |
| `F11` | Pantalla completa |
| `Esc` | Salir de fullscreen / Cerrar modal |
| `N` | Nuevo juego |
| `P` | Pausar / Reanudar |
| `M` | Silenciar / Activar sonido |
| `T` | Cambiar tema (claro/oscuro) |
| `H` | Abrir / Cerrar ayuda |
| `Ctrl+R` | Confirmar antes de recargar |

---

## 📁 Estructura del Proyecto

```
bingo-tombola/
├── index.html              # Punto de entrada (HTML5 semántico)
├── README.md               # Esta documentación
│
├── css/
│   ├── variables.css       # Tokens de diseño (colores, tipografía, espaciado)
│   ├── styles.css          # Estilos principales (layout, componentes)
│   ├── animations.css      # Keyframes y clases de animación
│   └── responsive.css      # Media queries (480px → 4K + ultrawide)
│
├── js/
│   ├── helpers.js          # Utilidades puras (selectores, formato, math)
│   ├── numbers.js          # Generador de números 1-75 (Fisher-Yates + crypto)
│   ├── timer.js            # Cronómetro (performance.now + rAF)
│   ├── fullscreen.js       # Fullscreen API wrapper (cross-browser)
│   ├── sound.js            # Audio procedural (Web Audio API)
│   ├── effects.js          # Sistema de partículas (Canvas)
│   ├── animation.js        # Motor de animaciones secuenciales
│   ├── tombola.js          # Renderizado de la tómbola (Canvas 2D)
│   ├── ui.js               # Gestión del DOM (paneles, grid, historial)
│   └── app.js              # Orquestador principal (init, eventos, estado)
│
├── assets/
│   ├── sounds/             # (vacío — sonidos generados por Web Audio API)
│   ├── images/             # (vacío — gráficos renderizados en Canvas)
│   └── fonts/              # (vacío — Google Fonts cargadas por CDN)
│
└── icons/                  # (vacío — iconos SVG inline en HTML)
```

---

## 🎨 Personalización

### Colores
Edita `css/variables.css`. Todas las variables CSS están centralizadas:

```css
/* Cambiar el color primario */
--color-primary: #6366f1;        /* Cambia este valor */
--color-primary-hover: #818cf8;  /* Y su hover */

/* Colores BINGO por columna */
--color-bingo-B: #3b82f6;  /* Azul */
--color-bingo-I: #ef4444;  /* Rojo */
--color-bingo-N: #a855f7;  /* Púrpura */
--color-bingo-G: #22c55e;  /* Verde */
--color-bingo-O: #f97316;  /* Naranja */
```

### Tipografía
Las fuentes se cargan desde Google Fonts. Cambiar en `css/variables.css`:

```css
--font-primary: 'Inter', sans-serif;
--font-display: 'Outfit', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Velocidad de animaciones
Ajusta los timings en `css/variables.css`:

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
```

### Sonidos
Los sonidos se generan proceduralmente en `js/sound.js`. Puedes ajustar frecuencias, duraciones y volumen en cada método (`playDrum`, `playPop`, `playChime`, etc.).

---

## 🌐 Compatibilidad

| Navegador | Versión mínima | Estado |
|-----------|---------------|--------|
| Chrome | 80+ | ✅ Completo |
| Firefox | 78+ | ✅ Completo |
| Safari | 14+ | ✅ Completo |
| Edge | 80+ | ✅ Completo |
| Opera | 67+ | ✅ Completo |
| Samsung Internet | 13+ | ✅ Completo |

**APIs utilizadas:**
- Canvas 2D API
- Web Audio API
- Web Animations API
- Fullscreen API
- ES Modules (import/export)
- crypto.getRandomValues()
- performance.now()
- requestAnimationFrame()

---

## 📝 Notas Técnicas

- **Sin dependencias externas** — No usa React, Angular, Vue ni ningún framework
- **Sin backend** — Todo se ejecuta en el navegador
- **Sin almacenamiento** — No usa localStorage, sessionStorage, IndexedDB ni cookies
- **Todo en memoria** — Al cerrar o recargar, se reinicia completamente
- **Sonidos procedurales** — Generados con osciladores y filtros de Web Audio API
- **Gráficos en Canvas** — La tómbola y las partículas se renderizan en Canvas 2D
- **ES Modules nativos** — Sin bundler (Webpack, Vite, etc.)
- **CSS Custom Properties** — Cambio de tema instantáneo sin recargar

---

## 📄 Licencia

Proyecto libre para uso personal y educativo.

---

Desarrollado con ❤️ y JavaScript puro.
