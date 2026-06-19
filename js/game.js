/* ===========================================================================
 *  FUGA 3D — multiplayer P2P (WebRTC via PeerJS).  So baixar e abrir.
 *  Um jogador CRIA a sala (vira host/servidor) e passa o codigo.
 *  Os outros ENTRAM com o codigo.  O host roda o jogo e transmite o estado.
 *  Bots preenchem para dar no minimo 3 participantes.
 * ======================================================================== */
'use strict';

/* ---------- Configuracao / regras ---------------------------------------- */
const CFG = {
  ARENA_HALF: 40,
  HP_MAX: 100,
  PUNCH_DMG: 22,
  PUNCH_RANGE: 3.4,
  PUNCH_CD: 850,
  MEDKIT_HEAL: 40,
  MEDKIT_RESPAWN: 18000,
  SURV_SPEED: 8.5,
  ASSA_SPEED: 9.2,
  MATCH_MS: 150000,
  MAX_MONEY: 1000,
  START_MONEY: 100,
  MIN_PLAYERS: 3,
  SNAP_HZ: 15,
  IN_HZ: 20,
};

const SURV = {
  classico:  { name: 'Clássico',      price: 0,    power: 'none',     uses: 0, color: 0x4aa3ff, desc: 'Sem poder.' },
  lua:       { name: 'Lua',           price: 100,  power: 'lua',      uses: 0, color: 0xc9c9ff, desc: 'Corre rápido, mas congela 1s a cada 10s.' },
  artist:    { name: 'The Artist',    price: 250,  power: 'mark',     uses: 5, color: 0xffd24a, desc: 'Q marca um ponto, ESPAÇO volta (5x).' },
  bester:    { name: 'The Bester',    price: 450,  power: 'invisible',uses: 3, color: 0x9b7bff, desc: 'ESPAÇO: invisível 5s (3x).' },
  adm:       { name: 'The Adm',       price: 650,  power: 'stun',     uses: 3, color: 0x4affa3, desc: 'ESPAÇO: atordoa o assassino perto (3x).' },
  pro:       { name: 'The Pro',       price: 850,  power: 'control',  uses: 1, color: 0xff7b4a, desc: 'ESPAÇO: congela o assassino 10s (1x).' },
  powerbest: { name: 'The Power Best',price: 900,  power: 'choose',   uses: 3, color: 0xff4af0, desc: 'Escolhe um dos 3 poderes.' },
  hacker:    { name: 'The Hacker',    price: 1000, power: 'hacker',   uses: 1, color: 0x00ffcc, desc: 'Usa TODOS os poderes 1x e enxerga invisíveis.' },
};
const ASSA = {
  free:        { name: 'Assassino Free', special: 'none',     color: 0xff3344 },
  lucas:       { name: 'Lucas',          special: 'lifesteal',color: 0xff7733 },
  ilusionista: { name: 'Ilusionista',    special: 'clones',   color: 0xaa33ff },
  marcador:    { name: 'Marcador',       special: 'mark',     color: 0xff0066 },
};
const POWER_LABEL = {
  none: 'Sem poder', lua: 'Lua (veloz, congela)', mark: 'Teleporte (Q marca, ESPAÇO volta)',
  invisible: 'Invisível (ESPAÇO)', stun: 'Atordoar (ESPAÇO)', control: 'Congelar assassino (ESPAÇO)',
  choose: 'Power Best', hacker: 'Hacker (tudo 1x)',
};

/* ---------- Dinheiro (localStorage) -------------------------------------- */
function getMoney() {
  let m = parseInt(localStorage.getItem('fuga3d_money'), 10);
  if (isNaN(m)) m = CFG.START_MONEY;
  return Math.max(0, Math.min(CFG.MAX_MONEY, m));
}
function setMoney(v) {
  localStorage.setItem('fuga3d_money', String(Math.max(0, Math.min(CFG.MAX_MONEY, v))));
  const el = $('money'); if (el) el.textContent = getMoney();
}
function getOwned() { try { return JSON.parse(localStorage.getItem('fuga3d_owned')) || ['classico']; } catch { return ['classico']; } }
function setOwned(l) { localStorage.setItem('fuga3d_owned', JSON.stringify([...new Set(l)])); }

/* ---------- UI ----------------------------------------------------------- */
const $ = (id) => document.getElementById(id);
const screens = { login: $('screen-login'), menu: $('screen-menu'), lobby: $('screen-lobby'), result: $('screen-result') };
function showScreen(name) {
  Object.values(screens).forEach(s => s && s.classList.remove('show'));
  if (screens[name]) screens[name].classList.add('show');
  const playing = name === 'game';
  $('game-hud').classList.toggle('hidden', !playing);
  $('hud').classList.toggle('hidden', !playing);
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 't'; t.textContent = msg;
  $('toasts').appendChild(t); setTimeout(() => t.remove(), 4000);
}

/* ---------- Sessao ------------------------------------------------------- */
const sess = { name: 'Jogador', myChar: 'classico', chosenPower: 'invisible', botCount: 2 };

/* ===========================================================================
 *  REDE (PeerJS) — host autoritativo, estrela
 * ======================================================================== */
const NET = {
  peer: null, isHost: false, myId: null,
  conns: new Map(),   // host: peerId -> DataConnection ;  joiner: 'host' -> conn
  hostConn: null,
  started: false,
};

function newPeer() {
  // usa o broker publico gratuito do PeerJS para a sinalizacao
  const p = new Peer({ debug: 1 });
  return p;
}

function createRoom() {
  NET.isHost = true;
  NET.peer = newPeer();
  NET.peer.on('open', (id) => {
    NET.myId = id;
    $('room-code').textContent = id;
    $('room-code-wrap').classList.remove('hidden');
    hostRoster.set(id, { id, name: sess.name, char: sess.myChar, isBot: false, money: getMoney() });
    renderLobby();
  });
  NET.peer.on('connection', (conn) => setupHostConn(conn));
  NET.peer.on('error', (e) => toast('Erro de conexão: ' + (e.type || e.message)));
  $('host-controls').classList.remove('hidden');
  $('join-controls').classList.add('hidden');
  $('lobby-title').textContent = 'Sala (você é o host)';
  showScreen('lobby'); renderShop();
}

