# Hoja de ruta — Guitle AI

## Antes de publicarlo en la web real de venta de guitarras

- **Cambiar la canción de demo**: Sultans of Swing (con copyright) vale para
  pruebas internas, pero no puede ser lo que vea un cliente real sin
  licencia. Sustituir por dominio público, royalty-free, o una demo grabada
  por la propia tienda tocando una guitarra del catálogo (esto último sirve
  también de promoción directa).
- **Aviso de marca**: añadir una línea pequeña tipo "Guitle AI no está
  afiliado con Guitar Hero® ni Activision".
- **Versión táctil/móvil**: hoy solo se juega con teclado (A S D F G H +
  Espacio) y el lienzo es de tamaño fijo (480x560px) — la mayoría de
  visitantes de una tienda entrarán desde el móvil, así que hace falta
  una interfaz táctil (botones en pantalla) y un lienzo que se adapte al
  tamaño de pantalla antes de que esto sea un buen reclamo real.
- **Hosting de verdad**: el enlace de pruebas (raw.githack.com) es solo
  para desarrollo entre nosotros — para producción hay que alojarlo en el
  hosting propio de la tienda o en Firebase junto al resto de Cancionero.
- **No publicar todavía el buscador de canciones** (ver más abajo, sigue
  en fase futura) — exponerlo a clientes reales antes de resolver bien la
  fuente del MIDI y los casos sin resultado daría mala impresión.
- Insertarlo como página/sección aparte (no en el menú principal), con un
  botón tipo "Prueba nuestras guitarras con IA", idealmente en un iframe
  aislado del resto de la web para que un fallo del juego no afecte a la
  tienda.

Marca del producto: **Guitle AI** (antes "Guitar Hero" / "Guitle Game" —
renombrado para no usar la marca registrada de Activision). Dos líneas de
producto bajo el mismo nombre, con requisitos legales distintos:

1. **Juego gratuito** (`beta/guitar-hero-prototype.html`, lo que tenemos hoy):
   gancho para atraer clientes a la web de venta de guitarras. Por eso debe
   ser gratis de verdad (sin coste por uso) — ver el apartado de instrumento
   más abajo sobre por qué esto apunta a procesado 100% en el navegador.
2. **App de pago de separación de pistas** (fase futura, producto aparte, no
   es lo de hoy): el usuario sube un MP3 suyo y la app lo separa en pistas
   (voz, guitarra, bajo, batería) para hacerse sus propios backing tracks.
   Mismo modelo que Moises.ai / LALAL.AI / Audioshake — cobrar por la
   herramienta no cambia lo que hace falta para cumplir (ver más abajo),
   pero sí añade alcance real: servidor con cómputo (tipo Demucs), cuentas
   de usuario, cobro. No se monta en esta sesión.

## Instrumento de origen de la canción, y por qué importa para el coste

- Para el juego gratuito, usar una canción famosa de banda completa (ej.
  Sultans of Swing) obliga a conseguir una licencia o sustituirla por algo
  de dominio público / royalty-free antes de publicarlo en la web del
  negocio — usar un fragmento corto NO evita esto, no existe tal excepción.
- Alternativa que encaja mejor con "gratis, cero infraestructura": que el
  propio usuario (o la tienda) grabe una pista de UN SOLO instrumento
  (una demo tocando una guitarra del catálogo, por ejemplo) y se analice
  tono/ritmo en el propio navegador (sin servidor, sin IA pesada) para
  generar un chart jugable. Evita además todo el tema de copyright de
  canciones de terceros, porque la grabación es de quien la sube.

## Reglas que valen para subir archivos de usuarios (gratis o de pago)

- Cada archivo subido y lo que se genera a partir de él se queda privado
  de quien lo sube — nunca se convierte en una biblioteca que puedan usar
  otros usuarios (eso sí sería distribución pública, con copyright de por
  medio, sin importar si se cobra o no por el servicio).
- Términos de uso: quien sube declara tener derecho a ese archivo.
- Mejor si el procesado ocurre en el navegador del usuario (nunca toca tu
  servidor); si hace falta servidor (separación de pistas real), no
  guardar el archivo más de lo necesario para el procesado.

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
