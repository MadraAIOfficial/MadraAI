(() => {
  const KEY_LANES = new Map([    ['ArrowLeft', 0], ['KeyA', 0], ['a', 0], ['A', 0],
    ['ArrowDown', 1], ['KeyS', 1], ['s', 1], ['S', 1],
    ['ArrowUp', 2], ['KeyW', 2], ['w', 2], ['W', 2],
    ['ArrowRight', 3], ['KeyD', 3], ['d', 3], ['D', 3]
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
  const fetchGameResource = (url, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
  };

  function matchesRequest(value) {
    const text = clean(value);
    const asksToPlay = /\b(?:zagrajmy|gramy|zagraj|zagrac|pogramy|pogram|zagramy|mozemy|chcesz|chce|play|playing|lets|start)\b/u.test(text);
    const namesFnf = /\b(?:fnf|fnfa|friday\s+night\s+funkin)\b/u.test(text);
    return asksToPlay && namesFnf;
  }
  const SIGN_SETTINGS_KEY = 'madraFnF22ExpurgationSignSettings';
  function readSignSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(SIGN_SETTINGS_KEY) || 'null');
      if (!value || !Number.isFinite(value.widthRatio) || !Number.isFinite(value.rightXRatio) || !Number.isFinite(value.leftXRatio)) return null;
      const widthRatio = Math.max(.25, Math.min(.8, value.widthRatio));
      const oldCoordinateScale = value.coordinateMode === 'screen-edge' ? 1 : 1 - widthRatio;
      return {
        widthRatio,
        rightXRatio: Math.max(-widthRatio / 2, Math.min(1 - widthRatio / 2, value.rightXRatio * oldCoordinateScale)),
        leftXRatio: Math.max(-widthRatio / 2, Math.min(1 - widthRatio / 2, value.leftXRatio * oldCoordinateScale)),
        coordinateMode: 'screen-edge'
      };
    } catch { return null; }
  }

  const SONGS = {
    madness: { title: 'Madness', folder: 'madness', audioFile: 'Voices.mp3', voiceFiles: [] },
    expurgation: { title: 'Expurgation', folder: 'expurgation', voiceFiles: ['Voices.ogg'], speedMultiplier: 1.3 },
    dorito: { title: 'Dorito', folder: 'dorito', voiceFiles: ['Voices.ogg'] },
    shucksV1: { title: 'Shucks V1', folder: 'shucks-v1', voiceFiles: ['Voices-Player.ogg', 'Voices-Opponent.ogg'] },
    unloaded: { title: 'Unloaded', folder: 'unloaded', voiceFiles: ['Voices.ogg'] }
  };

  function showSongPicker(container, bubble = null) {
    if (!bubble) {
      const result = window.add?.('Wybierz piosenkę:', 'bot');
      bubble = result?.bubble || result?.content?.querySelector?.('.bubble');
    }
    if (!bubble) return;
    bubble.textContent = 'Wybierz piosenkę:';
    const choices = document.createElement('div');
    choices.className = 'fnfSongChoices';
    for (const [id, song] of Object.entries(SONGS)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fnfSongChoice';
      button.textContent = `${song.title} (…:…)`;
      const audioFiles = song.audioFile ? [song.audioFile] : ['Inst.ogg', ...song.voiceFiles];
      let remaining = audioFiles.length;
      let duration = 0;
      const setDuration = () => {
        if (--remaining) return;
        const seconds = Math.floor(duration);
        button.textContent = `${song.title} (${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')})`;
      };
      for (const file of audioFiles) {
        const audio = new Audio();
        audio.preload = 'metadata';
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          if (Number.isFinite(audio.duration)) duration = Math.max(duration, audio.duration);
          audio.removeAttribute('src');
          audio.load();
          setDuration();
        };
        audio.addEventListener('loadedmetadata', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });
        audio.src = new URL(`FnF22/songs/${song.folder}/${file}`, document.baseURI).href;
      }
      button.addEventListener('click', () => {
        choices.querySelectorAll('button').forEach(item => { item.disabled = true; });
        bubble.closest('.message')?.remove();
        mount(container, id);
      }, { once: true });
      choices.append(button);
    }
    bubble.append(choices);
  }

  function mount(container, songId = 'madness') {
    const selectedSong = SONGS[songId] || SONGS.madness;
    const overlay = document.createElement('section');
    overlay.className = 'fnfGameInline';
    overlay.innerHTML = '<div class="fnfPanel"><div class="fnfStage" aria-label="Strzałki gry rytmicznej"><div class="fnfTimer" role="timer">0:00/0:00</div><canvas class="fnfCanvas" aria-hidden="true"></canvas><img class="fnfOpponent" alt="" draggable="false"></div></div></div>';
    const chatRows = [...container.querySelectorAll('.message')];
    const app = container.closest('.app');
    let interactionLocked = false;
    const blockLockedPointer = event => {
      if (!interactionLocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const blockLockedKeyboard = event => {
      if (!interactionLocked) return;
      const isLaneKey = KEY_LANES.has(event.code) || KEY_LANES.has(event.key);
      if (active && (event.key === 'Escape' || isLaneKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const blockLockedSubmit = event => {
      if (!interactionLocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    function setInteractionLock(locked) {
      if (interactionLocked === locked) return;
      interactionLocked = locked;
      document.body.classList.toggle('fnfGameInteractionLocked', locked);
      if (locked) {
        document.addEventListener('pointerdown', blockLockedPointer, true);
        document.addEventListener('click', blockLockedPointer, true);
        document.addEventListener('keydown', blockLockedKeyboard, true);
        document.addEventListener('submit', blockLockedSubmit, true);
      } else {
        document.removeEventListener('pointerdown', blockLockedPointer, true);
        document.removeEventListener('click', blockLockedPointer, true);
        document.removeEventListener('keydown', blockLockedKeyboard, true);
        document.removeEventListener('submit', blockLockedSubmit, true);
      }
    }
    container.append(overlay);

    const stage = overlay.querySelector('.fnfStage');
    const canvas = overlay.querySelector('.fnfCanvas');
    const vinciFlyby = selectedSong.folder === 'unloaded' ? document.createElement('img') : null;
    let vinciFlybyTriggered = false;
    if (vinciFlyby) {
      vinciFlyby.className = 'fnfVinciFlyby';
      vinciFlyby.src = new URL('FnF22/vinci.png', document.baseURI).href;
      vinciFlyby.alt = '';
      vinciFlyby.draggable = false;
      stage.insertBefore(vinciFlyby, canvas);
    }
    const timer = overlay.querySelector('.fnfTimer');
    const hasSignMechanic = selectedSong.folder === 'expurgation';
    const expurgationSignBaseSize = 1300;
    const expurgationSignRightInset = 48;
    const signPoleStart = 172 / 1280;
    const signPoleCenterY = 96 / 194;
    const expurgationSignSettings = hasSignMechanic ? readSignSettings() : null;
    const expurgationSignImage = hasSignMechanic ? new Image() : null;
    if (expurgationSignImage) expurgationSignImage.src = new URL('FnF22/expurgationsign.png', document.baseURI).href;
    const opponent = overlay.querySelector('.fnfOpponent');
    const hasExpurgationOpponent = hasSignMechanic;
    if (hasExpurgationOpponent) opponent.classList.add('fnfOpponentExpurgation');
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    
    const notes = [];
    const opponentNotes = [];
    const activeNotes = new Set();
    const activeSigns = new Set();
    function expurgationSignWidth() {
      if (expurgationSignSettings) return Math.max(1, Math.min(stageWidth - 8, stageWidth * expurgationSignSettings.widthRatio));
      const firstArrowEdge = laneX(0) - arrowSize / 2;
      const widthNeededToCoverLanes = (stageWidth - expurgationSignRightInset - firstArrowEdge) / (1 - signPoleStart);
      const availableWidth = Math.max(1, stageWidth - expurgationSignRightInset);
      return Math.min(availableWidth, Math.max(expurgationSignBaseSize, widthNeededToCoverLanes));
    }
    function placeExpurgationSign(sign) {
      const width = expurgationSignWidth();
      const height = width * 194 / 1280;
      const yRatio = Number(sign.dataset.expurgationYRatio);
      const availableY = Math.max(0, stageHeight - height);
      const top = Number.isFinite(yRatio)
        ? Math.max(0, Math.min(availableY, availableY * yRatio))
        : Math.max(0, Math.min(availableY, receptorY - height * signPoleCenterY));
      sign.style.width = width + 'px';
      sign.style.height = height + 'px';
      const selectedRatio = Number(sign.dataset.expurgationXRatio);
      const leftNudge = Math.min(14, Math.max(8, stageWidth * .01));
      const left = Number.isFinite(selectedRatio)
        ? selectedRatio * stageWidth - leftNudge
        : Math.max(0, stageWidth - width - expurgationSignRightInset) - leftNudge;
      sign.style.left = left + 'px';
      sign.style.top = top + 'px';
    }
    const pressedUntil = [0, 0, 0, 0];
    const images = DIRECTIONS.map(direction => {
      const image = new Image();
      image.src = new URL(`FnF22/arrow-${direction}.png`, document.baseURI).href;
      return image;
    });
    const tintedImages = [];
    const hazardImages = [];
    const opponentFileNames = {
      idle: hasExpurgationOpponent ? 'EXPidle1.svg' : 'idle.svg',
      down: hasExpurgationOpponent ? 'EXPdown.svg' : 'down.svg',
      left: hasExpurgationOpponent ? 'EXPleft.svg' : 'left.svg',
      right: hasExpurgationOpponent ? 'EXPright.svg' : 'right.svg',
      up: hasExpurgationOpponent ? 'EXPup.svg' : 'up.svg'
    };
    const opponentImages = Object.fromEntries(Object.entries(opponentFileNames).map(([name, file]) => {
      const image = new Image();
      image.src = new URL(`FnF22/${file}`, document.baseURI).href;
      return [name, image];
    }));
    const unloadedEyesImage = selectedSong.folder === 'unloaded' ? new Image() : null;
    if (unloadedEyesImage) unloadedEyesImage.src = new URL('FnF22/oczy.svg', document.baseURI).href;
    const opponentIdleFrames = hasExpurgationOpponent
      ? [1, 2, 3, 4].map(frame => {
          const image = new Image();
          image.src = new URL(`FnF22/EXPidle${frame}.svg`, document.baseURI).href;
          return image;
        })
      : [opponentImages.idle];

    let audioCtx = null;
    let audioResumeAttempt = Promise.resolve(false);
    try {
      const AudioContextType = window.AudioContext || window.webkitAudioContext;
      if (AudioContextType) {
        audioCtx = new AudioContextType();
        audioResumeAttempt = audioCtx.resume().then(() => true, error => {
          console.warn('[Orzech 2.2][FNF] audio context did not resume on song selection', error);
          return false;
        });
      }
    } catch (error) {
      console.warn('[Orzech 2.2][FNF] audio context could not be created', error);
    }
    let instBuffer = null;
    let voiceBuffers = [];
    let instSource = null;
    let voiceSources = [];
    let songStartAudioTime = 0;

    let raf = 0;
    let entryRaf = 0;
    let entryStart = 0;
    let nextNoteIndex = 0;
    let nextSignSpawnAt = 0;
    let pleadInterval = 0;
    let resizeHandler = null;
    let active = false;
    let ended = false;
    let disposed = false;
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
    let opponentSingAnimation = null;
    let opponentIdleFrame = 0;
    let opponentIdleFrameAt = 0;

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

    function makeHazardSprite(image) {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const border = Math.max(4, Math.round(Math.min(width, height) * .075));
      const sprite = document.createElement('canvas');
      sprite.width = width + border * 2;
      sprite.height = height + border * 2;
      const spriteContext = sprite.getContext('2d');
      spriteContext.drawImage(image, 0, 0, sprite.width, sprite.height);
      spriteContext.globalCompositeOperation = 'source-in';
      spriteContext.fillStyle = '#ffe600';
      spriteContext.fillRect(0, 0, sprite.width, sprite.height);
      const fill = document.createElement('canvas');
      fill.width = width;
      fill.height = height;
      const fillContext = fill.getContext('2d');
      fillContext.drawImage(image, 0, 0);
      fillContext.globalCompositeOperation = 'source-in';
      const gradient = fillContext.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#111000');
      gradient.addColorStop(.42, '#8f7600');
      gradient.addColorStop(1, '#fff200');
      fillContext.fillStyle = gradient;
      fillContext.fillRect(0, 0, width, height);
      spriteContext.globalCompositeOperation = 'source-over';
      spriteContext.drawImage(fill, border, border);
      return sprite;
    }

    function formatClock(milliseconds) {
      const seconds = Math.max(0, Math.floor(milliseconds / 1000));
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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

    function showExpurgationSign(lane = 0) {
      if (!hasSignMechanic || !overlay.isConnected || activeSigns.size >= 3) return;
      const sign = document.createElement('img');
      sign.className = `fnfExpurgationSign fnfExpurgationSignActive ${Math.random() < .48 ? 'fnfSignOrbit' : 'fnfSignStill'}`;
      sign.src = expurgationSignImage.src;
      sign.alt = '';
      sign.draggable = false;
      if (expurgationSignSettings) {
        const minRatio = Math.min(expurgationSignSettings.leftXRatio, expurgationSignSettings.rightXRatio);
        const maxRatio = Math.max(expurgationSignSettings.leftXRatio, expurgationSignSettings.rightXRatio);
        sign.dataset.expurgationXRatio = String(minRatio + Math.random() * (maxRatio - minRatio));
      }
      sign.dataset.expurgationYRatio = String(Math.random());
      const lifetime = 2000 + Math.random() * 2000;
      placeExpurgationSign(sign);
      sign.style.animationDuration = `${lifetime}ms`;
      activeSigns.add(sign);
      stage.append(sign);
      sign.addEventListener('animationend', () => { activeSigns.delete(sign); sign.remove(); }, { once: true });
    }

    function showPleadFlash() {
      if (!hasSignMechanic || !overlay.isConnected) return;
      const flash = document.createElement('div');
      flash.className = 'fnfPleadFlash';
      flash.textContent = 'PLEAD';
      flash.style.left = `${10 + Math.random() * 80}%`;
      flash.style.top = `${8 + Math.random() * 78}%`;
      stage.append(flash);
      flash.addEventListener('animationend', () => flash.remove(), { once: true });
    }

    function flashHazardHit() {
      const flash = document.createElement('div');
      flash.className = 'fnfHazardHitFlash';
      document.body.append(flash);
      flash.addEventListener('animationend', () => flash.remove(), { once: true });
    }

    function schedulePleadFlash() {
      if (!active || !hasSignMechanic || !overlay.isConnected) return;
      showPleadFlash();
      pleadInterval = window.setTimeout(schedulePleadFlash, 1000 + Math.random() * 1000);
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

    function drawArrow(image, x, y, size, alpha = 1, tint = null, bright = false, rotation = 0) {
      if (!image) return;
      const isCanvas = image instanceof HTMLCanvasElement;
      if (isCanvas ? !image.width || !image.height : !image.complete || !image.naturalWidth) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const half = size / 2;
      if (bright) ctx.filter = 'brightness(1.4)';
      ctx.translate(x, y);
      if (rotation) ctx.rotate(rotation);
      ctx.drawImage(image, -half, -half, size, size);
      if (tint) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = tint;
        ctx.fillRect(-half, -half, size, size);
      }
      ctx.restore();
    }

    function drawHazardGlitches(x, y, size, now, lane) {
      const colors = ['#fff000', '#ff3154', '#fa31ff', '#4efbff'];
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.max(18, Math.round(size * .43))}px system-ui, sans-serif`;
      for (let index = 0; index < 7; index++) {
        const phase = now * .035 + index * 2.41 + lane * 1.7;
        const radius = size * (.42 + (index % 3) * .16);
        const gx = x + Math.cos(phase) * radius + Math.sin(phase * 2.7) * 5;
        const gy = y + Math.sin(phase * 1.13) * radius * .65 + Math.cos(phase * 3.1) * 4;
        const color = colors[(index + Math.floor(now / 85)) % colors.length];
        ctx.save();
        ctx.globalAlpha = .72 + ((index % 2) * .2);
        ctx.translate(gx, gy);
        ctx.rotate(Math.sin(phase * 1.4) * .23);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#240009';
        ctx.fillStyle = color;
        ctx.strokeText('!', 0, 0);
        ctx.fillText('!', Math.sin(phase * 4) * 3, Math.cos(phase * 3) * 2);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawFrame(songTime) {
      ctx.clearRect(0, 0, stageWidth, stageHeight);
      const now = performance.now();
      for (let lane = 0; lane < 4; lane++) {
        drawArrow(images[lane], laneX(lane), receptorY, arrowSize, .76, null, pressedUntil[lane] > now);
      }
      // Player notes render last so they stay in front of the stationary receptors.
      for (const note of activeNotes) {
        const y = receptorY + (note.time - songTime) * scrollSpeed;
        const x = laneX(note.lane);
        if (note.hazard) {
          ctx.save();
          ctx.shadowColor = '#fff000';
          ctx.shadowBlur = 31;
          drawArrow(hazardImages[note.lane], x, y, Math.max(1, arrowSize - 8));
          ctx.restore();
          drawHazardGlitches(x, y, arrowSize - 8, now, note.lane);
        } else {
          drawArrow(tintedImages[note.lane], x, y, Math.max(1, arrowSize - 8));
        }
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
      if (unloadedEyesImage && songTime >= 43000 && songTime < 67000) {
        if (opponent.dataset.pose !== 'eyes') {
          opponent.dataset.pose = 'eyes';
          opponentSingAnimation?.cancel();
          opponent.src = unloadedEyesImage.src;
        }
        return;
      }
      if (opponent.dataset.pose === 'eyes') {
        opponent.dataset.pose = 'idle';
        opponentIdleFrame = 0;
        opponentIdleFrameAt = performance.now() + 50;
        opponent.src = opponentIdleFrames[0].src;
      }
      while (opponentNoteIndex < opponentNotes.length && opponentNotes[opponentNoteIndex].time <= songTime + 25) {
        const note = opponentNotes[opponentNoteIndex++];
        if (note.time >= songTime - 140) {
          opponentPose = DIRECTIONS[note.lane];
          opponentPoseUntil = performance.now() + 190;
          opponentSingAnimation?.cancel();
          opponentSingAnimation = opponent.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.08,.9)', offset: .35 }, { transform: 'scale(.98,1.04)', offset: .7 }, { transform: 'scale(1,1)' }], { duration: 180, easing: 'ease-out' });
        }
      }
      const nextPose = performance.now() < opponentPoseUntil ? opponentPose : 'idle';
      if (nextPose !== opponent.dataset.pose) {
        opponent.dataset.pose = nextPose;
        if (nextPose === 'idle' && hasExpurgationOpponent) {
          opponentIdleFrame = 0;
          opponentIdleFrameAt = performance.now() + 50;
          opponent.src = opponentIdleFrames[opponentIdleFrame].src;
        } else {
          opponent.src = opponentImages[nextPose].src;
        }
      } else if (nextPose === 'idle' && hasExpurgationOpponent && performance.now() >= opponentIdleFrameAt) {
        opponentIdleFrame = (opponentIdleFrame + 1) % opponentIdleFrames.length;
        opponent.src = opponentIdleFrames[opponentIdleFrame].src;
        opponentIdleFrameAt = performance.now() + 50;
      }
    }

    function showJudgement(name) {
      const oldClones = stage.querySelectorAll('.fnfRatingClone');
      if (oldClones.length >= 4) oldClones[0].remove();
      const clone = document.createElement('img');
      clone.className = 'fnfRatingClone';
      clone.src = new URL(`FnF22/${name}.png`, document.baseURI).href;
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
      for (const source of voiceSources) {
        try { source.stop(); } catch (e) {}
        source.disconnect();
      }
      voiceSources = [];
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
    }
    function dispose() {
      active = false;
      disposed = true;
      setInteractionLock(false);

      chatRows.forEach(row => { row.hidden = false; });
      cancelAnimationFrame(raf);
      cancelAnimationFrame(entryRaf);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      clearTimeout(pleadInterval);
      stopAudio();
      document.removeEventListener('keydown', onKeyDown, true);
      app?.classList.remove('fnfGamePlaying', 'fnfGameReturning');
      container.classList.remove('fnfChatActive');
      container.querySelectorAll('.fnfChatLeaving,.fnfChatReturning').forEach(row => {
        row.hidden = false;
        row.classList.remove('fnfChatLeaving', 'fnfLeaveRight', 'fnfLeaveLeft', 'fnfChatReturning', 'fnfReturnRight', 'fnfReturnLeft');
      });
      overlay.remove();
    }

    function reportStartupFailure(error) {
      console.error('[Orzech 2.2][FNF] startup failed', error);
      dispose();
      if (typeof window.add === 'function') {
        const detail = error?.message ? ` Szczegóły: ${error.message}` : '';
        window.add(`Nie udało się uruchomić piosenki „${selectedSong.title}”.${detail}`, 'bot');
      }
    }

    function showResult(resultMessage = '') {
      const accuracy = totalNotes ? (accuracyPoints / totalNotes * 100).toFixed(2) : '0.00';
      const text = resultMessage || `Piosenka dobiegła końca! Wynik: ${score} punktów, pudła: ${misses}, celność: ${accuracy}%.`;
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

    function finish(resultMessage = '') {
      if (ended) return;
      ended = true;
      active = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      stopAudio();
      clearTimeout(pleadInterval);
      overlay.classList.add('fnfGameEnding');
      setTimeout(() => {
        if (disposed) return;
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
          if (disposed) return;
          app?.classList.remove('fnfGameReturning');
          container.classList.remove('fnfChatActive');
          chatRows.forEach(row => row.classList.remove('fnfChatReturning', 'fnfReturnRight', 'fnfReturnLeft'));
          setInteractionLock(false);
          showResult(resultMessage);
        }, 480);
      }, 700);
    }

    function tick() {
      if (!active) return;
      const songTime = (audioCtx.currentTime - songStartAudioTime) * 1000;
      const audioDuration = Math.max(instBuffer?.duration || 0, ...voiceBuffers.map(buffer => buffer.duration || 0)) * 1000;
      timer.textContent = formatClock(songTime) + '/' + formatClock(audioDuration);
      if (vinciFlyby && !vinciFlybyTriggered && songTime >= 81000) {
        vinciFlybyTriggered = true;
        vinciFlyby.classList.add('fnfVinciFlybyActive');
      }
      if (hasSignMechanic && songTime >= nextSignSpawnAt) {
        showExpurgationSign(Math.floor(Math.random() * 4));
        nextSignSpawnAt = songTime + 950 + Math.random() * 1250;
      }
      updateOpponent(songTime);

      const beat = beatAt(songTime);
      if (beat !== lastBeat) {
        lastBeat = beat;
        pulseCamera(beat % 4 === 0 ? 1.04 : 1.022, beat % 4 === 0 ? 210 : 150);
        if (beat % 2 === 0 && opponent.dataset.pose === 'idle') {
          opponentSingAnimation?.cancel();
          opponentSingAnimation = opponent.animate([
            { transform: 'scale(1,1)' },
            { transform: 'scale(1.07,.92)', offset: .38 },
            { transform: 'scale(.98,1.03)', offset: .72 },
            { transform: 'scale(1,1)' }
          ], { duration: 180, easing: 'ease-out' });
        }
      }

      const spawnLimit = songTime + (stageHeight + arrowSize / 2 - receptorY) / scrollSpeed;
      while (nextNoteIndex < notes.length && notes[nextNoteIndex].time <= spawnLimit) {
        activeNotes.add(notes[nextNoteIndex++]);
      }

      for (const note of activeNotes) {
        if (note.time - songTime < -hitWindow) {
          activeNotes.delete(note);
          note.missed = true;
          if (note.hazard) continue;
          misses++;
          combo = 0;
          showJudgement('shit');
        }
      }

      drawFrame(songTime);

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
      const lane = KEY_LANES.get(event.code) ?? KEY_LANES.get(event.key);
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
      if (chosen.hazard) { misses++; combo = 0; flashHazardHit(); return; }
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
        await Promise.all([...images, ...Object.values(opponentImages), ...opponentIdleFrames, ...(unloadedEyesImage ? [unloadedEyesImage] : []), ...(hasSignMechanic ? [expurgationSignImage] : [])].map(image => image.decode()));
        if (!overlay.isConnected) return;
        for (let lane = 0; lane < 4; lane++) {
          tintedImages[lane] = makeTintedSprite(images[lane], COLORS[lane]);
          hazardImages[lane] = makeHazardSprite(images[lane]);
        }
        resizeStage();
        activeNotes.clear();
        nextNoteIndex = 0;
        nextSignSpawnAt = 0;
        notes.forEach(note => { note.hit = false; note.missed = false; });

        if (!audioCtx) throw new Error('Ta przeglądarka nie udostępnia Web Audio API.');
        const audioReady = await Promise.race([
          audioResumeAttempt,
          new Promise(resolve => setTimeout(() => resolve(false), 5000))
        ]);
        if (!audioReady || audioCtx.state !== 'running') throw new Error('Przeglądarka zablokowała dźwięk. Wybierz piosenkę ponownie i zezwól na odtwarzanie audio.');

        const audioFiles = selectedSong.audioFile
          ? [selectedSong.audioFile]
          : ['Inst.ogg', ...selectedSong.voiceFiles];
        const audioResponses = await Promise.all(audioFiles.map(file =>
          fetchGameResource(new URL(`FnF22/songs/${selectedSong.folder}/${file}`, document.baseURI))
        ));
        if (audioResponses.some(response => !response.ok)) throw new Error('Nie udało się wczytać audio piosenki.');
        const audioData = await Promise.all(audioResponses.map(response => response.arrayBuffer()));
        const decodedAudio = await Promise.all(audioData.map(data => audioCtx.decodeAudioData(data)));
        instBuffer = decodedAudio[0];
        voiceBuffers = selectedSong.audioFile ? [] : decodedAudio.slice(1);

        if (!overlay.isConnected) return;

        instSource = audioCtx.createBufferSource();
        instSource.buffer = instBuffer;
        instSource.connect(audioCtx.destination);

        voiceSources = voiceBuffers.map(buffer => {
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          return source;
        });

        container.classList.add('fnfChatActive');
        app?.classList.add('fnfGamePlaying');
        setInteractionLock(true);
        chatRows.forEach(row => {
          row.classList.add('fnfChatLeaving', row.classList.contains('user') ? 'fnfLeaveRight' : 'fnfLeaveLeft');
          row.addEventListener('animationend', () => { row.hidden = true; }, { once: true });
        });
        await new Promise(resolve => setTimeout(resolve, 460));
        if (disposed || !overlay.isConnected) return;

        // Start the visual intro only after every sprite and both audio tracks are ready.
        overlay.classList.add('fnfGameReady');
        opponent.src = opponentImages.idle.src;
        opponent.classList.add('fnfOpponentEntering');
        await animateArrowEntry();
        if (!overlay.isConnected) return;

        const startTime = audioCtx.currentTime + 0.15;
        songStartAudioTime = startTime;

        instSource.start(startTime);
        voiceSources.forEach(source => source.start(startTime));

        active = true;
        document.addEventListener('keydown', onKeyDown, true);
        if (hasSignMechanic) {
          nextSignSpawnAt = 1100 + Math.random() * 1200;
          schedulePleadFlash();
        }
        lastBeat = -1;
        opponentNoteIndex = 0;
        raf = requestAnimationFrame(tick);
      } catch (err) {
        reportStartupFailure(err);
      }
    }

    fetchGameResource(new URL(`FnF22/songs/${selectedSong.folder}/chart.json`, document.baseURI), { cache: 'force-cache' })
      .then(response => { if (!response.ok) throw new Error('Nie udało się wczytać chartu.'); return response.json(); })
      .then(data => {
        const song = data.song;
        if (!song || !Array.isArray(song.notes)) throw new Error('Chart nie zawiera nut.');
        const chartSpeed = Number(song.speed);
        if (Number.isFinite(chartSpeed) && chartSpeed > 0) {
          scrollSpeed = chartSpeed * 0.4 * (selectedSong.speedMultiplier || 1.12);
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
          const sectionBeats = Number(section.sectionBeats) || (Number(section.lengthInSteps) / 4) || 4;
          sectionTime += sectionBeats * 60000 / sectionBpm;
          sectionBeat += sectionBeats;
          for (const raw of section.sectionNotes || []) {
            const strumTime = Number(raw[0]);
            const noteData = Number(raw[1]);
            if (!Number.isFinite(strumTime) || !Number.isFinite(noteData)) continue;
            if (hasSignMechanic && noteData >= 12 && noteData <= 15) {
              continue;
            }
            const isHazard = hasSignMechanic && noteData >= 8 && noteData <= 11;
            const isPlayer = isHazard || (noteData >= 4 ? !section.mustHitSection : !!section.mustHitSection);
            const note = { lane: ((noteData % 4) + 4) % 4, time: strumTime, sustain: Math.max(0, Number(raw[2]) || 0), hazard: isHazard, hit: false, missed: false };
            if (isPlayer) {
              notes.push(note);
              if (!isHazard) totalNotes++;
            } else {
              opponentNotes.push(note);
            }
          }
        }
        notes.sort((a, b) => a.time - b.time);
        opponentNotes.sort((a, b) => a.time - b.time);
        if (!notes.length) throw new Error('W chartcie nie ma nut gracza.');

        resizeStage();
        resizeHandler = () => {
          resizeStage();
          activeSigns.forEach(placeExpurgationSign);
        };
        window.addEventListener('resize', resizeHandler, { passive: true });
        beginSong();
      })
      .catch(error => reportStartupFailure(error));

    return { close: dispose };
  }

  window.MadraFnF22 = { matchesRequest, mount, showSongPicker };
})();