function setupHostConn(conn) {
  conn.on('open', () => {
    NET.conns.set(conn.peer, conn);
  });
  conn.on('data', (msg) => onHostData(conn, msg));
  conn.on('close', () => { NET.conns.delete(conn.peer); removeHostPlayer(conn.peer); });
  conn.on('error', () => { NET.conns.delete(conn.peer); removeHostPlayer(conn.peer); });
}

function joinRoom(code) {
  NET.isHost = false;
  NET.peer = newPeer();
  NET.peer.on('open', () => {
    NET.myId = NET.peer.id;
    const conn = NET.peer.connect(code, { reliable: true, serialization: 'json' });
    NET.hostConn = conn;
    conn.on('open', () => {
      conn.send({ t: 'hello', name: sess.name, char: sess.myChar, money: getMoney() });
      toast('Conectado! Aguardando o host iniciar...');
    });
    conn.on('data', (msg) => onJoinData(msg));
    conn.on('close', () => { toast('Conexão com o host encerrada.'); showScreen('menu'); });
    conn.on('error', () => toast('Erro ao conectar. Confira o código.'));
  });
  NET.peer.on('error', (e) => toast('Erro: ' + (e.type || e.message) + ' (código certo?)'));
  $('host-controls').classList.add('hidden');
  $('join-controls').classList.remove('hidden');
  $('room-code-wrap').classList.add('hidden');
  $('lobby-title').textContent = 'Sala';
  showScreen('lobby'); renderShop();
}

function hostBroadcast(msg) { for (const c of NET.conns.values()) { try { c.send(msg); } catch {} } }

/* ---------- Roster do lobby (host) --------------------------------------- */
const hostRoster = new Map(); // id -> {id,name,char,isBot,money}

function removeHostPlayer(id) {
  hostRoster.delete(id);
  if (match && !match.over) { const e = entities.find(x => x.id === id); if (e) { e.alive = false; if (e.vis) e.vis.group.visible = false; } }
  renderLobby(); syncRoster();
}
function syncRoster() {
  const players = [...hostRoster.values()].map(p => ({ id: p.id, name: p.name, char: p.char, isBot: p.isBot }));
  hostBroadcast({ t: 'roster', players, hostId: NET.myId, min: CFG.MIN_PLAYERS });
  renderLobby();
}

function onHostData(conn, msg) {
  const id = conn.peer;
  if (msg.t === 'hello') {
    hostRoster.set(id, { id, name: String(msg.name || 'Jogador').slice(0, 16), char: msg.char || 'classico', isBot: false, money: msg.money || 100 });
    syncRoster();
  } else if (msg.t === 'char') {
    const p = hostRoster.get(id); if (p) { p.char = msg.char; p.chosenPower = msg.chosenPower; renderLobby(); }
  } else if (msg.t === 'in') {
    const e = entities.find(x => x.id === id);
    if (e && e.alive) { e.input.fx = msg.fx; e.input.fz = msg.fz; e.rot = msg.rot; }
  } else if (msg.t === 'act') {
    const e = entities.find(x => x.id === id);
    if (e && e.alive && match && !match.over) { if (msg.a === 'primary') primaryFor(e); else secondaryFor(e); }
  }
}

/* ---------- Mensagens recebidas pelo joiner ------------------------------ */
let netRoster = [];
function onJoinData(msg) {
  if (msg.t === 'roster') {
    netRoster = msg.players; renderLobby();
  } else if (msg.t === 'start') {
    NET.started = true; enterGameClient(msg);
  } else if (msg.t === 'snap') {
    applySnapshot(msg);
  } else if (msg.t === 'ev') {
    handleEvent(msg);
  }
}

/* ===========================================================================
 *  THREE.JS — cena (igual para host e joiner)
 * ======================================================================== */
let renderer, scene, camera;
const OBSTACLES = [], BUSHES = [], MEDKITS = [];

function initThree() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  $('game-root').appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c18);
  scene.fog = new THREE.Fog(0x0a0c18, 45, 100);
  camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0x8899ff, 0x111122, 0.95));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(25, 45, 15); dir.castShadow = true;
  dir.shadow.camera.left = -70; dir.shadow.camera.right = 70; dir.shadow.camera.top = 70; dir.shadow.camera.bottom = -70;
  dir.shadow.mapSize.set(1024, 1024); scene.add(dir);
  buildArena();
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  requestAnimationFrame(loop);
}

function buildArena() {
  const half = CFG.ARENA_HALF;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), new THREE.MeshStandardMaterial({ color: 0x1a1f3a, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(half * 2, half, 0x33407a, 0x222a55); grid.position.y = 0.02; scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a3366, roughness: 0.8 });
  const wall = (w, h, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat); m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; scene.add(m); };
  wall(half * 2, 4, 1, 0, -half); wall(half * 2, 4, 1, 0, half); wall(1, 4, half * 2, -half, 0); wall(1, 4, half * 2, half, 0);

  const obMat = new THREE.MeshStandardMaterial({ color: 0x3a4480, roughness: 0.7 });
  const cols = [[-20,-12,3],[18,-16,3],[0,2,4],[-22,16,3],[24,10,3],[12,20,2.5],[-10,24,2.5],[28,-6,2.5],[-28,4,2.5],[8,-24,3],[-14,-26,2.5],[22,-26,2.5]];
  for (const [x, z, r] of cols) { const h = 4 + r; const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), obMat); m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; scene.add(m); OBSTACLES.push({ x, z, r: r + 0.6 }); }

  const bushMat = new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 1, transparent: true, opacity: 0.7 });
  for (const [x, z, r] of [[-30,-30,4],[30,30,4],[-32,28,3.5],[34,-20,3.5],[4,32,4],[-6,-34,3.5]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), bushMat); m.position.set(x, r * 0.7, z); m.scale.y = 0.7; scene.add(m); BUSHES.push({ x, z, r }); }

  for (const [x, z] of [[-15,5],[16,2],[0,-15],[-25,-20],[26,18],[10,28],[-30,12]]) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x224422 }));
    const cm = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.18), cm); const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.7), cm);
    c1.position.y = c2.position.y = 0.45; g.add(box, c1, c2); g.position.set(x, 0.5, z); scene.add(g);
    MEDKITS.push({ x, z, mesh: g, active: true, respawnAt: 0 });
  }
}

