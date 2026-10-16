/* Globalny licznik dla statycznej strony GitHub Pages.
   Wysyła do usługi wyłącznie zdarzenie „jedno pytanie”, nigdy treści wiadomości. */
(() => {
  'use strict';

  const COUNTER_API = 'https://abacus.jasoncameron.dev';
  const COUNTER_NAMESPACE = 'madraai-official-sterling';
  const REQUEST_TIMEOUT_MS = 8000;
  const countNode = document.getElementById('questionsToday');
  const loadingNode = document.getElementById('questionsLoading');
  const latestNode = document.getElementById('latestModel');
  let refreshInFlight = null;

  function setLoading(isLoading) {
    if (loadingNode) loadingNode.hidden = !isLoading;
  }

  function todayInWarsaw() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${date.year}-${date.month}-${date.day}`;
  }

  function counterKey() {
    return `questions-${todayInWarsaw()}`;
  }

  function counterUrl(action) {
    return `${COUNTER_API}/${action}/${encodeURIComponent(COUNTER_NAMESPACE)}/${encodeURIComponent(counterKey())}`;
  }

  function localCacheKey() {
    return `madraai-counter-cache:${COUNTER_NAMESPACE}:${counterKey()}`;
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

  function remember(value) {
    try { localStorage.setItem(localCacheKey(), String(value)); } catch { /* Pamięć lokalna jest opcjonalna. */ }
  }

  function cachedValue() {
    try {
      const value = Number(localStorage.getItem(localCacheKey()));
      return Number.isSafeInteger(value) && value >= 0 ? value : null;
    } catch { return null; }
  }

  function showCount(value, stale = false) {
    if (!countNode) return;
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Nieprawidłowa wartość licznika');
    countNode.textContent = new Intl.NumberFormat('pl-PL').format(count);
    countNode.classList.toggle('statsUnavailable', stale);
    countNode.title = stale ? 'Pokazuję ostatni zapisany odczyt. Licznik odświeży się po przywróceniu połączenia.' : '';
    setLoading(false);
  }

  function showLastKnown() {
    const value = cachedValue();
    if (value === null) {
      if (countNode) {
        countNode.textContent = 'Licznik chwilowo niedostępny';
        countNode.classList.add('statsUnavailable');
        countNode.title = 'Nie udało się jeszcze pobrać wartości licznika.';
        setLoading(false);
      }
      return;
    }
    showCount(value, true);
  }

  async function requestJson(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: 'GET', cache: 'no-store', credentials: 'omit', signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function parseCount(data) {
    const value = Number(data?.value);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Usługa zwróciła nieprawidłowy licznik');
    return value;
  }

  if (latestNode) latestNode.textContent = latestPublishedModel();

  async function refresh() {
    if (!countNode) return;
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
      setLoading(cachedValue() === null);
      try {
        const response = await requestJson(counterUrl('get'));
        if (response.status === 404) {
          // 404 sygnalizuje błąd konfiguracji API, nie rzeczywisty wynik równy zero.
          showLastKnown();
          return;
        }
        if (!response.ok) throw new Error(`Odczyt licznika: HTTP ${response.status}`);
        const value = parseCount(await response.json());
        remember(value);
        showCount(value);
      } catch {
        showLastKnown();
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }

  async function trackQuestion() {
    setLoading(cachedValue() === null);
    try {
      const response = await requestJson(counterUrl('hit'));
      if (!response.ok) throw new Error(`Aktualizacja licznika: HTTP ${response.status}`);
      const value = parseCount(await response.json());
      remember(value);
      showCount(value);
    } catch {
      // Nie ponawiaj /hit: po zerwaniu połączenia serwer mógł już policzyć pytanie.
      showLastKnown();
      window.setTimeout(refresh, 5000);
    }
  }

  window.MadraStats = { refresh, trackQuestion };
  const queuedQuestions = Array.isArray(window.MadraStatsQueue) ? window.MadraStatsQueue : [];
  window.MadraStatsQueue = [];
  queuedQuestions.forEach(() => trackQuestion());

  // Od razu pokaż ostatni odczyt; chwilowy błąd sieci nie ukryje licznika.
  showLastKnown();
  refresh();
  window.setInterval(refresh, 120_000);
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
})();



