/* Minimalny backend licznika dla Cloudflare Workers + D1.
   Zlicza tylko wysłane pytania, bez treści wiadomości i bez danych użytkownika. */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function todayInWarsaw() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    if (request.method === 'GET' && url.pathname.replace(/\/$/, '') === '/stats') {
      const row = await env.DB.prepare('SELECT questions FROM daily_questions WHERE day = ?')
        .bind(todayInWarsaw()).first();
      return json({ date: todayInWarsaw(), questionsToday: Number(row?.questions) || 0 });
    }

    if (request.method === 'POST' && url.pathname.replace(/\/$/, '') === '/question') {
      const day = todayInWarsaw();
      await env.DB.prepare(
        'INSERT INTO daily_questions (day, questions) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET questions = questions + 1'
      ).bind(day).run();
      return json({ ok: true, date: day });
    }

    return json({ error: 'Not found' }, 404);
  }
};
