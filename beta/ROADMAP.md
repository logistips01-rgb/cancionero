# Hoja de ruta — Guitar Hero desde canción elegida por el usuario

## Fase futura: búsqueda y generación automática e instantánea

Visión final del prototipo `beta/guitar-hero-prototype.html`: el usuario entra,
busca/selecciona la canción que quiera (no un archivo fijo subido a mano como
ahora), y la web:

1. Busca automáticamente un MIDI de esa canción en la web.
2. Genera al vuelo el chart jugable (notas + cuerda/traste + música sintetizada).
3. Todo esto debe sentirse **instantáneo** — nada de "esperar a que procese en
   segundo plano", como lanzar un vídeo y que simplemente empiece.

## Lo que ya tenemos construido (ver conversación/commits de esta rama)

- Parser de MIDI (Standard MIDI File) sin dependencias, que separa canales por
  instrumento y calcula el tempo real del archivo.
- Generador de chart jugable a partir de un canal MIDI, con 3 variantes de
  cómo decidir cuerda+traste por nota (comparar cuál conviene usar por defecto):
  1. **Tablatura ASCII real** (cuerda/traste tal cual los escribió el
     transcriptor) — ritmo aproximado en tramos sin barra de compás.
  2. **MIDI + traste inferido** (algoritmo de menor salto de mano sobre
     afinación estándar) — ritmo exacto, dedos calculados, no reales.
  3. **MIDI por banda de altura** (sin cuerda/traste real, solo agrupado por
     rango de tono) — más simple pero menos fiel a una guitarra real.
- Sintetizador en Web Audio que reproduce guitarra/bajo/batería del propio
  MIDI (no la grabación real), sincronizado al mismo reloj que el juego.
- Render con perspectiva neón, mástil con trastes, partículas al acertar.

## Lo que falta para la visión completa

- **Búsqueda automática**: dado un título/artista, encontrar y descargar un
  MIDI candidato sin intervención manual (hoy lo hice a mano con bitmidi.com).
  Hay que decidir fuente(s) a consultar, cómo elegir entre varios resultados
  (igual que elegimos antes "el primer canal con menos notas = posible riff
  líder"), y qué hacer si no se encuentra nada para esa canción.
- **Generación instantánea**: el parseo MIDI + chart + fingering ya es rápido
  (todo corrió en milisegundos en Node para este prototipo), así que la parte
  difícil no es la velocidad de cómputo sino la latencia de ir a buscar el
  archivo fuera — probablemente haga falta un backend (Cloud Function, como
  ya existe `suggestLine` para Componer) que haga la búsqueda+descarga y
  devuelva el chart ya generado, en vez de hacerlo todo en el navegador.
- **Elegir una única estrategia de cuerda/traste por defecto** una vez se
  comparen las 3 variantes con canciones reales (pendiente de probar).
- Mismo aviso legal ya hablado para tablaturas: un MIDI de una canción con
  copyright es una transcripción no oficial de la composición, no una copia
  de la grabación — mismo nivel de riesgo ya aceptado, no el problema serio
  de piratear audio.