function makeLabel(text, color) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 30px Segoe UI'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(text, 128, 32);
  ctx.fillStyle = color || '#fff'; ctx.fillText(text, 128, 32);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
  spr.scale.set(4.2, 1.05, 1); spr.position.y = 3.6; return spr;
}
function makeBody(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 1.2, 6, 12), new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: 0x000000 }));
  body.position.y = 1.4; body.castShadow = true; group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.5, 0.7); group.add(nose);
  scene.add(group); return { group, body, nose };
}

/* ===========================================================================
 *  SIMULACAO (somente no HOST)
 * ======================================================================== */
let entities = [], match = null, meHost = null;
const BOT_NAMES = ['Léo', 'Bia', 'Caio', 'Duda', 'Rafa', 'Nina', 'Theo', 'Gabi'];

function spawnPos(i, n) { const a = (i / n) * Math.PI * 2; return { x: Math.cos(a) * 22, z: Math.sin(a) * 22 }; }

function createEntity(o) {
  const isA = o.role === 'assassin';
  const def = isA ? ASSA[o.char] : SURV[o.char];
  const vis = makeBody(def.color);
  vis.group.add(makeLabel(o.name + (isA ? ' 🔪' : ''), isA ? '#ff8888' : '#bfe'));
  return {
    id: o.id, name: o.name, role: o.role, char: o.char, def, isBot: !!o.isBot, isHost: !!o.isHost,
    alive: true, hp: isA ? 999 : CFG.HP_MAX, x: o.x, z: o.z, rot: 0, vis,
    input: { fx: 0, fz: 0 }, speedMul: 1, frozenUntil: 0, invisibleUntil: 0, lastPunch: 0, mark: null,
    powerUses: isA ? 0 : (def.uses || 0),
    activePower: isA ? 'none' : (def.power === 'choose' ? (o.chosenPower || 'invisible') : def.power),
    hackerUsed: { invisible: false, mark: false, stun: false },
    kills: 0, moneyEarned: 0, dmgLog: [], markedByAssassin: false, luaNext: 0,
  };
}

function hostStartMatch() {
  if (!NET.isHost) return;
  entities.forEach(e => scene.remove(e.vis.group)); entities = [];

  // participantes: humanos do roster + bots para chegar ao minimo
  const humans = [...hostRoster.values()];
  const needBots = Math.max(sess.botCount, CFG.MIN_PLAYERS - humans.length);
  const parts = humans.map(h => ({ id: h.id, name: h.name, char: h.char, chosenPower: h.chosenPower, isBot: false, isHost: h.id === NET.myId, money: h.money || 100 }));
  const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < needBots; i++) { const k = Object.keys(SURV); parts.push({ id: 'bot' + i, name: names[i % names.length] || ('Bot' + i), char: k[Math.floor(Math.random() * k.length)], isBot: true, money: 100 }); }

  // assassino sorteado com peso pelo dinheiro
  const weights = parts.map(p => 1 + (p.money || 100) / 100);
  const sum = weights.reduce((a, b) => a + b, 0); let r = Math.random() * sum, ai = 0;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { ai = i; break; } }
  const assassinChar = Object.keys(ASSA)[Math.floor(Math.random() * Object.keys(ASSA).length)];

  parts.forEach((p, i) => {
    const sp = spawnPos(i, parts.length);
    const isA = i === ai;
    const ent = createEntity({ id: p.id, name: p.name, isBot: p.isBot, isHost: p.isHost, role: isA ? 'assassin' : 'survivor', char: isA ? assassinChar : p.char, chosenPower: p.chosenPower, x: sp.x, z: sp.z });
    entities.push(ent);
    if (p.id === NET.myId) meHost = ent;
  });

  MEDKITS.forEach(k => { k.active = true; k.respawnAt = 0; k.mesh.visible = true; });
  match = { startedAt: performance.now(), endsAt: performance.now() + CFG.MATCH_MS, over: false, assassin: entities.find(e => e.role === 'assassin'), clones: [] };

  hostBroadcast({ t: 'start' });
  // host entra no jogo
  myEntityId = NET.myId;
  showScreen('game');
  updateRoleBannerFor(meHost);
  toast('Clique na tela para travar o mouse e jogar.');
}

/* ---------- visibilidade / esconderijo ----------------------------------- */
function isHidden(e) { for (const b of BUSHES) if (Math.hypot(e.x - b.x, e.z - b.z) < b.r) return true; return false; }
function canBeSeen(s, by) { const now = performance.now(); if (!s.alive || s.invisibleUntil > now) return false; if (isHidden(s)) return Math.hypot(s.x - by.x, s.z - by.z) < 6; return true; }

/* ---------- combate (host) ----------------------------------------------- */
function primaryFor(e) { if (e.role === 'assassin') assassinPunch(e); else useSurvivorPower(e); }
function secondaryFor(e) { if (e.role === 'assassin') assassinSpecial(e); else if (e.activePower === 'mark' || e.char === 'hacker') { e.mark = { x: e.x, z: e.z }; sayTo(e, 'Ponto marcado!'); } }

function sayTo(e, msg) {
  if (!e) return;
  if (e.isHost) toast(msg);
  else { const c = NET.conns.get(e.id); if (c) try { c.send({ t: 'ev', k: 'toast', msg }); } catch {} }
}

