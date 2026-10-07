# Diseño implementado · Mono Poly on Chain

## Overview

Juego casual de propiedades para personas interesadas en Web3. La interfaz en español combina fondo crema, verde de selva, amarillo plátano y monos dibujados en SVG. El tablero es el centro visual; las acciones de turno, los dos jugadores y el saldo forman una columna auxiliar. La información técnica se concentra en el diálogo de cartera.

La composición pertenece a esta página de juego. Los patrones reutilizables son tarjetas claras, controles redondeados, ilustraciones de contorno marrón, un único siguiente paso amarillo y mensajes breves con una recuperación explícita.

## Colors

Fuente canónica: `src/styles.css:15`. Los valores se mantienen en hexadecimal. Las variables primitivas alimentan roles; los colores de grupos del tablero son independientes de los estados de interacción.

| Token | Valor efectivo | Uso |
| --- | --- | --- |
| `--color-page` | `#f7f8f2` | Fondo general |
| `--color-surface` | `#ffffff` | Tarjetas, diálogos y controles secundarios |
| `--color-text` | `#284831` | Texto principal, cabecera y botón de cartera |
| `--color-muted` | `#687063` | Descripciones y metadatos |
| `--color-border` | `#e3e7dd` | Separación y contornos |
| `--color-accent` | `#f5cd50` | Acción principal disponible |
| `--color-accent-hover` | `#ebbf35` | Hover de acción principal |
| `--color-soft` | `#e9efe3` | Avisos informativos, avatares y fondos suaves |
| `--color-focus` | `#395cc2` | Contorno de foco de 3 px con separación de 4 px |
| `--color-error` / `--color-error-bg` | `#923c2c` / `#fff0e9` | Errores persistentes junto a la acción |
| `--brown-800` | `#44372b` | Texto de las casillas |

Las clases `.mint`, `.blue`, `.yellow`, `.purple` y `.peach` definen `--group`, `--group-soft` y `--group-ink`. Las franjas de propiedades son respectivamente `#8fb875`, `#88b8c5`, `#e8c45f`, `#ada0c7` y `#dda774`; los cuatro primeros grupos contienen propiedades, y melocotón distingue casillas especiales. La propiedad se indica además con las letras T/C y una descripción accesible. El estado activo también lleva texto, no solo color.

El tablero usa `#c1d2b5` entre casillas y `#e8efde` en el centro. El mono utiliza marrones y crema definidos directamente en `src/Art.tsx`; son colores de ilustración, no estados de controles. No hay un tema oscuro. Contrastes medidos y pares exactos figuran en `artifacts/browser-results.json`.

## Typography

Las fuentes variables locales se declaran al principio de `src/styles.css` con `font-display: swap`. DM Sans, pesos 400–700, es la familia de cuerpo; Outfit, pesos 400–900, es la de títulos, marca y cifras principales. Las dos tienen respaldo `sans-serif`. Los archivos WOFF2 están en `src/assets/fonts/` y se empaquetan con nombres hash. Se verificó la carga de ambas familias en los cinco tamaños de pantalla.

| Papel | Implementación |
| --- | --- |
| Título de página | Outfit 650, 43 px, interlínea 1,2, tracking −1,5 px; 38 px en móvil y 33 px hasta 390 px |
| Título de turno | Outfit 600, 23 px en escritorio; 25 px en la disposición apilada |
| Título de tarjeta | Outfit 600, normalmente 15–18 px |
| Introducción / diálogos | DM Sans 13–14 px; interlínea de 1,5–1,7 |
| Botones | DM Sans 600–700, 12–14 px; acciones secundarias compactas de 10 px en escritorio |
| Saldo | Outfit 600, 34 px; cifras tabulares; 31 px en móvil |
| Tablero | Outfit 600, 10–12 px para nombres; precios de 8–10 px según anchura |
| Decoración | Rótulos pequeños de la ilustración, de 6–9 px, no interactivos y ocultos en el tablero compacto |

Los títulos usan `text-wrap: balance`; los párrafos, `pretty`. Las direcciones largas usan `overflow-wrap: anywhere`; la dirección abreviada de la cabecera tiene su versión completa en el diálogo. Inputs de dirección: 16 px. El documento declara `lang="es"`. El logotipo «on chain» conserva el nombre de marca solicitado; el resto de las acciones y explicaciones está en español.

## Layout

La página y la cabecera comparten un máximo de 1320 px. El margen interior es de 34 px en escritorio, 24 px en anchuras intermedias, 20 px en la composición apilada y 14–15 px hasta 390 px. Se repiten separaciones de 8–12 px dentro de controles y 16–24 px entre grupos. No hay una escala de espaciado exportada como variables.

`.game-layout` usa `minmax(0, 1fr) 316px` con separación de 20 px; a 1100 px la columna lateral baja a 292 px. A 900 px la página se apila: tablero, acciones, jugadores/saldo, diario y explicación de la cadena. Jugadores y saldo mantienen dos columnas. La navegación pasa a una segunda fila.

El tablero usa una cuadrícula 7×7: 24 botones en el perímetro y una ilustración central 5×5. En escritorio grande, su relación de aspecto es 1,28 para equilibrarlo con los paneles laterales. Hasta 580 px es cuadrado y muestra todas las casillas como iconos; nombres y precios se consultan en el diálogo. Sus nombres accesibles completos se conservan. Los botones más pequeños midieron 34,56 px de ancho a 320 px, por encima de 24 px. El contenedor tiene desplazamiento horizontal de respaldo, pero ninguna de las cinco anchuras finales lo necesitó.

