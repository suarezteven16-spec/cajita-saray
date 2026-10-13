/* ============================================================
   La cajita de las sorpresas de Saray
   Lógica del juego · 100% offline (sin librerías externas)
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- utilidades ---------------- */
  var $ = function (s) { return document.querySelector(s); };
  var rand = function (a, b) { return Math.random() * (b - a) + a; };
  var randInt = function (a, b) { return Math.floor(rand(a, b + 1)); };
  var pick = function (arr) { return arr[randInt(0, arr.length - 1)]; };
  var shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* ---------------- estado ---------------- */
  var TOTAL_LEVELS = 4;
  var state = { level: 1, points: 0, badges: [] };
  var levelCleanup = null;

  function clearLevel() {
    if (typeof levelCleanup === 'function') {
      try { levelCleanup(); } catch (e) { /* ignorar */ }
    }
    levelCleanup = null;
  }

  /* ---------------- elementos ---------------- */
  var elHud = $('#hud');
  var elHudLevel = $('#hud-level');
  var elHudPoints = $('#hud-points');
  var elHudBadges = $('#hud-badges');
  var elLevelTitle = $('#level-title');
  var elLevelDesc = $('#level-desc');
  var elProgressBar = $('#progress-bar');
  var elChallenge = $('#challenge');
  var elBadges = $('#badges');
  var elToast = $('#toast');
  var elConfetti = $('#confetti');
  var elMusicBtn = $('#music-btn');
  var elMusicIcon = $('#music-icon');
  var screens = { start: $('#screen-start'), game: $('#screen-game'), final: $('#screen-final') };

  /* ---------------- pantallas ---------------- */
  function showScreen(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.remove('active'); });
    screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- aviso flotante ---------------- */
  var toastTimer = null;
  function toast(msg, ms) {
    elToast.textContent = msg;
    elToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.classList.remove('show'); }, ms || 2800);
  }

  /* ---------------- confeti ---------------- */
  var CONFETTI = ['⭐', '💛', '🌸', '🌻', '💖', '✨', '🎉', '🎊', '🌼'];
  function confetti(count) {
    count = count || 40;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.className = 'confetti-piece';
      p.textContent = pick(CONFETTI);
      p.style.left = rand(0, 100) + '%';
      p.style.fontSize = rand(1, 2.2) + 'rem';
      p.style.animationDuration = rand(2.2, 4.6) + 's';
      p.style.animationDelay = rand(0, 0.9) + 's';
      elConfetti.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 6500); })(p);
    }
  }

  /* ---------------- HUD / puntos ---------------- */
  function addPoints(n) { state.points += n; elHudPoints.textContent = state.points; }
  function updateHud() {
    elHudLevel.textContent = state.level;
    elHudPoints.textContent = state.points;
    elHudBadges.textContent = state.badges.length;
  }
  function setProgress(frac) {
    elProgressBar.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
  }
  function renderBadges() {
    elBadges.innerHTML = '';
    state.badges.forEach(function (b) {
      var span = document.createElement('span');
      span.className = 'badge';
      span.textContent = b.emoji + ' ' + b.label;
      elBadges.appendChild(span);
    });
  }
  function addBadge(emoji, label) {
    state.badges.push({ emoji: emoji, label: label });
    renderBadges();
    updateHud();
  }

  /* ---------------- datos ---------------- */
  var GIFT_MESSAGES = [
    { emoji: '🐣', name: 'Pollito valiente',
      text: '🐣 Un pollito valiente te dice: "¡Saray, hoy es un día precioso y tú lo haces aún más bonito!"' },
    { emoji: '🍬', name: 'Chuches infinitas',
      text: '🍬 Chuches infinitas, porque alguien tan dulce como tú nunca se queda sin premio.' },
    { emoji: '🐈', name: 'Mini gatito',
      text: '🐈 Un mini gatito ronronea solo de pensar en lo genial que eres, Saray.' },
    { emoji: '🌻', name: 'Girasol gigante',
      text: '🌻 Un girasol gigante que gira para mirarte: siempre encuentra el lado soleado, igual que tú.' },
    { emoji: '🎈', name: 'Globo mágico',
      text: '🎈 Un globo mágico para que vueles alto, cumplas tus sueños y sonrías sin parar.' },
    { emoji: '🦄', name: 'Unicornio juguetón',
      text: '🦄 Un unicornio juguetón que te hace cosquillas: "¡Saray, eres única y especial!"' },
    { emoji: '🍀', name: 'Trébol de la suerte',
      text: '🍀 Un trébol de cuatro hojas para que la suerte te acompañe en cada aventura, Saray.' },
    { emoji: '🌈', name: 'Arcoíris con tu nombre',
      text: '🌈 Un arcoíris pintado solo para ti: cada color te recuerda lo increíble que eres.' },
    { emoji: '⭐', name: 'Estrella de los deseos',
      text: '⭐ Una estrella para pedir un deseo... pero shhh, ¡guárdalo bajito que seguro se cumple!' },
    { emoji: '🧸', name: 'Peluche abrazador',
      text: '🧸 Un peluche blandito con abrazo incluido, para los días en que te apetezca uno extra.' },
    { emoji: '🎵', name: 'Canción secreta',
      text: '🎵 Una canción secreta que suena cuando eres feliz... contigo suena todo el rato, Saray.' },
    { emoji: '🌟', name: 'Nube de deseos',
      text: '🌟 Una nube de deseos brillantes: "Saray, mereces todas las cosas bonitas del mundo."' }
  ];

  var RIDDLES = [
    { q: 'Tiene hojas pero no es un árbol, y tiene lomo pero no es un caballo. ¿Qué es?',
      answer: 'Un libro', options: ['Un libro', 'Una silla', 'Un paraguas', 'Una cebolla'] },
    { q: 'Te acompaña todo el día y está contigo siempre, pero no puedes tocarla ni abrazarla. ¿Qué es?',
      answer: 'Tu sombra', options: ['Tu sombra', 'Tu almohada', 'Tu abrigo', 'El viento'] },
    { q: 'Soy amarillo como el sol y giro mi cara para mirar a mi amiga la abeja. ¿Qué soy?',
      answer: 'El girasol', options: ['El girasol', 'El plátano', 'La luna', 'Un limón'] },
    { q: 'Cuanto más le quitas, más grande se hace. ¿Qué es?',
      answer: 'Un agujero', options: ['Un agujero', 'Una pelota', 'Un globo', 'Una caja'] },
    { q: 'Tengo dientes pero no como, y dejo tu pelo siempre genial. ¿Qué soy?',
      answer: 'El peine', options: ['El peine', 'El cocodrilo', 'El tenedor', 'Un reloj'] }
  ];

  var CORRECT_MSG = [
    '¡Correcto! Tu cerebro brilla más que el sol 🌞',
    '¡Bien! Eres más lista que un zorro con gafas 🦊',
    '¡Exacto! Acertar te queda genial 😎',
    '¡Genial! Premio: un aplauso gigante 👏👏',
    '¡Sí! Le diste al clavo, y al clavo le pareció bien 😆',
    '¡Qué crack! Te has ganado una sonrisa extra 😁'
  ];

  var SCENE_ICONS = ['🌿', '🌸', '🌷', '🍄', '🪨', '🌳', '🧺', '🌼', '🪴', '🌵'];
  var SCENE_RESULTS = ['🌸', '🍄', '🐞', '🐌', '🍃', '🌼', '🔘', '🐛', '🌻', '✨'];
  var DECOY_MSG = [
    'Mmm... aquí solo hay una flor muy presumida 🌸',
    '¡Nada de nada! Pero mira, una mariquita 🐞',
    'Aquí vive un caracol que va con mucha calma 🐌',
    'Solo piedrecitas... ¡y un botón perdido! 🔘',
    'Una seta que canta ópera 🍄🎶',
    'Un gusano leyendo un libro tranquilamente 🐛📖',
    '¡Ups! Un saltamontes saltarín se escapó 🦗',
    'Aquí solo hay hierba muy fresquita 🌿'
  ];

  /* ============================================================
     NIVELES
     ============================================================ */

  function startLevel(n) {
    clearLevel();
    state.level = n;
    updateHud();
    setProgress(0);
    elChallenge.innerHTML = '';
    if (n === 1) levelGifts();
    else if (n === 2) levelRiddles();
    else if (n === 3) levelKitten();
    else if (n === 4) levelStars();
    else showFinal();
  }

  function completeLevel(emoji, label) {
    addBadge(emoji, label);
    setProgress(1);
    confetti(46);
    toast('¡Nivel superado! 🎉 ¡Vas genial!');
    state.level += 1;
    updateHud();
    var next = state.level;
    if (next > TOTAL_LEVELS) {
      setTimeout(showFinal, 1700);
    } else {
      setTimeout(function () { startLevel(next); }, 1700);
    }
  }

  /* --- Nivel 1: cajitas de regalo --- */
  function levelGifts() {
    elLevelTitle.textContent = 'Nivel 1 · La cajita de las sorpresas';
    elLevelDesc.textContent = 'Pulsa cada cajita para descubrir qué esconde. ¡Todas guardan un regalito!';
    var msgs = shuffle(GIFT_MESSAGES).slice(0, 6);
    var grid = document.createElement('div');
    grid.className = 'gift-grid';
    var opened = 0;
    msgs.forEach(function (m) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gift-box';
      btn.textContent = '🎁';
      btn.setAttribute('aria-label', 'Abrir cajita de regalo');
      btn.addEventListener('click', function () {
        if (btn.classList.contains('opened')) return;
        btn.classList.add('opened');
        btn.textContent = m.emoji;
        addPoints(5);
        opened++;
        setProgress(opened / msgs.length);
        toast(m.text);
        if (opened === msgs.length) completeLevel('🎁', 'Abrecajitas');
      });
      grid.appendChild(btn);
    });
    elChallenge.appendChild(grid);
  }

  /* --- Nivel 2: acertijos --- */
  function levelRiddles() {
    elLevelTitle.textContent = 'Nivel 2 · Acertijos con chispa';
    elLevelDesc.textContent = 'Lee con calma y elige la respuesta correcta. ¡Cada acierto suma puntos!';
    var list = shuffle(RIDDLES).slice(0, 4);
    var i = 0;
    var wrap = document.createElement('div');
    wrap.className = 'riddle';
    elChallenge.appendChild(wrap);

    function renderRiddle() {
      var r = list[i];
      wrap.innerHTML = '';
      var q = document.createElement('p');
      q.className = 'riddle-q';
      q.textContent = r.q;
      wrap.appendChild(q);

      var answers = document.createElement('div');
      answers.className = 'answers';
      wrap.appendChild(answers);

      shuffle(r.options).forEach(function (opt) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'answer-btn';
        b.textContent = opt;
        b.addEventListener('click', function () {
          if (answers.dataset.done) return;
          if (opt === r.answer) {
            answers.dataset.done = '1';
            b.classList.add('correct');
            addPoints(15);
            toast(pick(CORRECT_MSG));
            i++;
            setProgress(i / list.length);
            if (i >= list.length) completeLevel('🧠', 'Genio de acertijos');
            else setTimeout(renderRiddle, 1200);
          } else {
            b.classList.add('wrong');
            b.disabled = true;
            toast('¡Casi! Ese no es... inténtalo otra vez, tú puedes 😄');
          }
        });
        answers.appendChild(b);
      });
    }
    renderRiddle();
  }

  /* --- Nivel 3: encuentra al gatito --- */
  function levelKitten() {
    elLevelTitle.textContent = 'Nivel 3 · ¿Dónde se escondió el gatito? 🐱';
    elLevelDesc.textContent =
      'Hay un gatito escondido entre las plantas y las flores. ¡Pulsa en distintos sitios para encontrarlo!';
    var field = document.createElement('div');
    field.className = 'search-field';
    elChallenge.appendChild(field);

    var spots = 9;
    var kittenIndex = randInt(0, spots - 1);
    var boxes = [];
    for (var k = 0; k < spots; k++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-item';
      btn.textContent = pick(SCENE_ICONS);
      btn.style.left = randInt(12, 88) + '%';
      btn.style.top = randInt(18, 82) + '%';
      btn.setAttribute('aria-label', 'Buscar aquí');
      (function (index, node) {
        node.addEventListener('click', function () {
          if (node.dataset.done) return;
          node.dataset.done = '1';
          if (index === kittenIndex) {
            node.textContent = '🐱';
            node.classList.add('found');
            addPoints(25);
            confetti(50);
            toast('¡MIAU! 🐱 ¡Encontraste al gatito! Se escondía requetebién.');
            setProgress(1);
            completeLevel('🐱', 'Cazagatitos');
          } else {
            node.classList.add('miss');
            node.textContent = pick(SCENE_RESULTS);
            toast(pick(DECOY_MSG));
          }
        });
      })(k, btn);
      field.appendChild(btn);
      boxes.push(btn);
    }
  }

  /* --- Nivel 4: atrapa las estrellas (en movimiento) --- */
  function levelStars() {
    elLevelTitle.textContent = 'Nivel 4 · Atrapa las estrellas ⭐';
    elLevelDesc.textContent =
      '¡La estrella no para de moverse! Púlsala 10 veces para atraparla. Es rápida, ¡tú más!';
    var field = document.createElement('div');
    field.className = 'search-field';
    elChallenge.appendChild(field);

    var star = document.createElement('button');
    star.type = 'button';
    star.className = 'search-item star-mover';
    star.textContent = '⭐';
    star.setAttribute('aria-label', 'Atrapar la estrella');
    star.style.animation = 'none';
    field.appendChild(star);

    var goal = 10;
    var caught = 0;
    var timerId = null;
    var W = 0, H = 0, half = 40, vx = 0, vy = 0, x = 0, y = 0;
    var last = 0;

    function measure() {
      W = field.clientWidth;
      H = field.clientHeight;
      half = Math.max(30, star.offsetWidth / 2);
    }

    function place(xx, yy) {
      x = xx; y = yy;
      star.style.left = x + 'px';
      star.style.top = y + 'px';
    }

    function reset() {
      measure();
      var speed = 150;
      var ang = rand(0, Math.PI * 2);
      vx = Math.cos(ang) * speed;
      vy = Math.sin(ang) * speed;
      place(rand(half, Math.max(half, W - half)), rand(half, Math.max(half, H - half)));
    }

    function tick() {
      var now = Date.now();
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      var maxX = Math.max(half, W - half);
      var maxY = Math.max(half, H - half);
      x += vx * dt;
      y += vy * dt;
      if (x < half) { x = half; vx = Math.abs(vx); }
      else if (x > maxX) { x = maxX; vx = -Math.abs(vx); }
      if (y < half) { y = half; vy = Math.abs(vy); }
      else if (y > maxY) { y = maxY; vy = -Math.abs(vy); }
      star.style.left = x + 'px';
      star.style.top = y + 'px';
    }

    function startMover() {
      reset();
      last = 0;
      if (timerId) clearInterval(timerId);
      timerId = setInterval(tick, 16);
    }

    function onResize() { measure(); }

    levelCleanup = function stopStar() {
      if (timerId) { clearInterval(timerId); timerId = null; }
      window.removeEventListener('resize', onResize);
    };

    window.addEventListener('resize', onResize);
    startMover();

    star.addEventListener('click', function () {
      caught++;
      addPoints(4);
      setProgress(caught / goal);
      if (caught >= goal) {
        toast('¡Estrella número 10! ✨ ¡Atrapadas todas!');
        levelCleanup();
        completeLevel('⭐', 'Atrapaestrellas');
        return;
      }
      toast('¡Atrapada! ⭐ ' + caught + ' / ' + goal);
      var speed = Math.min(360, 150 + caught * 22);
      var ang = rand(0, Math.PI * 2);
      vx = Math.cos(ang) * speed;
      vy = Math.sin(ang) * speed;
    });
  }

  /* ============================================================
     PANTALLA FINAL
     ============================================================ */
  function showFinal() {
    clearLevel();
    $('#final-points').textContent = state.points;
    $('#final-badges').textContent = state.badges.length;
    elHud.classList.add('hidden');
    showScreen('final');
    confetti(90);
    toast('¡Felicidades, Saray! 🌻💛');
  }

  /* ============================================================
     MÚSICA DE FONDO (generada con Web Audio, sin archivos)
     ============================================================ */
  var Music = (function () {
    var ctx = null, master = null, timer = null, on = false, step = 0, nextTime = 0;
    var STEP = 0.34;
    var F = {
      A2: 110.00, F2: 87.31, G2: 98.00,
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25
    };
    var CHORDS = [
      ['C4', 'E4', 'G4'],
      ['A3', 'C4', 'E4'],
      ['F3', 'A3', 'C4'],
      ['G3', 'B3', 'D4']
    ];
    var BASS = ['C3', 'A2', 'F2', 'G2'];
    var MELODY = [
      'E4', 'G4', 'C5', 'G4', 'A4', 'G4', 'E4', null,
      'A4', 'C5', 'E5', 'C5', 'A4', 'G4', 'E4', null,
      'F4', 'A4', 'C5', 'A4', 'G4', 'F4', 'E4', null,
      'G4', 'B4', 'D5', 'G4', 'E4', 'D4', 'E4', null
    ];

    function init() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0001;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2800;
      filter.Q.value = 0.4;
      master.connect(filter);
      filter.connect(ctx.destination);
    }

    function tone(freq, at, dur, type, vol) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, at);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g);
      g.connect(master);
      o.start(at);
      o.stop(at + dur + 0.05);
    }

    function scheduler() {
      while (nextTime < ctx.currentTime + 0.5) {
        var beat = step % 32;
        var bar = Math.floor(beat / 8);
        if (beat % 8 === 0) {
          CHORDS[bar].forEach(function (n) { tone(F[n], nextTime, STEP * 7.2, 'sine', 0.045); });
          tone(F[BASS[bar]], nextTime, STEP * 7.2, 'triangle', 0.05);
        }
        var m = MELODY[beat];
        if (m) tone(F[m], nextTime, STEP * 1.7, 'triangle', 0.12);
        nextTime += STEP;
        step++;
      }
    }

    function start() {
      init();
      if (!ctx) return false;
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      if (timer) return on;
      on = true;
      step = 0;
      nextTime = ctx.currentTime + 0.1;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 1.2);
      timer = setInterval(scheduler, 100);
      return on;
    }

    function stop() {
      on = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      }
      return on;
    }

    return {
      setOn: function (v) { return v ? start() : stop(); },
      toggle: function () { return on ? stop() : start(); },
      isOn: function () { return on; },
      supported: function () { init(); return !!ctx; }
    };
  })();

  function reflectMusic(isOn) {
    elMusicBtn.classList.toggle('on', isOn);
    elMusicIcon.textContent = isOn ? '🔊' : '🔇';
    elMusicBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  }

  /* ============================================================
     DECORACIÓN DE FONDO
     ============================================================ */
  function buildDecor() {
    var layer = $('#floating-layer');
    var chars = ['💛', '💗', '⭐', '✨', '🌸', '🌻', '💖', '🌟'];
    for (var i = 0; i < 18; i++) {
      var s = document.createElement('span');
      s.className = 'floater';
      s.textContent = pick(chars);
      s.style.left = rand(2, 96) + '%';
      s.style.fontSize = rand(0.9, 2) + 'rem';
      s.style.animationDuration = rand(9, 18) + 's';
      s.style.animationDelay = rand(0, 14) + 's';
      layer.appendChild(s);
    }
    var flowers = $('#flowers-layer');
    for (var j = 0; j < 10; j++) {
      var f = document.createElement('span');
      f.className = 'flower';
      f.textContent = pick(['🌻', '🌼', '🌻']);
      f.style.left = rand(2, 94) + '%';
      f.style.top = rand(2, 94) + '%';
      f.style.animationDuration = rand(3, 6) + 's';
      f.style.animationDelay = rand(0, 3) + 's';
      flowers.appendChild(f);
    }
  }

  /* ============================================================
     ARRANQUE Y EVENTOS
     ============================================================ */
  function beginGame() {
    elHud.classList.remove('hidden');
    showScreen('game');
    reflectMusic(Music.setOn(true));
    startLevel(1);
  }

  function replayGame() {
    state.level = 1;
    state.points = 0;
    state.badges = [];
    renderBadges();
    updateHud();
    setProgress(0);
    elHud.classList.remove('hidden');
    showScreen('game');
    confetti(20);
    startLevel(1);
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildDecor();
    renderBadges();
    updateHud();
    setProgress(0);
    if (!Music.supported()) {
      elMusicBtn.style.display = 'none';
    }
  });

  $('#start-btn').addEventListener('click', beginGame);
  $('#replay-btn').addEventListener('click', replayGame);
  elMusicBtn.addEventListener('click', function () {
    reflectMusic(Music.toggle());
  });
})();