function assassinPunch(a) {
  const now = performance.now();
  if (now - a.lastPunch < CFG.PUNCH_CD || a.frozenUntil > now) return;
  a.lastPunch = now; flashPunch(a);
  let t = null, nd = Infinity;
  for (const e of entities) { if (e.role !== 'survivor' || !e.alive || e.invisibleUntil > now) continue; const d = Math.hypot(e.x - a.x, e.z - a.z); if (d < nd) { nd = d; t = e; } }
  if (!t || nd > CFG.PUNCH_RANGE) return;
  let instakill = false;
  if (a.def.special === 'mark' && t.markedByAssassin) {
    const recent = t.dmgLog.filter(d => d.t > now - 10000).reduce((s, d) => s + d.amount, 0);
    if (recent >= CFG.HP_MAX * 0.5) instakill = true;
  }
  if (instakill) t.hp = 0; else { t.hp -= CFG.PUNCH_DMG; t.dmgLog.push({ t: now, amount: CFG.PUNCH_DMG }); }
  if (a.def.special === 'lifesteal') { a.speedMul = Math.min(1.5, a.speedMul + 0.05); a.moneyEarned += 2; sayTo(a, '💰 +R$2 (Lucas)'); }
  spawnHitFx(t);
  if (t.hp <= 0) killSurvivor(a, t); else if (t.id) sayTo(t, '⚠️ Você levou um soco!');
}

function killSurvivor(assassin, victim) {
  victim.alive = false; victim.vis.group.visible = false; assassin.kills++; assassin.moneyEarned += 1;
  const text = `🔪 ${assassin.name} pegou ${victim.name}`;
  addKillFeed(text); hostBroadcast({ t: 'ev', k: 'kill', text });
  sayTo(victim, '💀 Você foi pego!');
  const left = entities.filter(e => e.role === 'survivor' && e.alive).length;
  if (left === 0) endMatch('assassino');
}

function flashPunch(a) { a.vis.nose.material.color.setHex(0xff0000); setTimeout(() => a.vis.nose.material.color.setHex(0xffffff), 120); }
function spawnHitFx(t) { t.vis.body.material.emissive.setHex(0xff0000); setTimeout(() => { if (t.alive) t.vis.body.material.emissive.setHex(t.markedByAssassin ? 0x552200 : 0x000000); }, 150); }

function assassinSpecial(a) {
  const now = performance.now();
  if (a.def.special === 'clones') {
    if (a._cloneCd && now < a._cloneCd) return sayTo(a, 'Clones recarregando...');
    a._cloneCd = now + 12000;
    for (let i = 0; i < 2; i++) { const ang = Math.random() * Math.PI * 2; match.clones.push({ x: a.x + Math.cos(ang) * 4, z: a.z + Math.sin(ang) * 4, rot: a.rot, life: now + 8000, vx: Math.cos(ang), vz: Math.sin(ang), color: a.def.color }); }
    sayTo(a, '👥 Clones criados!');
  } else if (a.def.special === 'mark') {
    let t = null, nd = Infinity; for (const e of entities) if (e.role === 'survivor' && e.alive) { const d = Math.hypot(e.x - a.x, e.z - a.z); if (d < nd) { nd = d; t = e; } }
    entities.forEach(e => e.markedByAssassin = false);
    if (t) { t.markedByAssassin = true; t.vis.body.material.emissive.setHex(0x552200); sayTo(a, '🎯 ' + t.name + ' marcado!'); }
  } else sayTo(a, 'Este assassino não tem poder de Q.');
}

/* ---------- poderes de sobrevivente (host) ------------------------------- */
function useSurvivorPower(p) {
  const now = performance.now(); const pw = p.activePower;
  if (p.char === 'hacker') return hackerPower(p);
  if (pw === 'mark') {
    if (!p.mark) return sayTo(p, 'Use Q para marcar um ponto.');
    if (p.powerUses <= 0) return sayTo(p, 'Sem teleportes.');
    p.powerUses--; p.x = p.mark.x; p.z = p.mark.z; sayTo(p, 'Teleporte! (' + p.powerUses + ')'); return;
  }
  if (p.powerUses <= 0 && pw !== 'lua' && pw !== 'none') return sayTo(p, 'Sem usos.');
  if (pw === 'invisible') { p.powerUses--; p.invisibleUntil = now + 5000; sayTo(p, 'Invisível 5s! (' + p.powerUses + ')'); }
  else if (pw === 'stun') doStun(p, 3000);
  else if (pw === 'control') doStun(p, 10000, true);
  else if (pw === 'lua') sayTo(p, 'Lua é passivo.');
  else sayTo(p, 'Sem poder ativo.');
}
function doStun(p, ms, isControl) {
  const a = match.assassin; if (!a || !a.alive) return;
  if (Math.hypot(a.x - p.x, a.z - p.z) > (isControl ? 999 : 9)) return sayTo(p, 'Chegue mais perto do assassino.');
  if (p.powerUses <= 0) return sayTo(p, 'Sem usos.');
  p.powerUses--; a.frozenUntil = performance.now() + ms; sayTo(p, (isControl ? 'Assassino congelado 10s!' : 'Assassino atordoado!') + ' (' + p.powerUses + ')');
}
function hackerPower(p) {
  const now = performance.now();
  if (!p.hackerUsed.invisible) { p.hackerUsed.invisible = true; p.invisibleUntil = now + 6000; return sayTo(p, '🟢 Hacker: invisível 6s!'); }
  if (!p.hackerUsed.stun) { const a = match.assassin; if (a && a.alive) { a.frozenUntil = now + 6000; p.hackerUsed.stun = true; return sayTo(p, '🟢 Hacker: assassino travado 6s!'); } }
  if (!p.hackerUsed.mark && p.mark) { p.hackerUsed.mark = true; p.x = p.mark.x; p.z = p.mark.z; return sayTo(p, '🟢 Hacker: teleporte!'); }
  sayTo(p, 'Hacker já usou tudo. (Q marca ponto)');
}

