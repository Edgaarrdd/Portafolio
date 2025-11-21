# Portafolio - Edgard Machuca

Este es mi portafolio personal, diseñado para mostrar mis proyectos, habilidades y experiencia como desarrollador. Está construido con tecnologías web modernas, enfocándose en un diseño limpio, responsivo y una experiencia de usuario fluida.

## 🚀 Características

- **Integración con GitHub API**: Carga dinámicamente mis repositorios destacados y sus lenguajes directamente desde GitHub.
- **Diseño Responsivo**: Adaptado para funcionar perfectamente en móviles, tablets y escritorio.
- **Modo Oscuro**: Estética moderna con un tema oscuro ("Dark Mode") por defecto.
- **Efectos Visuales**:
  - Fondo personalizado con efecto Parallax.
  - Barra de navegación con efecto "Glassmorphism" que aparece/desaparece al hacer scroll.
  - Animaciones suaves en hover y transiciones.
  - Iconos de habilidades con efecto de color al pasar el mouse.
- **Optimización**: Sistema de caché local (1 hora) para minimizar las peticiones a la API de GitHub y mejorar la velocidad de carga.
- **Tipografía Personalizada**: Uso de fuentes Google Fonts (Space Grotesk, Doto, Roboto).

## 🛠 Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible.
- **Tailwind CSS**: Framework de utilidad para el diseño y estilos (cargado vía CDN).
- **JavaScript (Vanilla)**: Lógica para la integración con la API de GitHub, manejo del DOM y efectos de interfaz.
- **Devicon**: Iconos de tecnologías y herramientas.
- **Google Fonts**: Tipografías personalizadas:
  - Space Grotesk (fuente principal)
  - Doto (fuente de acentos)
  - Roboto (fuente alternativa)

## 📂 Estructura del Proyecto

```
.
├── index.html          # Archivo principal HTML
├── styles.css          # Estilos personalizados adicionales
├── script.js           # Lógica JS (API GitHub, caché, UI interactions)
├── tailwind-config.js  # Configuración personalizada de Tailwind
├── img/                # Recursos de imagen
│   └── background/     # Imágenes de fondo
└── .vscode/            # Configuración de VS Code
    └── settings.json   # Ajustes del editor
```

## 🎨 Personalización de Tailwind

El proyecto incluye una configuración personalizada de Tailwind (`tailwind-config.js`) con:

- **Colores personalizados**:
  - `primary`: `#0062ffff` (azul vibrante)
  - `background-light`: `#f6f7f8`
  - `background-dark`: `#0D1117`
- **Fuentes personalizadas**:
  - `font-display`: Space Grotesk
  - `font-doto`: Doto
  - `font-roboto`: Roboto
- **Border radius personalizados**: Para mantener consistencia en el diseño.

## 🔧 Instalación y Uso

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Edgaarrdd/Portafolio.git
   cd Portafolio
   ```

2. **Abrir el proyecto**:
   Simplemente abre el archivo `index.html` en tu navegador web favorito. 
   
   **Recomendado**: Usa una extensión como "Live Server" en VS Code para una mejor experiencia de desarrollo con recarga automática.

3. **No requiere instalación de dependencias**: 
   Este es un proyecto 100% frontend sin dependencias de Node.js. Todo se carga vía CDN.

## 📝 Personalización

Si deseas usar este portafolio como plantilla:

1. **Configurar tu usuario de GitHub**:
   - Edita `script.js` y cambia la constante `GITHUB_USERNAME` (línea 2) por tu usuario de GitHub.

2. **Seleccionar tus repositorios destacados**:
   - Actualiza la lista `FEATURED_REPOS` en `script.js` (línea 82-84) con los nombres de tus repositorios que quieras destacar.

3. **Actualizar información personal**:
   - Modifica el contenido en `index.html`:
     - Sección "Sobre mí" (línea ~73)
     - Nombre y título (línea ~56-58)
     - Habilidades/iconos (línea ~87-117)
     - Footer (línea ~153-167)

4. **Cambiar colores y fuentes** (opcional):
   - Edita `tailwind-config.js` para ajustar la paleta de colores y tipografías.

5. **Personalizar imagen de fondo**:
   - Reemplaza la imagen en `img/background/bg-site.jpg` con tu propia imagen.

## 🌐 Despliegue

Este portafolio puede ser desplegado fácilmente en:

- **GitHub Pages**: Ideal para proyectos estáticos
- **Netlify**: Despliegue automático desde Git
- **Vercel**: Excelente para proyectos frontend
- Cualquier hosting de archivos estáticos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de usarlo y modificarlo.

---

Desarrollado con ❤️ por [Edgard Machuca](https://github.com/Edgaarrdd)
