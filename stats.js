/* Globalny licznik pytań i informacja o najnowszym opublikowanym modelu.
   Po wdrożeniu stats-backend wstaw jego adres (np. https://madraai-stats.<konto>.workers.dev).
   Sam GitHub Pages nie przechowuje wspólnego licznika pomiędzy odwiedzającymi. */
(() => {
  'use strict';

  const API_BASE = ''; // Uzupełnij adresem wdrożonego stats-backend.
  const countNode = document.getElementById('questionsToday');
  const latestNode = document.getElementById('latestModel');

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

  if (latestNode) latestNode.textContent = latestPublishedModel();

  function unavailable() {
    if (!countNode) return;
    countNode.textContent = API_BASE ? 'Nie udało się wczytać' : 'Licznik wymaga podłączenia';
    countNode.classList.add('statsUnavailable');
  }

  async function refresh() {
    if (!countNode) return;
    if (!API_BASE) return unavailable();
    try {
      const response = await fetch(`${API_BASE.replace(/\/$/, '')}/stats`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Stats request failed');
      const data = await response.json();
      countNode.textContent = new Intl.NumberFormat('pl-PL').format(Number(data.questionsToday) || 0);
      countNode.classList.remove('statsUnavailable');
    } catch {
      unavailable();
    }
  }

  async function trackQuestion() {
    if (!API_BASE) return;
    try {
      await fetch(`${API_BASE.replace(/\/$/, '')}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        keepalive: true
      });
      refresh();
    } catch { /* Brak licznika nie blokuje czatu. */ }
  }

  window.MadraStats = { refresh, trackQuestion };
  refresh();
})();