/* ---------- IA dos bots (host) ------------------------------------------- */
function nearestSurvivor(from, vis) { let t = null, nd = Infinity; for (const e of entities) { if (e.role !== 'survivor' || !e.alive || e === from) continue; if (vis && !canBeSeen(e, from)) continue; const d = Math.hypot(e.x - from.x, e.z - from.z); if (d < nd) { nd = d; t = e; } } return { t, d: nd }; }
function nearestThreat(from) { const a = match.assassin; let best = a && a.alive ? { x: a.x, z: a.z, d: Math.hypot(a.x - from.x, a.z - from.z) } : null; for (const c of match.clones) { const d = Math.hypot(c.x - from.x, c.z - from.z); if (!best || d < best.d) best = { x: c.x, z: c.z, d }; } return best; }
function nearestMedkit(from) { let k = null, nd = Infinity; for (const m of MEDKITS) if (m.active) { const d = Math.hypot(m.x - from.x, m.z - from.z); if (d < nd) { nd = d; k = m; } } return { k, d: nd }; }

function steer(e, dx, dz, speed, dt) {
  let l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
  for (const o of OBSTACLES) { const ox = e.x - o.x, oz = e.z - o.z, od = Math.hypot(ox, oz); if (od < o.r + 4) { dx += (ox / (od || 1)) * 0.6; dz += (oz / (od || 1)) * 0.6; } }
  const l2 = Math.hypot(dx, dz) || 1; let [nx, nz] = collide(e.x + (dx / l2) * speed * dt, e.z + (dz / l2) * speed * dt);
  e.rot = Math.atan2(nx - e.x, nz - e.z); e.x = nx; e.z = nz;
}
function wander(e, speed, dt) { const now = performance.now(); if (now > e._wt) { const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 20; e._wx = Math.cos(a) * r; e._wz = Math.sin(a) * r; e._wt = now + 2500 + Math.random() * 2000; } steer(e, e._wx - e.x, e._wz - e.z, speed, dt); }
function entSpeed(e) { let s = e.role === 'assassin' ? CFG.ASSA_SPEED : CFG.SURV_SPEED; if (e.activePower === 'lua') s = 10.5; return s * e.speedMul; }
function botAI(e, dt) {
  const now = performance.now(); if (e.frozenUntil > now) return; const speed = entSpeed(e);
  if (e.role === 'assassin') {
    const { t, d } = nearestSurvivor(e, true);
    if (t) { if (d <= CFG.PUNCH_RANGE + 0.3) assassinPunch(e); else steer(e, t.x - e.x, t.z - e.z, speed, dt); if (Math.random() < 0.004) assassinSpecial(e); }
    else wander(e, speed, dt); return;
  }
  const th = nearestThreat(e);
  if (e.hp < 55) { const { k, d } = nearestMedkit(e); if (k && (!th || d < th.d + 6)) { steer(e, k.x - e.x, k.z - e.z, speed, dt); return; } }
  if (th && th.d < 18) { if (th.d < 10 && e.powerUses > 0 && Math.random() < 0.03) useSurvivorPower(e); steer(e, e.x - th.x, e.z - th.z, speed * 1.02, dt); }
  else wander(e, speed * 0.8, dt);
}

/* ---------- humano controlado (host: input local; joiner: via rede) ------ */
function integrateHuman(e, dt) {
  const now = performance.now();
  if (e.activePower === 'lua') { if (!e.luaNext) e.luaNext = now + 10000; if (now > e.luaNext) { e.frozenUntil = now + 1000; e.luaNext = now + 10000; sayTo(e, '🌙 Lua congelou 1s!'); } }
  if (e.frozenUntil > now) return;
  let fx = e.input.fx, fz = e.input.fz;
  if (fx || fz) {
    const len = Math.hypot(fx, fz); fx /= len; fz /= len;
    const sin = Math.sin(e.rot), cos = Math.cos(e.rot);
    const wx = fx * cos - fz * sin, wz = fx * sin + fz * cos, sp = entSpeed(e);
    let [nx, nz] = collide(e.x + wx * sp * dt, e.z + wz * sp * dt); e.x = nx; e.z = nz;
  }
}
function collide(nx, nz) { const h = CFG.ARENA_HALF - 0.9; nx = Math.max(-h, Math.min(h, nx)); nz = Math.max(-h, Math.min(h, nz)); for (const o of OBSTACLES) { const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz); if (d < o.r) { const k = o.r / (d || 0.01); nx = o.x + dx * k; nz = o.z + dz * k; } } return [nx, nz]; }

function updateMedkits() {
  const now = performance.now();
  for (const m of MEDKITS) {
    if (!m.active) { if (now > m.respawnAt) { m.active = true; m.mesh.visible = true; } continue; }
    m.mesh.rotation.y += 0.02;
    for (const e of entities) { if (e.role !== 'survivor' || !e.alive || e.hp >= CFG.HP_MAX) continue; if (Math.hypot(e.x - m.x, e.z - m.z) < 1.8) { e.hp = Math.min(CFG.HP_MAX, e.hp + CFG.MEDKIT_HEAL); m.active = false; m.mesh.visible = false; m.respawnAt = now + CFG.MEDKIT_RESPAWN; sayTo(e, '➕ Kit médico! +' + CFG.MEDKIT_HEAL); break; } }
  }
}

/* ---------- fim de partida + economia (host) ----------------------------- */
function endMatch(side) {
  if (match.over) return; match.over = true;
  const assassinWon = side === 'assassino';
  const rewards = {};
  for (const e of entities) {
    if (e.isBot) continue;
    let g = 15;
    if (e.role === 'assassin') { g += e.moneyEarned; if (assassinWon) g += 40; }
    else if (!assassinWon && e.alive) g += 20;
    rewards[e.id] = g;
  }
  const title = assassinWon ? '🔪 Assassino venceu!' : '🏃 Sobreviventes venceram!';
  // host aplica o seu e manda os de cada um
  if (meHost && rewards[meHost.id] != null) { setMoney(getMoney() + rewards[meHost.id]); showResult(title, meHost, rewards[meHost.id]); }
  hostBroadcast({ t: 'ev', k: 'end', title, side, rewards });
  if (typeof document !== 'undefined' && document.exitPointerLock) document.exitPointerLock();
}

