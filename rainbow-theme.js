(() => {
  const palette = ['#f0203d', '#f47700', '#e3b500', '#138b45', '#1265dc', '#783acb', '#d32986'];
  let active = false;
  let observer = null;
  let breakMode = false;
  const brokenElements = new Set();
  const queuedElements = new Set();
  const breakQueue = [];
  let breakingOne = false;

  function isOrzech21Selected() {
    const name = document.querySelector('#models')?.selectedOptions?.[0]?.textContent?.trim() || '';
    return /^Orzech\s+2\.1(?:\.mai)?$/iu.test(name);
  }

  function colorizeBubble(bubble) {
    if (!active || !bubble) return;
    const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue || !/\S/u.test(node.nodeValue)) continue;
      if (node.parentElement?.closest('.rainbowLetter,button,summary,svg')) continue;
      nodes.push(node);
    }
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      let colorIndex = 0;
      for (const character of node.nodeValue) {
        if (/\s/u.test(character)) {
          fragment.append(document.createTextNode(character));
          continue;
        }
        const letter = document.createElement('span');
        letter.className = 'rainbowLetter';
        letter.style.setProperty('--rainbow-letter-color', palette[colorIndex % palette.length]);
        letter.textContent = character;
        fragment.append(letter);
        colorIndex++;
      }
      node.replaceWith(fragment);
    }
  }

  function setRainbowTheme(enabled) {
    active = Boolean(enabled);
    document.body.classList.toggle('rainbowTheme', active);
    if (active) {
      document.body.classList.remove('themeLight', 'themeDongus', 'themeNocturne');
      document.querySelectorAll('[data-theme-choice]').forEach(button => {
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
      });
      const label = document.querySelector('#themeOpenLabel');
      if (label) label.textContent = document.documentElement.lang === 'en' ? 'Rainbow' : 'Tęczowy';
      const swatch = document.querySelector('#themeOpenSwatch');
      if (swatch) swatch.className = 'themeSwatch rainbowSwatch';
      document.querySelectorAll('#chat .bubble').forEach(colorizeBubble);
      observer?.disconnect();
      const chat = document.querySelector('#chat');
      if (chat) {
        observer = new MutationObserver(() => {
          if (active) document.querySelectorAll('#chat .bubble').forEach(colorizeBubble);
        });
        observer.observe(chat, { childList: true, characterData: true, subtree: true });
      }
    } else {
      observer?.disconnect();
      observer = null;
    }
  }

  function handleCommand() {
    if (!isOrzech21Selected()) return false;
    const input = document.querySelector('#input');
    const command = input?.value.trim().toLocaleLowerCase('pl');
    if (command !== '/rainbow' && command !== '/break') return false;
    input.value = '';
    window.add(command, 'user');
    if (command === '/rainbow') {
      window.add('🌈💗', 'bot');
      setRainbowTheme(true);
    } else {
      startBreakMode();
    }
    return true;
  }

  function spawnBurst(x, y) {
    const colors = ['#ff5470', '#ffb347', '#ffe45e', '#57d68d', '#58a6ff', '#c084fc', '#ff78c8'];
    const flash = document.createElement('span');
    flash.className = 'breakFlash';
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    document.body.append(flash);
    flash.addEventListener('animationend', () => flash.remove(), { once: true });
    for (let index = 0; index < 12; index++) {
      const angle = Math.PI * 2 * index / 12 + Math.random() * .18;
      const distance = 32 + Math.random() * 78;
      const particle = document.createElement('span');
      particle.className = 'breakParticle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      particle.style.setProperty('--spin', `${Math.round(Math.random() * 400 - 200)}deg`);
      particle.style.setProperty('--particle-size', `${4 + Math.random() * 6}px`);
      particle.style.setProperty('--particle-color', colors[index % colors.length]);
      document.body.append(particle);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
    }
  }

  function resetBreakMode() {
    breakMode = false;
    breakingOne = false;
    breakQueue.length = 0;
    queuedElements.clear();
    brokenElements.forEach(element => element.classList.remove('breakHidden', 'breakGone'));
    brokenElements.clear();
    document.querySelectorAll('.breakParticle,.breakFlash').forEach(effect => effect.remove());
    document.querySelector('.breakReset')?.remove();
    document.body.classList.remove('breakMode');
  }

  function startBreakMode() {
    breakMode = true;
    document.body.classList.add('breakMode');
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'breakReset';
    reset.textContent = 'Reset';
    reset.setAttribute('aria-label', 'Reset');
    document.body.append(reset);
  }

  function breakNextElement() {
    if (!breakMode || breakingOne || !breakQueue.length) return;
    const item = breakQueue.shift();
    if (!item || !item.element.isConnected) {
      if (item) queuedElements.delete(item.element);
      breakNextElement();
      return;
    }
    breakingOne = true;
    const { element, x, y } = item;
    brokenElements.add(element);
    spawnBurst(x, y);
    element.classList.add('breakHidden');
    window.setTimeout(() => {
      if (!breakMode || !queuedElements.has(element)) return;
      element.classList.add('breakGone');
      window.setTimeout(() => {
        queuedElements.delete(element);
        breakingOne = false;
        breakNextElement();
      }, 160);
    }, 420);
  }

  function queueElementBreak(element, x, y) {
    if (!element || element === document.body || element === document.documentElement || element.closest('.breakReset')) return;
    if (queuedElements.has(element) || brokenElements.has(element)) return;
    queuedElements.add(element);
    breakQueue.push({ element, x, y });
    breakNextElement();
  }

  document.addEventListener('click', event => {
    const target = event.target?.nodeType === Node.ELEMENT_NODE ? event.target : event.target?.parentElement;
    if (breakMode) {
      if (target?.closest('.breakReset')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        resetBreakMode();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const element = target?.closest('.avatar') ||
        target?.closest('.bubble,.importantPost,.extraPost,.globalStat,.top,.compose,.homeInner,.startChat,.discordButton,.announcementCard') ||
        target?.closest('button,a,input,textarea,select,h1,h2,h3,p,img,label,span') || target;
      queueElementBreak(element, event.clientX, event.clientY);
      return;
    }
    if (target?.closest('[data-theme-choice]') && active) setRainbowTheme(false);
    if (target?.closest('#send') && handleCommand()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.id === 'models' && !isOrzech21Selected()) {
      if (active) setRainbowTheme(false);
      if (breakMode) resetBreakMode();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.target?.id !== 'input' || event.key !== 'Enter' || event.shiftKey || event.isComposing || event.repeat) return;
    if (handleCommand()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
