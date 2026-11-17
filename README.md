# Cumple Dani

Página estática de cumpleaños. Abre `index.html` en un navegador y toca la caja para iniciar la ruleta. Cuando se detenga, toca el icono dorado para ver el regalo a pantalla completa. Toca la carátula para cerrar.

## Añadir tus imágenes

Guarda tus archivos en una carpeta `imagenes` junto a `index.html`. En el objeto `images` al principio de `app.js`, escribe la ruta relativa de cada imagen. Por ejemplo, cambia `gta: ''` por `gta: './imagenes/gta-vi.jpg'`. Las claves `box` y `gold` corresponden a la caja inicial y al premio dorado. Las demás claves son los regalos de broma, en el mismo orden en el que se definen debajo.

Los campos vacíos muestran cuadrados de prueba. La carátula se ajusta al tamaño de la pantalla manteniendo sus proporciones.

## Publicar gratis en GitHub Pages

1. Sube `index.html`, `styles.css`, `app.js`, la carpeta `audio` y la carpeta de imágenes, si la usas, a la raíz de la rama `main` de un repositorio público.
2. En el repositorio, entra en **Settings → Pages** y elige **Deploy from a branch**.
3. Elige **main** y **/ (root)**, guarda y espera a que Pages muestre el enlace de la web.

## Créditos de audio

El archivo opcional `audio/vitores.mp3` es la versión MP3 de [LFS_YayCheer.wav de xtrgamr](https://freesound.org/people/xtrgamr/sounds/432874/), bajo licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