function showResult(title, ent, gained) {
  $('result-title').textContent = title;
  const box = $('result-summary'); box.innerHTML = '';
  const p = document.createElement('p'); p.className = 'sub';
  p.textContent = ent && ent.role === 'assassin' ? `Você (assassino) fez ${ent.kills || 0} morte(s).` : (ent && ent.alive ? 'Você sobreviveu!' : 'Você foi pego.');
  box.appendChild(p);
  const line = document.createElement('div'); line.className = 'line';
  line.innerHTML = `<span>Recompensa</span><span class="g">+R$${gained} → R$${getMoney()}</span>`; box.appendChild(line);
  setTimeout(() => showScreen('result'), 700);
}

/* ===========================================================================
 *  CLIENTE JOINER — render a partir dos snapshots
 * ======================================================================== */
let myEntityId = null;          // id da minha entidade (host: NET.myId; joiner: NET.myId)
const netMeshes = new Map();    // id -> {group,body,nose,label, tx,tz,trot}
let cloneMeshes = [];
let lastSnap = null;

function enterGameClient() {
  myEntityId = NET.myId;
  showScreen('game');
  toast('Clique na tela para travar o mouse e jogar.');
}

function applySnapshot(s) {
  lastSnap = s;
  const seen = new Set();
  for (const p of s.ents) {
    seen.add(p.id);
    let m = netMeshes.get(p.id);
    if (!m) { const b = makeBody(p.color); b.group.add(makeLabel(p.name + (p.role === 'assassin' ? ' 🔪' : ''), p.role === 'assassin' ? '#ff8888' : '#bfe')); m = { ...b, label: b.group.children[2] }; netMeshes.set(p.id, m); }
    m.tx = p.x; m.tz = p.z; m.trot = p.rot; m.alive = p.alive; m.invis = p.invisible; m.frozen = p.frozen; m.marked = p.marked; m.role = p.role; m.hp = p.hp;
  }
  for (const [id, m] of netMeshes) if (!seen.has(id)) { scene.remove(m.group); netMeshes.delete(id); }
  // clones
  while (cloneMeshes.length < s.clones.length) { const b = makeBody(0xaa33ff); b.body.material.transparent = true; b.body.material.opacity = 0.55; cloneMeshes.push(b); }
  while (cloneMeshes.length > s.clones.length) { const b = cloneMeshes.pop(); scene.remove(b.group); }
  s.clones.forEach((c, i) => { cloneMeshes[i].group.position.set(c.x, 0, c.z); cloneMeshes[i].group.rotation.y = c.rot; });

  // HUD a partir do snapshot
  const meS = s.ents.find(e => e.id === myEntityId);
  if (meS) { updateHudFromSnap(meS); }
  $('hud-timer').textContent = Math.ceil(s.left / 1000) + 's';
  $('alive-count').textContent = 'Sobreviventes vivos: ' + s.ents.filter(e => e.role === 'survivor' && e.alive).length;
}

function handleEvent(msg) {
  if (msg.k === 'kill') addKillFeed(msg.text);
  else if (msg.k === 'toast') toast(msg.msg);
  else if (msg.k === 'end') {
    const g = msg.rewards[NET.myId];
    if (g != null) { setMoney(getMoney() + g); }
    const meS = lastSnap && lastSnap.ents.find(e => e.id === myEntityId);
    showResult(msg.title, meS ? { role: meS.role, alive: meS.alive, kills: 0 } : null, g != null ? g : 0);
  }
}

/* ===========================================================================
 *  ENTRADA (host e joiner) — captura local
 * ======================================================================== */
const keys = {}; let pointerLocked = false; let localRot = 0;
addEventListener('keydown', e => { keys[e.code] = true; if (!inGame()) return; if (e.code === 'Space') { e.preventDefault(); doPrimary(); } if (e.code === 'KeyQ') doSecondary(); });
addEventListener('keyup', e => { keys[e.code] = false; });
function inGame() { return $('game-hud') && !$('game-hud').classList.contains('hidden'); }

function setupInput() {
  addEventListener('click', () => { if (inGame() && !pointerLocked) renderer.domElement.requestPointerLock(); });
  document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === renderer.domElement; });
  addEventListener('mousemove', e => { if (pointerLocked && inGame()) localRot -= e.movementX * 0.0024; });
  addEventListener('mousedown', e => { if (pointerLocked && inGame() && e.button === 0) doPrimary(); });
}
function localMoveVec() { let fx = 0, fz = 0; if (keys['KeyW'] || keys['ArrowUp']) fz -= 1; if (keys['KeyS'] || keys['ArrowDown']) fz += 1; if (keys['KeyA'] || keys['ArrowLeft']) fx -= 1; if (keys['KeyD'] || keys['ArrowRight']) fx += 1; return { fx, fz }; }

function doPrimary() { if (NET.isHost) { if (meHost && meHost.alive && match && !match.over) primaryFor(meHost); } else if (NET.hostConn) NET.hostConn.send({ t: 'act', a: 'primary' }); }
function doSecondary() { if (NET.isHost) { if (meHost && meHost.alive && match && !match.over) secondaryFor(meHost); } else if (NET.hostConn) NET.hostConn.send({ t: 'act', a: 'secondary' }); }

/* ===========================================================================
 *  LOOP PRINCIPAL
 * ======================================================================== */
let prevT = performance.now(), snapAcc = 0, inAcc = 0;
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now(); const dt = Math.min(0.05, (now - prevT) / 1000); prevT = now;

  if (NET.isHost && match && !match.over) hostStep(dt, now);
  else if (!NET.isHost && NET.started) joinStep(dt, now);

  renderer.render(scene, camera);
}