Las consultas finales están en `src/styles.css`: ≥1200, ≤1100, ≤900, ≤580 y ≤390 px. Hay dos bloques ≤900 que se complementan por orden de cascada; la composición apilada del segundo es la efectiva. La interfaz no fija acciones sobre el contenido ni utiliza barras flotantes que lo tapen. Los diálogos tienen un máximo de 520 px, altura máxima `calc(100dvh - 40px)` y desplazamiento interior.

Observado en Chromium: sin desbordamiento de página a 1440, 1024, 768, 390 y 320 px. Capturas inspeccionadas de escritorio, 768, 390 y 320 px. No se comprobó zoom nativo del navegador ni dispositivos físicos.

## Elevation & Depth

`--shadow-card: 0 2px 5px #344b2510` da una elevación ligera. Los bordes de 1 px separan tarjetas; el tablero mantiene borde verde de 2 px y franjas estructurales. Los dados usan una sombra inferior de 4 px. Las cartas decorativas combinan giro y una segunda arista, sin carga de animación.

Los diálogos nativos ocupan la capa superior, con fondo `#263a2cc0` y desenfoque de 4 px. Su sombra es `0 20px 100px #23331e40`. Los tokens de mono se superponen ligeramente al compartir casilla; su ubicación no tapa el texto de compra o alquiler.

## Shapes

Tarjetas: `--radius-card: 18px`. Controles: `--radius-control: 10px`. Diálogos: 24 px. Tablero: 12 px, reducido a 9 px en compacto; casillas: 4 px. Avatares de jugadores: 13 px. Las insignias de estado son cápsulas. Los controles principales miden al menos 44 px; botones de icono, 40 px. Las casillas tienen densidad propia del juego, con detalles completos en una ventana.

## Components

- **`Board`**, `src/App.tsx:47`: recibe `game` y `onSquare`. Cada casilla es un botón real con nombre, importes, propietario y ocupantes en su nombre accesible. La selección abre detalles, sin ejecutar una compra implícita.
- **`Modal`**, `src/App.tsx:148`: patrón nativo `<dialog>` con título, cierre visible, Escape, foco inicial dentro y restauración al elemento que lo abrió. La página queda inerte mientras se muestra. El cuerpo puede desplazarse sin mover la página.
- **Botones**, `.button.primary` / `.button.secondary`: amarillo para la acción de turno disponible, superficie blanca para acciones secundarias. Tienen estados hover, activo, foco, desactivado y texto de carga. El contrato pendiente bloquea más acciones y ofrece comprobar su recibo.
- **`Monkey`**, `src/Art.tsx`: `hero` activa cuerpo y sombrero; `variant` cambia el pañuelo verde/naranja; `className` ajusta el tamaño. El avatar y el mono central comparten el mismo dibujo vectorial.
- **`Icon`, `Banana`, `Jungle`, `Dice`**, `src/Art.tsx`: ilustraciones y pictogramas locales; iconos de interfaz con `currentColor` y trazo de 1,8 px. SVG decorativos ocultos del árbol accesible; los dados tienen etiqueta numérica.
- **Vistas de tablero y propiedades**, `src/App.tsx`: botones con `aria-pressed`; vacío explicativo con regreso al tablero; tarjetas de propiedades con valor y alquiler.
- **Diario y mensajes**, `src/App.tsx:772`: región estable `aria-live="polite"` para la última jugada, historial de hasta 40 entradas y mensajes de error persistentes. Reiniciar siempre pide confirmación.
- **Cartera**, `src/chain.ts` y `src/App.tsx`: explica práctica frente a Sepolia, saldo de prueba, conexión, despliegue, importación por dirección y recuperación. Se muestran direcciones reales y enlaces a recibos, sin fingir conexión ni confirmación.

La animación solo se habilita bajo `prefers-reduced-motion: no-preference`: transiciones de 150 ms, presión a escala 0,96 y tres oscilaciones cortas de dados. No hay animación de entrada, reproducción automática ni sonido. El modo reducido omite el movimiento.

## Do's and Don'ts

- Reutiliza los roles de color, las dos familias locales y los patrones de tarjeta y diálogo. No introduzcas fuentes o iconos remotos.
- Mantén una acción amarilla de turno disponible: lanzar o comprar. Usa texto y forma además de color para propietarios, errores y estados de cartera.
- Conserva los detalles completos de las casillas cuando el tablero use iconos. No reduzcas indefinidamente el tamaño de las etiquetas.
- Espera confirmación de una transacción y lee el contrato antes de actualizar el estado en cadena. Mantén separadas práctica y Sepolia.
- Para añadir otro panel, usa `.section-title`, una tarjeta con el radio de 18 px y espaciado de 16–24 px; verifica su orden en la composición ≤900 px y su ajuste a 320 px.
- No añadas apuestas, mercados de tokens o premios reales sobre la aleatoriedad actual.

Este documento describe la fuente final. La revisión y los límites de comprobación están en `artifacts/validation.md`. Método documental adaptado de Impeccable; atribución y licencias en `artifacts/design-guidance-NOTICE.md` y `artifacts/design-guidance-LICENSE.txt`.
