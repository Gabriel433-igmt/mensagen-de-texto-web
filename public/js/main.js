import * as THREE from 'three';

// ============================================================================
//  FUGA 3D - cliente
// ============================================================================
const socket = io();

const state = {
  id: null,
  config: null,
  characters: {},
  powerLabels: {},
  myCharacter: 'classico',
  chosenPower: 'invisible',
  money: 100,
  phase: 'LOBBY',
  isAssassin: false,
  alive: false,
  activePower: 'none',
  powerUses: 0,
  invisibleUntil: 0,
};

const $ = (id) => document.getElementById(id);
const screens = {
  login: $('screen-login'), lobby: $('screen-lobby'), draw: $('screen-draw'),
  vote: $('screen-vote'), result: $('screen-result'),
};
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('show'));
  if (screens[name]) screens[name].classList.add('show');
  $('game-hud').classList.toggle('hidden', name !== 'game');
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 't'; t.textContent = msg;
  $('toasts').appendChild(t); setTimeout(() => t.remove(), 4500);
}

// ----------------------------------------------------------------------------
//  Three.js — cena
// ----------------------------------------------------------------------------
let renderer, scene, camera;
const meshes = new Map(); // id -> {group, body, label}
let groundReady = false;

function initThree() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  $('game-root').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c18);
  scene.fog = new THREE.Fog(0x0a0c18, 40, 95);

  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 300);
  camera.position.set(0, 12, 16);

  const hemi = new THREE.HemisphereLight(0x8899ff, 0x111122, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(20, 40, 12); dir.castShadow = true;
  dir.shadow.camera.left = -60; dir.shadow.camera.right = 60;
  dir.shadow.camera.top = 60; dir.shadow.camera.bottom = -60;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);

  buildArena();
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  animate();
}

const OBSTACLES = []; // {x,z,r} para colisao no cliente
function buildArena() {
  const half = state.config ? state.config.ARENA_HALF : 38;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(half * 2, half * 2),
    new THREE.MeshStandardMaterial({ color: 0x1a1f3a, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  // grade
  const grid = new THREE.GridHelper(half * 2, half, 0x33407a, 0x222a55);
  grid.position.y = 0.02; scene.add(grid);

  // paredes
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a3366, roughness: 0.8 });
  const mkWall = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  };
  mkWall(half * 2, 4, 1, 0, 2, -half);
  mkWall(half * 2, 4, 1, 0, 2, half);
  mkWall(1, 4, half * 2, -half, 2, 0);
  mkWall(1, 4, half * 2, half, 2, 0);

  // obstaculos (pilares e caixas) — layout fixo
  const obMat = new THREE.MeshStandardMaterial({ color: 0x3a4480, roughness: 0.7 });
  const layout = [
    [-18, -10, 3], [16, -14, 3], [0, 0, 4], [-20, 14, 3], [22, 10, 3],
    [10, 18, 2.5], [-8, 20, 2.5], [26, -4, 2.5], [-26, 2, 2.5], [6, -22, 3],
  ];
  for (const [x, z, r] of layout) {
    const h = 3 + (r);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), obMat);
    m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    OBSTACLES.push({ x, z, r: r + 0.6 });
  }
  groundReady = true;
}

function makeLabel(text) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 30px Segoe UI'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000'; ctx.fillText(text, 129, 33);
  ctx.fillStyle = '#fff'; ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(cv);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  spr.scale.set(4, 1, 1); spr.position.y = 3.4;
  return spr;
}

function makePlayerMesh(p) {
  const group = new THREE.Group();
  const color = p.isAssassin ? 0xff3344 : new THREE.Color(p.color || '#4aa3ff').getHex();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.6, 1.2, 6, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: 0x000000 })
  );
  body.position.y = 1.4; body.castShadow = true; group.add(body);
  // "nariz" para mostrar direcao
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff }));
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.5, 0.7); group.add(nose);
  const label = makeLabel(p.name + (p.isAssassin ? ' 🔪' : ''));
  group.add(label);
  scene.add(group);
  return { group, body, label };
}

// ----------------------------------------------------------------------------
//  Entrada / movimento local
// ----------------------------------------------------------------------------
const keys = {};
const me = { x: 0, z: 0, rot: 0, frozen: false };
let pointerLocked = false;

window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

function setupInput() {
  document.addEventListener('click', () => {
    if (state.phase === 'FUGA' && !pointerLocked) renderer.domElement.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === renderer.domElement;
  });
  document.addEventListener('mousemove', e => {
    if (pointerLocked && state.phase === 'FUGA') me.rot -= e.movementX * 0.0025;
  });
  document.addEventListener('mousedown', e => {
    if (state.phase !== 'FUGA' || !pointerLocked) return;
    if (state.isAssassin) socket.emit('attack');
    else usePower('use');
  });
  window.addEventListener('keydown', e => {
    if (state.phase !== 'FUGA') return;
    if (e.code === 'Space') { e.preventDefault(); state.isAssassin ? socket.emit('attack') : usePower('use'); }
    if (e.code === 'KeyQ' && state.activePower === 'mark') usePower('mark');
  });
}

