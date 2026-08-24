# Paleta de marca — Cromática Creativa

Derivada muestreando los píxeles reales del isotipo `favicon/favicon-cc.png`
(decodificación PNG y agrupación por tono). El isotipo es una "C" con un degradado
tipo arcoíris.

## Color principal (interactivo)

`#7C3AED` — violeta profundo de la familia del isotipo. Se usa en botones,
enlaces, focus y estados activos. Contraste con texto blanco ≈ 5.7:1 (AA para
texto normal). Hover: `#6D28D9`.

Este es el valor de `project_color` y del token `primary` del theme; también es
el color que adopta la animación de fondo del login (shader), que lee
`--project-color`.

## Paleta multicolor (identidad, detalles)

Tonos muestreados del isotipo, para elementos decorativos donde el CSS aplique:

| Tono | Hex | Muestra |
| --- | --- | --- |
| Rosa | `#F3288D` | hue ~330 |
| Magenta | `#DA40CF` | hue ~300 |
| Violeta | `#A469E0` | hue ~270 |
| Azul | `#5FA5F0` | hue ~210 |
| Cian | `#61CDD6` | hue ~180 |
| Verde | `#8FD152` | hue ~100 |
| Amarillo | `#EBD92E` | hue ~60 |

Se usa una selección reducida (4–6) sobre fondo blanco, con saturación moderada.

## Limitación conocida: animación multicolor

La animación del login es un **shader WebGL** del core de Directus
(`@directus/app/dist/assets/shader-background-*.js`) que solo recibe
`--project-color` (un tono). Por eso la animación se conserva y se tiñe al
violeta de Cromática, pero **no** puede volverse multicolor por vías soportadas
sin modificar el core (prohibido). Ver el reporte y el README para el detalle.
