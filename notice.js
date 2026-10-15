/* notice.js — jednorazowy komunikat awaryjny
 * Pojawia się przy każdym wejściu/odświeżeniu strony aż do końca dnia 15.10.2026.
 * Od 16.10.2026 nie wyświetla się wcale.
 * Można zamknąć X — ale pojawi się ponownie po odświeżeniu (nie zapisujemy w localStorage).
 */
(function () {
  'use strict';

  // Ostatni dzień kiedy pasek ma się pokazywać (włącznie)
  var LAST_DAY = '2026-10-15';

  function todayStr() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  if (todayStr() > LAST_DAY) return;

  var bar = document.createElement('div');
  bar.id = 'siteNotice';
  bar.setAttribute('role', 'alert');
  bar.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'right:0',
    'z-index:9999',
    'background:#c0392b',
    'color:#fff',
    'font:14px system-ui,sans-serif',
    'padding:10px 48px 10px 16px',
    'text-align:center',
    'line-height:1.45',
    'box-shadow:0 2px 8px rgba(0,0,0,.35)'
  ].join(';');
  bar.textContent = 'Dzisiaj od godziny 8:00 do godziny 13:00 model Sterling\u00a01.2 nie dzia\u0142a\u0142, lecz zosta\u0142o ju\u017c to naprawione. Ten komunikat przestanie si\u0119 pojawia\u0107 jutro (16.10.2026).';

  var btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Zamknij komunikat');
  btn.style.cssText = [
    'position:absolute',
    'right:10px',
    'top:50%',
    'transform:translateY(-50%)',
    'background:transparent',
    'border:none',
    'color:#fff',
    'font-size:20px',
    'line-height:1',
    'cursor:pointer',
    'padding:4px 8px',
    'border-radius:4px'
  ].join(';');
  btn.textContent = '\u00d7';
  btn.onclick = function () { bar.remove(); };
  bar.appendChild(btn);

  // Wstaw na samym początku body albo przed pierwszym dzieckiem
  function insert() {
    if (document.body) {
      document.body.insertBefore(bar, document.body.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.insertBefore(bar, document.body.firstChild);
      });
    }
  }
  insert();
})();