function usePower(action) {
  if (state.activePower === 'mark') socket.emit('power', { action });
  else socket.emit('power', { action: 'use' });
}

function collide(nx, nz) {
  const half = (state.config?.ARENA_HALF || 38) - 0.8;
  nx = Math.max(-half, Math.min(half, nx));
  nz = Math.max(-half, Math.min(half, nz));
  for (const o of OBSTACLES) {
    const dx = nx - o.x, dz = nz - o.z;
    const d = Math.hypot(dx, dz);
    if (d < o.r) { const k = o.r / (d || 0.01); nx = o.x + dx * k; nz = o.z + dz * k; }
  }
  return [nx, nz];
}

let lastSend = 0;
function updateLocal(dt) {
  if (state.phase !== 'FUGA' || !state.alive) return;
  const speedBase = state.isAssassin ? 9.5 : (state.activePower === 'lua' ? 11 : 8.5);
  const speed = me.frozen ? 0 : speedBase;
  let fx = 0, fz = 0;
  if (keys['KeyW'] || keys['ArrowUp']) fz -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) fz += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) fx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) fx += 1;
  if (fx || fz) {
    const len = Math.hypot(fx, fz); fx /= len; fz /= len;
    const sin = Math.sin(me.rot), cos = Math.cos(me.rot);
    const wx = fx * cos - fz * sin;
    const wz = fx * sin + fz * cos;
    let nx = me.x + wx * speed * dt;
    let nz = me.z + wz * speed * dt;
    [nx, nz] = collide(nx, nz);
    me.x = nx; me.z = nz;
  }
  const now = performance.now();
  if (now - lastSend > 55) {
    lastSend = now;
    socket.emit('move', { x: me.x, z: me.z, rot: me.rot });
  }
}

// ----------------------------------------------------------------------------
//  Loop de render
// ----------------------------------------------------------------------------
let prevT = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, (now - prevT) / 1000); prevT = now;

  updateLocal(dt);

  // camera 3a pessoa atras do "me"
  if (state.phase === 'FUGA') {
    const camDist = 9, camH = 6;
    const cx = me.x + Math.sin(me.rot) * camDist;
    const cz = me.z + Math.cos(me.rot) * camDist;
    camera.position.lerp(new THREE.Vector3(cx, camH, cz), 0.18);
    camera.lookAt(me.x - Math.sin(me.rot) * 4, 1.6, me.z - Math.cos(me.rot) * 4);
  }
  if (renderer) renderer.render(scene, camera);
}

// ----------------------------------------------------------------------------
//  Render dos jogadores a partir do snapshot do servidor
// ----------------------------------------------------------------------------
function applySnapshot(snap) {
  const seen = new Set();
  for (const p of snap.players) {
    seen.add(p.id);
    let m = meshes.get(p.id);
    if (!m) { m = makePlayerMesh(p); meshes.set(p.id, m); }

    if (p.id === state.id) {
      // posicao local manda; mas sincroniza congelado e invisivel
      me.frozen = p.frozen;
      state.invisibleUntil = p.invisible ? Date.now() + 100 : 0;
      m.group.position.set(me.x, 0, me.z);
      m.group.rotation.y = me.rot;
      m.group.visible = !p.invisible || true; // sempre vejo a mim mesmo
      m.body.material.opacity = p.invisible ? 0.35 : 1;
      m.body.material.transparent = p.invisible;
    } else {
      m.group.position.lerp(new THREE.Vector3(p.x, 0, p.z), 0.35);
      m.group.rotation.y = p.rot;
      // invisivel: oculto para os outros (a menos que eu seja... ninguem ve)
      m.group.visible = !p.invisible;
    }
    // marcado (alvo) brilha
    m.body.material.emissive.setHex(p.marked ? 0xff8800 : (p.frozen ? 0x3366ff : 0x000000));
    if (!p.alive) m.group.visible = false;
  }
  // remove quem saiu
  for (const [id, m] of meshes) {
    if (!seen.has(id)) { scene.remove(m.group); meshes.delete(id); }
  }
}

