# Mono Poly on Chain

Un juego de propiedades en español: 24 casillas, monos exploradores, cartas de la selva y una partida rápida contra Coco. Incluye práctica inmediata y partidas almacenadas en un contrato de Sepolia.

## Instalar, desarrollar y previsualizar

Requiere Node.js 22.12+ y npm. La entrega se comprobó con Node.js 24.9.0 y npm 11.6.0.

```sh
npm ci
npm run dev
```

Para reconstruir y ver la versión de producción:

```sh
npm run build
npm run preview
```

Vite muestra la dirección local en la terminal. `build` compila `contracts/MonoPoly.sol`, regenera `src/contract.json`, comprueba TypeScript y produce `dist/`. El contrato compilado y la exportación están incluidos: no necesitas Solidity ni un servidor para visitar la versión publicada.

El lockfile y la versión de Rollup fijada en `package.json` son parte de la entrega. Rollup 4.64.2 se quedaba detenido al transformar incluso una entrada mínima de React en este entorno; 4.52.4 completó la misma prueba y la aplicación.

Durante esta asignación, la instalación y las compilaciones se realizaron en `/tmp/mono-poly-build`, copiando allí el código. Las dependencias, los navegadores y las cachés permanecieron fuera del repositorio. Para una instalación ordinaria, `npm ci` crea dependencias locales; no las incluyas en una entrega ni en la publicación.

## Publicar

Publica **todo el contenido de `dist/`**, incluido `assets/` y el favicon, en cualquier alojamiento estático con HTTPS. No es necesario ejecutar el build en el alojamiento. El punto de entrada es `dist/index.html`.

`vite.config.ts` utiliza `base: './'`; scripts, estilos, fuentes y favicon tienen rutas relativas. La página usa fragmentos y diálogos, sin rutas que necesiten reescrituras del servidor. Se comprobó la exportación bajo `/preview/`. También puede alojarse bajo una subcarpeta o un gateway que sirva HTML y recursos estáticos. Sirve JavaScript, CSS y WOFF2 con sus tipos MIME habituales. No abras el HTML mediante `file://`: utiliza un servidor HTTP.

La exportación final ocupa 610.935 bytes; la entrega completa de fuente, documentación y evidencias ronda 1,94 MiB, por debajo del límite de 8 MiB. El inventario exacto está en `artifacts/submission-size.json`.

Conserva fuente, `package.json`, `package-lock.json`, configuración, contrato y `dist/` en la entrega. Publica únicamente `dist/`; no publiques `node_modules`, cachés, navegadores de prueba ni las evidencias. No se utiliza backend, variable de entorno, clave privada, submódulo ni registro npm vendorizado. No se ha creado o cambiado ningún archivo de exclusión.

## Jugar

- Empiezas con 1.500 plátanos y juegas contra Coco. Lanza los dados y compra la propiedad libre en la que caigas, si te alcanza el saldo.
- Los alquileres, el peaje de 100 y las cartas se aplican automáticamente. Pasar por Salida da 200 plátanos.
- Suerte salvaje entrega 150, cobra 75 o envía a Salida con 200. Fondo de la selva entrega 100.
- «¡A la jaula!» envía a la casilla de visita y hace perder la siguiente tirada. Caer directamente en «De visita» no penaliza.
- «Terminar turno» hace jugar a Coco. Compra si puede conservar más de 200 plátanos después de pagar.
- Tras 20 rondas gana el mayor patrimonio: saldo más precio original de las propiedades. Un saldo de cero termina la partida; también se admite empate.

No hay construcciones, subastas, hipotecas ni bonificación por dobles. La práctica se conserva en este navegador. «Nueva práctica» pide confirmación; la vista de propiedades, las casillas y el diario ofrecen detalles. En móvil el tablero muestra iconos: selecciona una casilla para leer su nombre y sus importes.

## Conectar una cartera y guardar en Sepolia

1. Instala MetaMask, usa otra cartera que inyecte un proveedor EIP-1193, o abre el sitio desde el navegador de esa cartera.
2. Selecciona «Conectar cartera» y acepta el cambio a Sepolia. Necesitas ETH **de prueba** para las comisiones; los plátanos no tienen valor monetario.
3. Selecciona «Crear nueva partida en Sepolia». La cartera despliega tu propio contrato y muestra la comisión antes de confirmar. La práctica permanece separada.
4. Confirma en tu cartera cada tirada, compra y fin de turno. La interfaz espera el recibo y vuelve a leer el estado del contrato; no presenta una operación pendiente como confirmada.
5. Al regresar, conecta la misma cuenta y selecciona «Recuperar partida de Sepolia». Se conserva la dirección del contrato y cualquier transacción pendiente. También puedes introducir manualmente la dirección del contrato desde otro navegador.