function hostStep(dt, now) {
  // input local do host
  if (meHost && meHost.alive) { const v = localMoveVec(); meHost.input.fx = v.fx; meHost.input.fz = v.fz; meHost.rot = localRot; }
  // integra humanos e roda bots
  for (const e of entities) { if (!e.alive) continue; if (e.isBot) botAI(e, dt); else integrateHuman(e, dt); }
  updateMedkits();
  // clones
  for (let i = match.clones.length - 1; i >= 0; i--) { const c = match.clones[i]; c.x += c.vx * 5 * dt; c.z += c.vz * 5 * dt; [c.x, c.z] = collide(c.x, c.z); if (now > c.life) match.clones.splice(i, 1); }
  // posiciona meshes locais (host) + marca/invis
  for (const e of entities) {
    e.vis.group.position.set(e.x, 0, e.z); e.vis.group.rotation.y = e.rot;
    const invis = e.invisibleUntil > now; const see = meHost && meHost.char === 'hacker';
    e.vis.group.visible = e.alive && (!invis || e === meHost || see);
    e.vis.body.material.transparent = invis; e.vis.body.material.opacity = invis ? (e === meHost || see ? 0.4 : 0) : 1;
  }
  cloneSyncHost();
  // tempo
  const left = Math.max(0, match.endsAt - now); if (left <= 0) endMatch('sobreviventes');
  // snapshots
  snapAcc += dt; if (snapAcc >= 1 / CFG.SNAP_HZ) { snapAcc = 0; sendSnapshot(left); }
  // HUD + camera para o host
  if (meHost) { updateHudFor(meHost); cameraFollow(meHost.x, meHost.z, meHost.rot); }
}

let _cloneVis = [];
function cloneSyncHost() {
  while (_cloneVis.length < match.clones.length) { const b = makeBody(0xaa33ff); b.body.material.transparent = true; b.body.material.opacity = 0.55; _cloneVis.push(b); }
  while (_cloneVis.length > match.clones.length) { scene.remove(_cloneVis.pop().group); }
  match.clones.forEach((c, i) => { _cloneVis[i].group.position.set(c.x, 0, c.z); _cloneVis[i].group.rotation.y = c.rot; });
}

function sendSnapshot(left) {
  const ents = entities.map(e => ({ id: e.id, name: e.name, role: e.role, char: e.char, color: e.def.color, x: +e.x.toFixed(2), z: +e.z.toFixed(2), rot: +e.rot.toFixed(2), hp: Math.max(0, Math.round(e.hp)), alive: e.alive, invisible: e.invisibleUntil > performance.now(), frozen: e.frozenUntil > performance.now(), marked: e.markedByAssassin }));
  const clones = match.clones.map(c => ({ x: +c.x.toFixed(2), z: +c.z.toFixed(2), rot: +c.rot.toFixed(2) }));
  hostBroadcast({ t: 'snap', tm: performance.now(), left, ents, clones });
}

function joinStep(dt, now) {
  // envia input ao host
  inAcc += dt; if (inAcc >= 1 / CFG.IN_HZ) { inAcc = 0; const v = localMoveVec(); if (NET.hostConn && NET.hostConn.open) NET.hostConn.send({ t: 'in', fx: v.fx, fz: v.fz, rot: localRot }); }
  // interpola meshes
  for (const [id, m] of netMeshes) {
    m.group.position.lerp(new THREE.Vector3(m.tx, 0, m.tz), id === myEntityId ? 0.5 : 0.3);
    m.group.rotation.y = m.trot;
    const see = isMyCharHacker();
    m.group.visible = m.alive && (!m.invis || id === myEntityId || see);
    m.body.material.transparent = m.invis; m.body.material.opacity = m.invis ? (id === myEntityId || see ? 0.4 : 0) : 1;
  }
  const meM = netMeshes.get(myEntityId);
  if (meM) cameraFollow(meM.group.position.x, meM.group.position.z, localRot);
}
function isMyCharHacker() { const meS = lastSnap && lastSnap.ents.find(e => e.id === myEntityId); return meS && meS.char === 'hacker'; }

function cameraFollow(x, z, rot) {
  const cx = x + Math.sin(rot) * 9, cz = z + Math.cos(rot) * 9;
  camera.position.lerp(new THREE.Vector3(cx, 6.2, cz), 0.2);
  camera.lookAt(x - Math.sin(rot) * 4, 1.6, z - Math.cos(rot) * 4);
}