// ----------------------------------------------------------------------------
//  Lobby / loja
// ----------------------------------------------------------------------------
function renderShop() {
  const shop = $('shop'); shop.innerHTML = '';
  for (const [key, ch] of Object.entries(state.characters)) {
    const owned = state.myCharacter === key;
    const el = document.createElement('div');
    el.className = 'item' + (owned ? ' owned' : '');
    el.innerHTML = `<div class="nm">${ch.name}</div>
      <div class="pw">${state.powerLabels[ch.power] || ''}</div>
      <div class="pr">${ch.price === 0 ? 'Grátis' : 'R$' + ch.price}${owned ? ' ✓' : ''}</div>`;
    el.onclick = () => {
      const chosen = key === 'powerbest' ? $('chosen-power').value : undefined;
      socket.emit('buy', { character: key, chosenPower: chosen });
    };
    shop.appendChild(el);
  }
  $('choose-power').classList.toggle('hidden', state.myCharacter !== 'powerbest');
}

function renderLobby(data) {
  const list = $('players-list'); list.innerHTML = '';
  data.players.forEach(p => {
    const el = document.createElement('div');
    el.className = 'p' + (p.ready ? ' ready' : '');
    el.textContent = `${p.name}${p.ready ? ' ✅' : ''}`;
    list.appendChild(el);
  });
  const readyN = data.players.filter(p => p.ready).length;
  $('ready-info').textContent = `${readyN}/${state.config.MIN_PLAYERS} prontos (mín. ${state.config.MIN_PLAYERS})`;
}

// ----------------------------------------------------------------------------
//  Desenho
// ----------------------------------------------------------------------------
let drawing = false, dctx;
function setupDraw() {
  const cv = $('draw-canvas'); dctx = cv.getContext('2d');
  dctx.fillStyle = '#fff'; dctx.fillRect(0, 0, cv.width, cv.height);
  dctx.lineCap = 'round'; dctx.lineWidth = 4; dctx.strokeStyle = '#111';
  const pos = e => {
    const r = cv.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return [(t.clientX - r.left) * cv.width / r.width, (t.clientY - r.top) * cv.height / r.height];
  };
  const start = e => { drawing = true; const [x, y] = pos(e); dctx.beginPath(); dctx.moveTo(x, y); e.preventDefault(); };
  const move = e => { if (!drawing) return; const [x, y] = pos(e); dctx.lineTo(x, y); dctx.stroke(); e.preventDefault(); };
  const end = () => { drawing = false; };
  cv.addEventListener('mousedown', start); cv.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  cv.addEventListener('touchstart', start); cv.addEventListener('touchmove', move);
  window.addEventListener('touchend', end);
  $('btn-clear').onclick = () => { dctx.fillStyle = '#fff'; dctx.fillRect(0, 0, cv.width, cv.height); };
  $('btn-send-draw').onclick = () => {
    socket.emit('drawing', { dataURL: cv.toDataURL('image/png') });
    toast('Desenho enviado!');
  };
}

// ----------------------------------------------------------------------------
//  Votacao
// ----------------------------------------------------------------------------
function renderVote(list) {
  const grid = $('vote-grid'); grid.innerHTML = '';
  let selected = null;
  list.forEach(d => {
    const el = document.createElement('div'); el.className = 'vc';
    el.innerHTML = d.dataURL
      ? `<img src="${d.dataURL}" alt=""><div class="nm">${d.name}</div>`
      : `<div class="empty">sem desenho</div><div class="nm">${d.name}</div>`;
    el.onclick = () => {
      grid.querySelectorAll('.vc').forEach(c => c.classList.remove('sel'));
      el.classList.add('sel'); selected = d.id;
      socket.emit('vote', { targetId: d.id });
    };
    grid.appendChild(el);
  });
}

// ----------------------------------------------------------------------------
//  HUD do jogo
// ----------------------------------------------------------------------------
function updateGameHud() {
  $('role-banner').textContent = state.isAssassin ? '🔪 VOCÊ É O ASSASSINO — pegue todos!' : '🏃 SOBREVIVENTE — fuja!';
  $('role-banner').style.color = state.isAssassin ? '#ff5a5a' : '#4affa3';
  let txt;
  if (state.isAssassin) txt = 'CLIQUE / ESPAÇO = atacar · WASD = mover · mouse = olhar';
  else {
    const pl = state.powerLabels[state.activePower] || 'Sem poder';
    const usePart = state.activePower === 'mark'
      ? `Q = marcar · ESPAÇO = voltar (${state.powerUses})`
      : `ESPAÇO = usar poder (${state.powerUses})`;
    txt = `${pl} | ${usePart}`;
  }
  $('power-bar').textContent = txt;
}

// ----------------------------------------------------------------------------
//  Eventos de socket
// ----------------------------------------------------------------------------
socket.on('hello', (d) => {
  state.id = d.id; state.config = d.config;
  state.characters = d.characters; state.powerLabels = d.powerLabels;
});

socket.on('wallet', ({ money }) => { state.money = money; $('money').textContent = money; });

socket.on('lobby', (d) => { if (state.config) renderLobby(d); });