La dirección completa y enlaces al explorador aparecen en «La cadena». Copia esa dirección si desactivas el almacenamiento local. El diario de interfaz conserva las últimas 40 entradas de la sesión; el contrato conserva el estado actual y sus eventos en la cadena. Crear otra partida no borra contratos anteriores, pero sustituye el acceso rápido local: conserva la dirección anterior para recuperarla.

`contracts/MonoPoly.sol` controla posiciones, saldos, propietarios, turnos y resultado. Solo la cuenta que lo desplegó puede llamar a las acciones. No hay un método para sobrescribir el estado, transferencias de tokens, depósitos ni permisos sobre fondos. Una cuenta juega contra un oponente automático; no es multijugador entre distintas carteras.

La aleatoriedad utiliza datos del bloque: **es un juego casual de prueba, no un sistema de apuestas con azar resistente a manipulación**. No debe adaptarse a premios o activos con valor sin sustituir ese mecanismo y auditar el contrato. No se ha desplegado un contrato público predefinido ni se han utilizado fondos del usuario.

## Comprobaciones ejecutadas

```sh
npm run build
npm run typecheck
npm test
npm run test:contract
npx playwright install chromium
npm run test:browser
```

Resultados de la última ejecución:

| Comprobación | Resultado |
| --- | --- |
| Build de producción | Correcto; 426 módulos; contrato de 6.155 bytes |
| TypeScript | Correcto, sin errores |
| Reglas de juego | 9 pruebas correctas |
| Contrato en EVM local | 169 aserciones; 20 rondas; 5 compras; 11 eventos de pago |
| Interacciones en Chromium | 36 comprobaciones correctas: juego con teclado, compra, alquiler, cartera, recuperación y errores |
| Anchuras | 1440, 1024, 768, 390 y 320 px, sin desbordamiento horizontal de la página |
| Axe WCAG A/AA | 0 infracciones detectadas a 1440 y 320 px |
| Consola y recursos | 0 errores; recursos locales correctos bajo `/preview/` |

`tests/browser.mjs` abre y cierra su propio servidor de producción y navegador en una ejecución acotada. Para esta entrega se utilizó `PLAYWRIGHT_BROWSERS_PATH=/tmp/mono-poly-browsers`: el navegador del conector integrado no estaba instalado. Ganache mostró una advertencia sobre su extensión nativa para Node 24 y utilizó correctamente su implementación JavaScript.

La prueba de cartera usa una interfaz inyectada simulada **con ejecución real del contrato en Ganache**, incluyendo recibos, recarga durante una transacción pendiente y recuperación posterior. No establece que se hayan probado una extensión real, dispositivos físicos o la red pública de Sepolia. Tampoco se realizó una sesión con lector de pantalla, zoom nativo al 200 %, Safari o Firefox. Estos límites y la revisión de las seis áreas de Better Interface están detallados en [artifacts/validation.md](artifacts/validation.md). No constituyen una certificación independiente.

## Archivos principales

- `src/App.tsx`: tablero, paneles, diálogos y coordinación de cartera.
- `src/game.ts`: reglas de práctica y validación del guardado.
- `src/chain.ts`: conexión, despliegue, acciones, recibos y lectura del contrato.
- `src/Art.tsx`: ilustraciones SVG originales, iconos y dados.
- `src/styles.css` y `src/assets/fonts/`: diseño adaptable y fuentes locales.
- `contracts/`, `scripts/`, `tests/`: contrato, compilación y comprobaciones reproducibles.
- [DESIGN.md](DESIGN.md): sistema visual implementado.
- `artifacts/`: revisión, resultados y capturas reales de la exportación final.

Fuentes DM Sans y Outfit bajo SIL Open Font License; sus licencias están en `public/fonts/` y en la exportación. La guía de diseño utilizada se atribuye en `artifacts/design-guidance-NOTICE.md`, con sus licencias conservadas.
