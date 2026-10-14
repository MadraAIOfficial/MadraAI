/* Globalny licznik dla statycznej strony GitHub Pages.
   Wysyła wyłącznie informację „jedno pytanie”; nigdy nie przesyła tekstu pytania. */
(() => {
  'use strict';

  const COUNTER_API = 'https://abacus.jasoncameron.dev';
  const COUNTER_NAMESPACE = 'madraai-official-sterling';
  const countNode = document.getElementById('questionsToday');
  const latestNode = document.getElementById('latestModel');

  function todayInWarsaw() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${date.year}-${date.month}-${date.day}`;
  }

  function counterUrl(action) {
    const key = `questions-${todayInWarsaw()}`;
    return `${COUNTER_API}/${action}/${encodeURIComponent(COUNTER_NAMESPACE)}/${encodeURIComponent(key)}`;
  }

  function latestPublishedModel() {
    const files = Array.isArray(window.MADRAAI_PUBLISHED_MODELS)
      ? window.MADRAAI_PUBLISHED_MODELS
      : [];
    const names = files.map(file => String(file).replace(/\.mai$/i, ''));
    names.sort((a, b) => {
      const version = name => name.match(/\d+(?:\.\d+)*/)?.[0]?.split('.').map(Number) || [];
      const av = version(a), bv = version(b);
      for (let i = 0; i < Math.max(av.length, bv.length); i++) {
        const difference = (bv[i] || 0) - (av[i] || 0);
        if (difference) return difference;
      }
      return b.localeCompare(a, 'pl');
    });
    return names[0] || 'Brak opublikowanego modelu';
  }

  function showCount(value) {
    if (!countNode) return;
    countNode.textContent = new Intl.NumberFormat('pl-PL').format(Math.max(0, Number(value) || 0));
    countNode.classList.remove('statsUnavailable');
  }

  if (latestNode) latestNode.textContent = latestPublishedModel();

  async function refresh() {
    if (!countNode) return;
    try {
      const response = await fetch(counterUrl('get'), { cache: 'no-store' });
      if (response.status === 404) return showCount(0);
      if (!response.ok) throw new Error('Counter read failed');
      const data = await response.json();
      showCount(data.value);
    } catch {
      countNode.textContent = 'Licznik chwilowo niedostępny';
      countNode.classList.add('statsUnavailable');
    }
  }

  async function trackQuestion() {
    try {
      const response = await fetch(counterUrl('hit'), { cache: 'no-store' });
      if (!response.ok) throw new Error('Counter update failed');
      const data = await response.json();
      showCount(data.value);
    } catch {
      refresh();
    }
  }

  window.MadraStats = { refresh, trackQuestion };
  refresh();
  window.setInterval(refresh, 60_000);
})();