socket.on('bought', ({ character, chosenPower }) => {
  state.myCharacter = character; if (chosenPower) state.chosenPower = chosenPower;
  renderShop(); toast('Comprado: ' + (state.characters[character]?.name || character));
});

socket.on('phase', ({ phase, endsAt }) => {
  state.phase = phase;
  $('hud-phase').textContent = phaseLabel(phase);
  phaseTimerEnds = endsAt || 0;
  if (phase === 'LOBBY') { showScreen('lobby'); renderShop(); }
  else if (phase === 'DESENHO') showScreen('draw');
  else if (phase === 'VOTACAO') { showScreen('vote'); socket.emit('getDrawings'); }
  else if (phase === 'FUGA') { showScreen('game'); enterGame(); }
  else if (phase === 'RESULTADO') showScreen('result');
});

socket.on('matchStart', ({ assassinId }) => {
  state.isAssassin = (assassinId === state.id);
  state.alive = true;
});

socket.on('drawings', (list) => renderVote(list));

socket.on('snapshot', (snap) => {
  if (state.phase !== 'FUGA') return;
  const meSnap = snap.players.find(p => p.id === state.id);
  if (meSnap) {
    state.alive = meSnap.alive;
    me.frozen = meSnap.frozen;
  }
  applySnapshot(snap);
});

socket.on('teleport', ({ x, z, uses }) => { me.x = x; me.z = z; state.powerUses = uses; updateGameHud(); });
socket.on('powerInfo', ({ msg, uses }) => { if (uses != null) state.powerUses = uses; updateGameHud(); toast(msg); });
socket.on('miss', () => toast('Errou o ataque!'));
socket.on('died', () => { state.alive = false; toast('💀 Você foi pego!'); });

socket.on('kill', ({ killer, victim }) => {
  const k = document.createElement('div'); k.className = 'k';
  k.textContent = `🔪 ${killer} pegou ${victim}`;
  $('kill-feed').prepend(k); setTimeout(() => k.remove(), 6000);
});

socket.on('matchEnd', ({ winnerSide, reason, summary }) => {
  $('result-title').textContent = winnerSide === 'assassinos' ? '🔪 Assassino venceu!' : '🏃 Sobreviventes venceram!';
  const box = $('result-summary'); box.innerHTML = `<p class="sub">${reason}</p>`;
  summary.sort((a, b) => b.money - a.money).forEach(s => {
    const line = document.createElement('div'); line.className = 'line';
    line.innerHTML = `<span>${s.isAssassin ? '🔪 ' : ''}${s.name}${s.alive ? '' : ' 💀'}</span>
      <span><span class="g">+R$${s.gained}</span> → R$${s.money}</span>`;
    box.appendChild(line);
  });
});

socket.on('sys', (msg) => toast(msg));
socket.on('chat', ({ name, text }) => toast(`${name}: ${text}`));

// ----------------------------------------------------------------------------
//  Helpers de fase / entrada no jogo
// ----------------------------------------------------------------------------
let phaseTimerEnds = 0;
function phaseLabel(p) {
  return ({ LOBBY: 'LOBBY', DESENHO: 'DESENHO', VOTACAO: 'VOTAÇÃO', FUGA: 'FUGA', RESULTADO: 'RESULTADO' })[p] || p;
}
setInterval(() => {
  if (!phaseTimerEnds) { $('hud-timer').textContent = ''; return; }
  const s = Math.max(0, Math.ceil((phaseTimerEnds - Date.now()) / 1000));
  $('hud-timer').textContent = s + 's';
}, 250);

function enterGame() {
  // posiciona o "me" no spawn que o servidor mandou via snapshot (chega logo)
  me.x = 0; me.z = 0; me.rot = 0;
  // pega meu poder atual da loja
  const ch = state.characters[state.myCharacter] || {};
  state.activePower = ch.power === 'choose' ? state.chosenPower : (ch.power || 'none');
  state.powerUses = ch.uses || 0;
  updateGameHud();
  toast('Clique na tela para travar o mouse e jogar.');
}

// ----------------------------------------------------------------------------
//  Boot
// ----------------------------------------------------------------------------
$('btn-enter').onclick = () => {
  const name = $('name-input').value.trim() || 'Jogador';
  socket.emit('join', { name });
  showScreen('lobby');
};
$('btn-ready').onclick = () => {
  const willReady = !$('btn-ready').classList.contains('on');
  $('btn-ready').classList.toggle('on', willReady);
  $('btn-ready').textContent = willReady ? 'Aguardando... ⏳' : 'Ficar pronto ✅';
  socket.emit('ready', { ready: willReady });
};

window.addEventListener('load', () => {
  initThree();
  setupInput();
  setupDraw();
  showScreen('login');
});
