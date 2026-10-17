(() => {
  const KEY_LANES = new Map([    ['ArrowLeft', 0], ['a', 0], ['A', 0],
    ['ArrowDown', 1], ['s', 1], ['S', 1],
    ['ArrowUp', 2], ['w', 2], ['W', 2],
    ['ArrowRight', 3], ['d', 3], ['D', 3]
  ]);
  const DIRECTIONS = ['left', 'down', 'up', 'right'];
  
  // Zaktualizowane kolory RGB podane przez użytkownika
  const COLORS = [
    'rgb(194, 75, 153)',
    'rgb(0, 255, 255)',
    'rgb(18, 250, 5)',
    'rgb(249, 57, 63)'
  ];

  const clean = value => String(value || '').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').replace(/[^a-z0-9]+/gu, ' ').trim();

  function matchesRequest(value) {
    const text = clean(value);
    return /\b(?:zagrajmy|gramy|zagraj|pogramy|zagramy)\b/u.test(text) && /\b(?:fnf|fnfa|friday\s+night\s+funkin)\b/u.test(text);
  }

  function mount(container) {
    const overlay = document.createElement('section');
    overlay.className = 'fnfGameInline';
    overlay.innerHTML = '<div class="fnfPanel"><div class="fnfStage" aria-label="Strzałki gry rytmicznej"><canvas class="fnfCanvas" aria-hidden="true"></canvas><img class="fnfOpponent" alt="" draggable="false"></div></div></div>';
    const chatRows = [...container.querySelectorAll('.message')];
    const app = container.closest('.app');
    container.append(overlay);

    const stage = overlay.querySelector('.fnfStage');
    const canvas = overlay.querySelector('.fnfCanvas');
    const opponent = overlay.querySelector('.fnfOpponent');
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    
    const notes = [];
    const opponentNotes = [];
    const activeNotes = new Set();
    const pressedUntil = [0, 0, 0, 0];
    const images = DIRECTIONS.map(direction => {
      const image = new Image();
      image.src = new URL(`FnF/arrow-${direction}.png`, document.baseURI).href;
      return image;
    });
    const tintedImages = [];
    const opponentImages = Object.fromEntries(['idle', ...DIRECTIONS].map(name => {
      const image = new Image();
      image.src = new URL(`FnF/${name}.svg`, document.baseURI).href;
      return [name, image];
    }));

    let audioCtx = null;
    let instBuffer = null;
    let voicesBuffer = null;
    let instSource = null;
    let voicesSource = null;
    let songStartAudioTime = 0;

    let raf = 0;
    let entryRaf = 0;
    let entryStart = 0;
    let nextNoteIndex = 0;
    let resizeHandler = null;
    let active = false;
    let ended = false;
    let score = 0;
    let combo = 0;
    let misses = 0;
    let accuracyPoints = 0;
    let totalNotes = 0;
    let hitWindow = 170;
    let scrollSpeed = 0.65;
    let receptorY = 106;
    let stageWidth = 0;
    let stageHeight = 0;
    let arrowSize = 76;
    let laneWidth = 0;
    let laneStart = 0;
    let dpr = 1;
    let bpmTimeline = [{ time: 0, beat: 0, bpm: 110 }];
    let lastBeat = -1;
    let cameraPulse = null;
    let opponentNoteIndex = 0;
    let opponentPoseUntil = 0;
    let opponentPose = 'idle';

    function makeTintedSprite(image, color) {
      const sprite = document.createElement('canvas');
      sprite.width = image.naturalWidth;
      sprite.height = image.naturalHeight;
      const spriteContext = sprite.getContext('2d');
      spriteContext.drawImage(image, 0, 0);
      spriteContext.globalCompositeOperation = 'source-in';
      spriteContext.fillStyle = color;
      spriteContext.fillRect(0, 0, sprite.width, sprite.height);
      return sprite;
    }

    function resizeStage() {
      const bounds = stage.getBoundingClientRect();
      stageWidth = bounds.width;
      stageHeight = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(stageWidth * dpr));
      canvas.height = Math.max(1, Math.round(stageHeight * dpr));
      canvas.style.width = `${stageWidth}px`;
      canvas.style.height = `${stageHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = window.innerWidth <= 560;
      receptorY = mobile
        ? Math.max(86, Math.min(116, window.innerHeight * .15))
        : Math.max(106, Math.min(152, window.innerHeight * .165));
      arrowSize = mobile ? Math.min(stageWidth * .19, 70) : Math.max(58, Math.min(90, stageWidth * .07));
      laneWidth = mobile ? Math.max(120, Math.min(270, stageWidth - 120)) : Math.min(stageWidth, 410);
      laneStart = mobile
        ? Math.max(0, stageWidth - laneWidth - 12)
        : Math.min(stageWidth - laneWidth - 20, stageWidth * .58);
    }

    function pulseCamera(scale, duration) {
      if (cameraPulse) cameraPulse.cancel();
      cameraPulse = stage.animate([        { transform: 'scale(1)' },        { transform: `scale(${scale})`, offset: .34 },        { transform: 'scale(1)' }      ], { duration, easing: 'cubic-bezier(.2,.75,.25,1)' });
    }

    function beatAt(songTime) {
      let segment = bpmTimeline[0];
      for (let index = 1; index < bpmTimeline.length; index++) {
        if (bpmTimeline[index].time > songTime) break;
        segment = bpmTimeline[index];
      }
      return Math.floor(segment.beat + (songTime - segment.time) * segment.bpm / 60000);
    }

    function laneX(lane) {
      return laneStart + laneWidth * (lane + .5) / 4;
    }

    function drawArrow(image, x, y, size, alpha = 1, tint = null, bright = false) {
      if (!image) return;
      const isCanvas = image instanceof HTMLCanvasElement;
      if (isCanvas ? !image.width || !image.height : !image.complete || !image.naturalWidth) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const half = size / 2;
      if (bright) ctx.filter = 'brightness(1.4)';
      ctx.drawImage(image, x - half, y - half, size, size);
      if (tint) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = tint;
        ctx.fillRect(x - half, y - half, size, size);
      }
      ctx.restore();
    }

    function drawFrame(songTime) {
      ctx.clearRect(0, 0, stageWidth, stageHeight);
      for (let lane = 0; lane < 4; lane++) {
        drawArrow(images[lane], laneX(lane), receptorY, arrowSize, .76, null, pressedUntil[lane] > performance.now());
      }
      // Player notes render last so they stay in front of the stationary receptors.
      for (const note of activeNotes) {
        const y = receptorY + (note.time - songTime) * scrollSpeed;
        drawArrow(tintedImages[note.lane], laneX(note.lane), y, Math.max(1, arrowSize - 8));
      }
    }

    function animateArrowEntry() {
      entryStart = performance.now();
      return new Promise(resolve => {
        const frame = now => {
          if (!overlay.isConnected) { resolve(); return; }
          const progress = Math.min(1, Math.max(0, (now - entryStart) / 460));
          const eased = 1 - Math.pow(1 - progress, 3);
          ctx.clearRect(0, 0, stageWidth, stageHeight);
          for (let lane = 0; lane < 4; lane++) {
            drawArrow(images[lane], laneX(lane), receptorY - (1 - eased) * 120, arrowSize, .76 * eased);
          }
          if (progress < 1) entryRaf = requestAnimationFrame(frame);
          else { drawFrame(0); resolve(); }
        };
        entryRaf = requestAnimationFrame(frame);
      });
    }

    function updateOpponent(songTime) {
      while (opponentNoteIndex < opponentNotes.length && opponentNotes[opponentNoteIndex].time <= songTime + 25) {
        const note = opponentNotes[opponentNoteIndex++];
        if (note.time >= songTime - 140) {
          opponentPose = DIRECTIONS[note.lane];
          opponentPoseUntil = performance.now() + 190;
        }
      }
      const nextPose = performance.now() < opponentPoseUntil ? opponentPose : 'idle';
      if (nextPose !== opponent.dataset.pose) {
        opponent.dataset.pose = nextPose;
        opponent.src = opponentImages[nextPose].src;
      }
    }

    function showJudgement(name) {
      const oldClones = stage.querySelectorAll('.fnfRatingClone');
      if (oldClones.length >= 4) oldClones[0].remove();
      const clone = document.createElement('img');
      clone.className = 'fnfRatingClone';
      clone.src = new URL(`FnF/${name}.png`, document.baseURI).href;
      clone.alt = '';
      stage.append(clone);
      clone.addEventListener('animationend', () => clone.remove(), { once: true });
    }

    function stopAudio() {
      if (instSource) {
        try { instSource.stop(); } catch (e) {}
        instSource.disconnect();
        instSource = null;
      }
      if (voicesSource) {
        try { voicesSource.stop(); } catch (e) {}
        voicesSource.disconnect();
        voicesSource = null;
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    }

    function dispose() {
      active = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(entryRaf);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      stopAudio();
      window.removeEventListener('keydown', onKeyDown);
      app?.classList.remove('fnfGamePlaying', 'fnfGameReturning');
      container.classList.remove('fnfChatActive');
      container.querySelectorAll('.fnfChatLeaving,.fnfChatReturning').forEach(row => {
        row.hidden = false;
        row.classList.remove('fnfChatLeaving', 'fnfLeaveRight', 'fnfLeaveLeft', 'fnfChatReturning', 'fnfReturnRight', 'fnfReturnLeft');
      });
      overlay.remove();
    }

    function showResult() {
      const accuracy = totalNotes ? (accuracyPoints / totalNotes * 100).toFixed(2) : '0.00';
      const text = `Piosenka dobiegła końca! Wynik: ${score} punktów, pudła: ${misses}, celność: ${accuracy}%.`;
      if (typeof window.add === 'function') { window.add(text, 'bot'); return; }
      const row = document.createElement('div'); row.className = 'message bot';
      const avatar = document.createElement('div'); avatar.className = 'avatar aiAvatar';
      const image = document.createElement('img'); image.src = 'Vectors/M%C4%85draAI%20Icon.svg'; image.alt = '';
      avatar.append(image);
      const content = document.createElement('div'); content.className = 'msgContent';
      const speaker = document.createElement('div'); speaker.className = 'speaker'; speaker.textContent = 'MądraAI';
      const bubble = document.createElement('div'); bubble.className = 'bubble bot'; bubble.textContent = text;
      content.append(speaker, bubble); row.append(avatar, content); container.append(row);
    }

    function finish() {
      if (ended) return;
      ended = true;
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      stopAudio();
      overlay.classList.add('fnfGameEnding');
      setTimeout(() => {
        if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        overlay.remove();
        app?.classList.remove('fnfGamePlaying');
        app?.classList.add('fnfGameReturning');
        chatRows.forEach(row => {
          row.hidden = false;
          row.classList.remove('fnfChatLeaving', 'fnfLeaveRight', 'fnfLeaveLeft');
          row.classList.add('fnfChatReturning', row.classList.contains('user') ? 'fnfReturnRight' : 'fnfReturnLeft');
        });
        setTimeout(() => {
          app?.classList.remove('fnfGameReturning');
          container.classList.remove('fnfChatActive');
          chatRows.forEach(row => row.classList.remove('fnfChatReturning', 'fnfReturnRight', 'fnfReturnLeft'));
          showResult();
        }, 480);
      }, 700);
    }

    function tick() {
      if (!active) return;
      const songTime = (audioCtx.currentTime - songStartAudioTime) * 1000;
      updateOpponent(songTime);

      const beat = beatAt(songTime);
      if (beat !== lastBeat) {
        lastBeat = beat;
        pulseCamera(beat % 4 === 0 ? 1.04 : 1.022, beat % 4 === 0 ? 210 : 150);
      }

      const spawnLimit = songTime + (stageHeight + arrowSize / 2 - receptorY) / scrollSpeed;
      while (nextNoteIndex < notes.length && notes[nextNoteIndex].time <= spawnLimit) {
        activeNotes.add(notes[nextNoteIndex++]);
      }

      for (const note of activeNotes) {
        if (note.time - songTime < -hitWindow) {
          activeNotes.delete(note);
          note.missed = true;
          misses++;
          combo = 0;
          showJudgement('shit');
        }
      }

      drawFrame(songTime);

      const audioDuration = Math.max(instBuffer?.duration || 0, voicesBuffer?.duration || 0) * 1000;
      if (songTime >= audioDuration) {
        finish();
        return;
      }

      if (ended) return;
      raf = requestAnimationFrame(tick);
    }

    function getCurrentSongTime() {
      if (!audioCtx) return 0;
      return (audioCtx.currentTime - songStartAudioTime) * 1000;
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); dispose(); return; }
      const lane = KEY_LANES.get(event.key);
      if (lane === undefined || !active || event.repeat) return;
      event.preventDefault();
      
      const now = performance.now();
      const songTime = getCurrentSongTime();
      let chosen = null;
      let bestDelta = Infinity;

      for (const note of activeNotes) {
        if (note.lane !== lane || note.hit || note.missed) continue;
        const delta = Math.abs(note.time - songTime);
        if (delta <= hitWindow && delta < bestDelta) { chosen = note; bestDelta = delta; }
      }

      pressedUntil[lane] = now + 110;
      pulseCamera(1.05, 190);
      if (!chosen) { combo = 0; return; }

      chosen.hit = true;
      activeNotes.delete(chosen);
      const delta = Math.abs(chosen.time - songTime);
      const judgementName = delta < 70 ? 'sick' : delta < 125 ? 'good' : 'bad';
      score += judgementName === 'sick' ? 300 : judgementName === 'good' ? 150 : 50;
      accuracyPoints += judgementName === 'sick' ? 1 : judgementName === 'good' ? .7 : .4;
      combo++;
      showJudgement(judgementName);
    }

    async function beginSong() {
      if (!notes.length || active || !overlay.isConnected) return;
      try {
        await Promise.all([...images, ...Object.values(opponentImages)].map(image => image.decode()));
        if (!overlay.isConnected) return;
        for (let lane = 0; lane < 4; lane++) tintedImages[lane] = makeTintedSprite(images[lane], COLORS[lane]);
        resizeStage();
        activeNotes.clear();
        nextNoteIndex = 0;
        notes.forEach(note => { note.hit = false; note.missed = false; });

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const [instRes, voicesRes] = await Promise.all([          fetch(new URL('FnF/Inst.ogg', document.baseURI)),          fetch(new URL('FnF/Voices.ogg', document.baseURI))        ]);
        const [instData, voicesData] = await Promise.all([          instRes.arrayBuffer(),          voicesRes.arrayBuffer()        ]);

        [instBuffer, voicesBuffer] = await Promise.all([          audioCtx.decodeAudioData(instData),          audioCtx.decodeAudioData(voicesData)        ]);

        if (!overlay.isConnected) return;

        instSource = audioCtx.createBufferSource();
        instSource.buffer = instBuffer;
        instSource.connect(audioCtx.destination);

        voicesSource = audioCtx.createBufferSource();
        voicesSource.buffer = voicesBuffer;
        voicesSource.connect(audioCtx.destination);

        container.classList.add('fnfChatActive');
        app?.classList.add('fnfGamePlaying');
        chatRows.forEach(row => {
          row.classList.add('fnfChatLeaving', row.classList.contains('user') ? 'fnfLeaveRight' : 'fnfLeaveLeft');
          row.addEventListener('animationend', () => { row.hidden = true; }, { once: true });
        });
        await new Promise(resolve => setTimeout(resolve, 460));
        if (!overlay.isConnected) return;

        // Start the visual intro only after every sprite and both audio tracks are ready.
        overlay.classList.add('fnfGameReady');
        opponent.src = opponentImages.idle.src;
        opponent.classList.add('fnfOpponentEntering');
        await animateArrowEntry();
        if (!overlay.isConnected) return;

        const startTime = audioCtx.currentTime + 0.15;
        songStartAudioTime = startTime;

        instSource.start(startTime);
        voicesSource.start(startTime);

        active = true;
        window.addEventListener('keydown', onKeyDown);
        lastBeat = -1;
        opponentNoteIndex = 0;
        raf = requestAnimationFrame(tick);
      } catch (err) {
        console.error(err);
        dispose();
      }
    }

    fetch(new URL('FnF/chart.json', document.baseURI), { cache: 'force-cache' })
      .then(response => { if (!response.ok) throw new Error('Nie udało się wczytać chartu.'); return response.json(); })
      .then(data => {
        const song = data.song;
        if (!song || !Array.isArray(song.notes)) throw new Error('Chart nie zawiera nut.');
        const chartSpeed = Number(song.speed);
        if (Number.isFinite(chartSpeed) && chartSpeed > 0) {
          scrollSpeed = chartSpeed * 0.4;
        }
        const baseBpm = Number(song.bpm) || 110;
        let sectionBpm = baseBpm;
        let sectionTime = 0;
        let sectionBeat = 0;
        bpmTimeline = [{ time: 0, beat: 0, bpm: baseBpm }];
        for (const section of song.notes) {
          const nextBpm = Number(section.bpm);
          if (section.changeBPM && Number.isFinite(nextBpm) && nextBpm > 0 && nextBpm !== sectionBpm) {
            sectionBpm = nextBpm;
            bpmTimeline.push({ time: sectionTime, beat: sectionBeat, bpm: sectionBpm });
          }
          const sectionBeats = Number(section.sectionBeats) || 4;
          sectionTime += sectionBeats * 60000 / sectionBpm;
          sectionBeat += sectionBeats;
          for (const raw of section.sectionNotes || []) {
            const strumTime = Number(raw[0]);
            const noteData = Number(raw[1]);
            if (!Number.isFinite(strumTime) || !Number.isFinite(noteData)) continue;
            const isPlayer = noteData >= 4 ? !section.mustHitSection : !!section.mustHitSection;
            const note = { lane: ((noteData % 4) + 4) % 4, time: strumTime, sustain: Math.max(0, Number(raw[2]) || 0), hit: false, missed: false };
            if (isPlayer) {
              notes.push(note);
              totalNotes++;
            } else {
              opponentNotes.push(note);
            }
          }
        }
        notes.sort((a, b) => a.time - b.time);
        opponentNotes.sort((a, b) => a.time - b.time);
        if (!notes.length) throw new Error('W chartcie nie ma nut gracza.');

        resizeStage();
        resizeHandler = resizeStage;
        window.addEventListener('resize', resizeHandler, { passive: true });
        beginSong();
      })
      .catch(() => dispose());

    return { close: dispose };
  }

  window.MadraFnF = { matchesRequest, mount };
})();
