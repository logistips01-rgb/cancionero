const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

// La API key de Anthropic se guarda como secret de Firebase Functions:
//   firebase functions:secrets:set ANTHROPIC_API_KEY
// Nunca se expone al frontend — solo vive aquí, en el backend.
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = [
  'Eres un colaborador de composición de canciones.',
  'Nunca sustituyes la voz del autor: tu papel es únicamente completar lo que falta',
  'en la línea marcada, respetando el tono, el vocabulario, la métrica y el estilo',
  'que el autor ya ha mostrado en el resto de la canción escrita hasta ahora.',
  'Responde EXCLUSIVAMENTE con un JSON estricto, sin texto adicional antes ni después,',
  'con esta forma exacta: {"lyric": "...", "chord": "...", "nota": "..."}.',
  'El campo "lyric" es el texto de la línea (sin acordes ni corchetes).',
  'El campo "chord" es un único acorde sugerido para el inicio de la línea, coherente',
  'con la tonalidad de la canción (o una cadena vacía si no aplica ningún acorde).',
  'El campo "nota" es una explicación breve, en español, de por qué sugieres ese acorde.'
].join(' ');

function buildUserPrompt({ title, artist, key, lines, targetIndex }) {
  const context = lines
    .map((l, i) => {
      const marker = i === targetIndex ? '>>> LÍNEA A COMPLETAR >>> ' : '';
      const chord = l && l.chord ? `[${l.chord}] ` : '';
      const lyric = l && l.lyric ? l.lyric : '';
      return `${marker}${chord}${lyric}`;
    })
    .join('\n');

  return [
    `Título: ${title || '(sin título)'}`,
    `Artista/autor: ${artist || '(sin especificar)'}`,
    `Tonalidad: ${key || '(sin especificar)'}`,
    '',
    'Líneas de la canción escritas hasta ahora (la marcada con >>> es la que debes completar):',
    context,
    '',
    'Completa SOLO la línea marcada. Responde únicamente con el JSON estricto indicado en las instrucciones.'
  ].join('\n');
}

function extractSuggestion(text) {
  const match = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : text);
  return {
    lyric: typeof parsed.lyric === 'string' ? parsed.lyric : '',
    chord: typeof parsed.chord === 'string' ? parsed.chord : '',
    nota: typeof parsed.nota === 'string' ? parsed.nota : ''
  };
}

exports.suggestLine = onCall({ secrets: [ANTHROPIC_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para pedir sugerencias.');
  }

  const { title, artist, key, lines, targetIndex } = request.data || {};

  if (!Array.isArray(lines) || typeof targetIndex !== 'number' || targetIndex < 0 || targetIndex >= lines.length) {
    throw new HttpsError('invalid-argument', 'Datos de la canción incompletos o índice de línea inválido.');
  }

  const userPrompt = buildUserPrompt({ title, artist, key, lines, targetIndex });

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY.value(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
  } catch (err) {
    console.error('Error contactando con Anthropic:', err);
    throw new HttpsError('unavailable', 'No se pudo contactar con el servicio de sugerencias.');
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error('Anthropic API error:', response.status, errText);
    throw new HttpsError('internal', 'El servicio de sugerencias respondió con un error.');
  }

  const body = await response.json();
  const textBlock = Array.isArray(body.content) ? body.content.find((b) => b.type === 'text') : null;
  if (!textBlock) {
    throw new HttpsError('internal', 'Respuesta inesperada del servicio de sugerencias.');
  }

  try {
    return extractSuggestion(textBlock.text);
  } catch (err) {
    console.error('No se pudo interpretar la respuesta como JSON:', textBlock.text);
    throw new HttpsError('internal', 'No se pudo interpretar la sugerencia recibida.');
  }
});