/* ---------- HUD ---------------------------------------------------------- */
function updateRoleBannerFor(e) {
  const a = e.role === 'assassin';
  $('role-banner').textContent = a ? `🔪 VOCÊ É O ASSASSINO (${e.def.name})` : `🏃 SOBREVIVENTE (${e.def.name})`;
  $('role-banner').style.color = a ? '#ff6b6b' : '#4affa3';
}
function updateHudFor(e) {
  const a = e.role === 'assassin';
  $('hpbar-wrap').style.display = a ? 'none' : 'block';
  if (!a) { const pct = Math.max(0, e.hp) / CFG.HP_MAX * 100; $('hpbar').style.width = pct + '%'; $('hpbar').style.background = pct > 50 ? '#4affa3' : pct > 25 ? '#ffd24a' : '#ff5a5a'; $('hptext').textContent = Math.max(0, Math.round(e.hp)) + ' HP'; }
  $('alive-count').textContent = 'Sobreviventes vivos: ' + entities.filter(x => x.role === 'survivor' && x.alive).length;
  $('power-bar').textContent = powerHint(e.role, e.char, e.activePower, e.powerUses, e.def);
  updateRoleBannerFor(e);
}
function updateHudFromSnap(s) {
  const a = s.role === 'assassin'; const def = a ? ASSA[s.char] : SURV[s.char];
  $('hpbar-wrap').style.display = a ? 'none' : 'block';
  if (!a) { const pct = Math.max(0, s.hp) / CFG.HP_MAX * 100; $('hpbar').style.width = pct + '%'; $('hpbar').style.background = pct > 50 ? '#4affa3' : pct > 25 ? '#ffd24a' : '#ff5a5a'; $('hptext').textContent = Math.max(0, Math.round(s.hp)) + ' HP'; }
  $('role-banner').textContent = a ? `🔪 VOCÊ É O ASSASSINO (${def.name})` : `🏃 SOBREVIVENTE (${def.name})`;
  $('role-banner').style.color = a ? '#ff6b6b' : '#4affa3';
  const ap = a ? 'none' : (def.power === 'choose' ? 'choose' : def.power);
  $('power-bar').textContent = powerHint(s.role, s.char, ap, '', def);
}
function powerHint(role, char, ap, uses, def) {
  if (role === 'assassin') return `CLIQUE/ESPAÇO: soco · Q: especial (${def.name})`;
  if (char === 'hacker') return 'Hacker · ESPAÇO: próximo poder · Q: marcar';
  if (ap === 'mark') return `Q: marcar · ESPAÇO: teleporte${uses !== '' ? ' (' + uses + ')' : ''}`;
  if (ap === 'none') return 'Sem poder · corra e pegue kits médicos';
  if (ap === 'lua') return 'Lua: veloz (congela às vezes)';
  return `ESPAÇO: ${POWER_LABEL[ap] || 'poder'}${uses !== '' ? ' (' + uses + ')' : ''}`;
}
function addKillFeed(text) { const k = document.createElement('div'); k.className = 'k'; k.textContent = text; $('kill-feed').prepend(k); setTimeout(() => k.remove(), 6000); }

/* ===========================================================================
 *  LOBBY / LOJA
 * ======================================================================== */
function renderLobby() {
  const list = $('players-list'); if (!list) return; list.innerHTML = '';
  let players;
  if (NET.isHost) players = [...hostRoster.values()].map(p => ({ name: p.name, isBot: false }));
  else players = netRoster.map(p => ({ name: p.name, isBot: p.isBot }));
  // bots previstos
  const humanN = players.length;
  const botN = NET.isHost ? Math.max(sess.botCount, CFG.MIN_PLAYERS - humanN) : (netRoster.filter(p => p.isBot).length);
  players.forEach(p => { const el = document.createElement('div'); el.className = 'p'; el.textContent = p.name; list.appendChild(el); });
  if (NET.isHost) for (let i = 0; i < botN; i++) { const el = document.createElement('div'); el.className = 'p bot'; el.textContent = '🤖 Bot'; list.appendChild(el); }
  const info = $('lobby-info');
  if (info) info.textContent = NET.isHost ? `${humanN} humano(s) + ${botN} bot(s) = ${humanN + botN} jogadores` : 'Aguardando o host iniciar...';
}

function renderShop() {
  const owned = getOwned();
  const shop = $('shop'); if (!shop) return; shop.innerHTML = '';
  for (const [key, ch] of Object.entries(SURV)) {
    const have = owned.includes(key) || ch.price === 0; const sel = sess.myChar === key;
    const el = document.createElement('div'); el.className = 'item' + (sel ? ' owned' : '');
    el.innerHTML = `<div class="nm">${ch.name}</div><div class="pw">${ch.desc}</div><div class="pr">${have ? (sel ? 'Selecionado ✓' : 'Selecionar') : 'R$' + ch.price}</div>`;
    el.onclick = () => {
      if (!have) { if (getMoney() < ch.price) return toast('Dinheiro insuficiente (R$' + ch.price + ').'); setMoney(getMoney() - ch.price); setOwned([...getOwned(), key]); toast('Comprado: ' + ch.name); }
      sess.myChar = key; renderShop(); pushCharToHost();
    };
    shop.appendChild(el);
  }
  $('choose-power').classList.toggle('hidden', sess.myChar !== 'powerbest');
}
function pushCharToHost() {
  if (NET.isHost) { const p = hostRoster.get(NET.myId); if (p) { p.char = sess.myChar; p.chosenPower = sess.chosenPower; } renderLobby(); }
  else if (NET.hostConn && NET.hostConn.open) NET.hostConn.send({ t: 'char', char: sess.myChar, chosenPower: sess.chosenPower });
}

/* ===========================================================================
 *  BOOT / MENUS
 * ======================================================================== */
addEventListener('load', () => {
  if (typeof THREE === 'undefined') { document.body.innerHTML = '<p style="color:#fff;padding:30px;font-family:sans-serif">Erro: Three.js não carregou. Abra a pasta inteira.</p>'; return; }
  if (typeof Peer === 'undefined') { toast('Aviso: PeerJS não carregou — online indisponível.'); }
  initThree(); setupInput();
  const mEl = $('money'); if (mEl) mEl.textContent = getMoney();

  $('btn-enter').onclick = () => { sess.name = ($('name-input').value.trim() || 'Jogador').slice(0, 16); showScreen('menu'); };
  $('btn-create').onclick = () => createRoom();
  $('btn-join').onclick = () => { const code = ($('join-code').value || '').trim(); if (!code) return toast('Cole o código da sala.'); joinRoom(code); };
  $('chosen-power').onchange = e => { sess.chosenPower = e.target.value; pushCharToHost(); };
  $('bot-count').onchange = e => { sess.botCount = parseInt(e.target.value, 10); renderLobby(); };
  $('btn-start').onclick = () => { if (NET.isHost) hostStartMatch(); };
  $('btn-back').onclick = () => { location.reload(); };
  $('btn-copy').onclick = () => { const c = $('room-code').textContent; if (navigator.clipboard) navigator.clipboard.writeText(c); toast('Código copiado!'); };

  showScreen('login');
});

/* expoe utilidades para teste headless (sem efeito no navegador) */
if (typeof window !== 'undefined') window.__fuga = { get entities() { return entities; }, get match() { return match; }, get meHost() { return meHost; }, hostRoster, NET, hostStartMatch, sess };
