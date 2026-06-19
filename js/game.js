/* ===========================================================================
 *  FUGA 3D  —  jogo offline (1 jogador + bots).  Roda so abrindo o index.html.
 *  Usa Three.js global (js/three.min.js).  Sem servidor, sem instalar nada.
 * ======================================================================== */
'use strict';

/* ---------- Configuracao / regras ---------------------------------------- */
const CFG = {
  ARENA_HALF: 40,
  HP_MAX: 100,
  PUNCH_DMG: 22,
  PUNCH_RANGE: 3.4,
  PUNCH_CD: 850,        // ms entre socos
  MEDKIT_HEAL: 40,
  MEDKIT_RESPAWN: 18000,
  SURV_SPEED: 8.5,
  ASSA_SPEED: 9.2,
  MATCH_MS: 150000,     // 2min30 de fuga
  MAX_MONEY: 1000,
  START_MONEY: 100,
};

/* Personagens sobreviventes (loja). Preco escala ate 1000. */
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

/* Assassinos (cada um com um poder especial). */
const ASSA = {
  free:        { name: 'Assassino Free', special: 'none',     color: 0xff3344, desc: 'Soco básico.' },
  lucas:       { name: 'Lucas',          special: 'lifesteal',color: 0xff7733, desc: 'Cada soco ganha dinheiro e velocidade.' },
  ilusionista: { name: 'Ilusionista',    special: 'clones',   color: 0xaa33ff, desc: 'Q cria clones que confundem os bots.' },
  marcador:    { name: 'Marcador',       special: 'mark',     color: 0xff0066, desc: 'Marca alguém; se tirou +50% da vida em 10s, mata na hora.' },
};

const POWER_LABEL = {
  none: 'Sem poder', lua: 'Lua (veloz, congela)', mark: 'Teleporte (Q marca, ESPAÇO volta)',
  invisible: 'Invisível (ESPAÇO)', stun: 'Atordoar assassino (ESPAÇO)',
  control: 'Congelar assassino (ESPAÇO)', choose: 'Power Best', hacker: 'Hacker (tudo 1x)',
};

/* ---------- Dinheiro persistente (localStorage) -------------------------- */
function getMoney() {
  let m = parseInt(localStorage.getItem('fuga3d_money'), 10);
  if (isNaN(m)) m = CFG.START_MONEY;
  return Math.max(0, Math.min(CFG.MAX_MONEY, m));
}
function setMoney(v) {
  localStorage.setItem('fuga3d_money', String(Math.max(0, Math.min(CFG.MAX_MONEY, v))));
  $('money').textContent = getMoney();
}
function getOwned() {
  try { return JSON.parse(localStorage.getItem('fuga3d_owned')) || ['classico']; }
  catch { return ['classico']; }
}
function setOwned(list) { localStorage.setItem('fuga3d_owned', JSON.stringify([...new Set(list)])); }

/* ---------- Utilidades de UI --------------------------------------------- */
const $ = (id) => document.getElementById(id);
const screens = { login: $('screen-login'), lobby: $('screen-lobby'), result: $('screen-result') };
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('show'));
  if (screens[name]) screens[name].classList.add('show');
  const playing = name === 'game';
  $('game-hud').classList.toggle('hidden', !playing);
  $('hud').classList.toggle('hidden', !playing);
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 't'; t.textContent = msg;
  $('toasts').appendChild(t); setTimeout(() => t.remove(), 4000);
}

/* ---------- Estado da sessao --------------------------------------------- */
const sess = {
  name: 'Jogador',
  myChar: 'classico',
  chosenPower: 'invisible',
  pickAssassin: 'free',   // assassino escolhido se "jogar como assassino"
  forceAssassin: false,
  botCount: 3,
};

/* ===========================================================================
 *  THREE.JS — cena
 * ======================================================================== */
let renderer, scene, camera;
let groundMat;
const OBSTACLES = [];  // {x,z,r}
const BUSHES = [];     // {x,z,r}
const MEDKITS = [];    // {x,z,mesh,active,respawnAt}

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
  dir.shadow.camera.left = -70; dir.shadow.camera.right = 70;
  dir.shadow.camera.top = 70; dir.shadow.camera.bottom = -70;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);

  buildArena();
  window.addEventListener('resize', onResize);
  requestAnimationFrame(loop);
}
function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function buildArena() {
  const half = CFG.ARENA_HALF;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(half * 2, half * 2),
    new THREE.MeshStandardMaterial({ color: 0x1a1f3a, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(half * 2, half, 0x33407a, 0x222a55);
  grid.position.y = 0.02; scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a3366, roughness: 0.8 });
  const wall = (w, h, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; scene.add(m);
  };
  wall(half * 2, 4, 1, 0, -half); wall(half * 2, 4, 1, 0, half);
  wall(1, 4, half * 2, -half, 0); wall(1, 4, half * 2, half, 0);

  // pilares / esconderijos solidos
  const obMat = new THREE.MeshStandardMaterial({ color: 0x3a4480, roughness: 0.7 });
  const cols = [[-20,-12,3],[18,-16,3],[0,2,4],[-22,16,3],[24,10,3],[12,20,2.5],
                [-10,24,2.5],[28,-6,2.5],[-28,4,2.5],[8,-24,3],[-14,-26,2.5],[22,-26,2.5]];
  for (const [x, z, r] of cols) {
    const h = 4 + r;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), obMat);
    m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; scene.add(m);
    OBSTACLES.push({ x, z, r: r + 0.6 });
  }

  // moitas (esconderijos): o assassino tem dificuldade de te ver dentro delas
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 1, transparent: true, opacity: 0.7 });
  const bs = [[-30,-30,4],[30,30,4],[-32,28,3.5],[34,-20,3.5],[4,32,4],[-6,-34,3.5]];
  for (const [x, z, r] of bs) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), bushMat);
    m.position.set(x, r * 0.7, z); m.scale.y = 0.7; m.receiveShadow = true; scene.add(m);
    BUSHES.push({ x, z, r });
  }

  // kits medicos
  const medPos = [[-15,5],[16,2],[0,-15],[-25,-20],[26,18],[10,28],[-30,12]];
  for (const [x, z] of medPos) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x224422 }));
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.18), crossMat);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.7), crossMat);
    cross1.position.y = cross2.position.y = 0.45;
    g.add(box, cross1, cross2);
    g.position.set(x, 0.5, z); scene.add(g);
    MEDKITS.push({ x, z, mesh: g, active: true, respawnAt: 0 });
  }
}

/* ---------- Sprites de nome ---------------------------------------------- */
function makeLabel(text, color) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 30px Segoe UI'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(text, 128, 32);
  ctx.fillStyle = color || '#fff'; ctx.fillText(text, 128, 32);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
  spr.scale.set(4.2, 1.05, 1); spr.position.y = 3.6;
  return spr;
}

/* ===========================================================================
 *  ENTIDADES (jogador + bots)
 * ======================================================================== */
let entities = [];
let me = null;        // referencia ao jogador humano
let match = null;     // estado da partida atual

function makeBody(color, isAssassin) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.6, 1.2, 6, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.5, emissive: 0x000000 })
  );
  body.position.y = 1.4; body.castShadow = true; group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff }));
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.5, 0.7); group.add(nose);
  scene.add(group);
  return { group, body, nose };
}

function spawnPos(i, n) {
  const a = (i / n) * Math.PI * 2;
  return { x: Math.cos(a) * 22, z: Math.sin(a) * 22 };
}

function createEntity(opts) {
  const isA = opts.role === 'assassin';
  const def = isA ? ASSA[opts.char] : SURV[opts.char];
  const color = isA ? def.color : def.color;
  const vis = makeBody(color, isA);
  const label = makeLabel(opts.name + (isA ? ' 🔪' : ''), isA ? '#ff8888' : '#bfe');
  vis.group.add(label);
  const ent = {
    id: opts.id, name: opts.name, role: opts.role, char: opts.char, def,
    isHuman: !!opts.isHuman, alive: true,
    hp: isA ? 999 : CFG.HP_MAX,
    x: opts.x, z: opts.z, rot: 0,
    vis, label,
    speedMul: 1, frozenUntil: 0, invisibleUntil: 0,
    lastPunch: 0, mark: null,
    powerUses: isA ? 0 : (def.uses || 0),
    activePower: !isA ? (def.power === 'choose' ? sess.chosenPower : def.power) : 'none',
    hackerUsed: { invisible: false, mark: false, stun: false },
    kills: 0, moneyEarned: 0,
    aiTarget: null, aiWander: { x: opts.x, z: opts.z, t: 0 },
    dmgLog: [],            // {t,amount} para regra do Marcador
    markedByAssassin: false,
  };
  return ent;
}

/* ===========================================================================
 *  MONTAGEM DA PARTIDA
 * ======================================================================== */
const BOT_NAMES = ['Léo', 'Bia', 'Caio', 'Duda', 'Rafa', 'Nina', 'Theo', 'Gabi', 'Igor', 'Lara'];

function startMatch() {
  // limpa entidades antigas
  entities.forEach(e => scene.remove(e.vis.group));
  entities = [];

  const n = sess.botCount;
  const total = n + 1;

  // monta lista de participantes (humano + bots), todos sobreviventes a principio
  const parts = [];
  parts.push({ isHuman: true, name: sess.name, char: sess.myChar });
  const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) {
    const survKeys = Object.keys(SURV);
    parts.push({ isHuman: false, name: names[i] || ('Bot' + i), char: survKeys[Math.floor(Math.random() * survKeys.length)] });
  }

  // escolhe o assassino: voce (se marcou) ou sorteio com peso pelo dinheiro
  let assassinIdx;
  if (sess.forceAssassin) assassinIdx = 0;
  else {
    const weights = parts.map(p => p.isHuman ? (1 + getMoney() / 100) : 1);
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum; assassinIdx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { assassinIdx = i; break; } }
  }
  const assassinChar = (assassinIdx === 0 && sess.forceAssassin) ? sess.pickAssassin
    : Object.keys(ASSA)[Math.floor(Math.random() * Object.keys(ASSA).length)];

  parts.forEach((p, i) => {
    const sp = spawnPos(i, total);
    const isA = (i === assassinIdx);
    const ent = createEntity({
      id: i, name: p.name, isHuman: p.isHuman,
      role: isA ? 'assassin' : 'survivor',
      char: isA ? assassinChar : p.char,
      x: sp.x, z: sp.z,
    });
    entities.push(ent);
    if (p.isHuman) me = ent;
  });

  // reativa medkits
  MEDKITS.forEach(k => { k.active = true; k.respawnAt = 0; k.mesh.visible = true; });

  match = {
    startedAt: performance.now(),
    endsAt: performance.now() + CFG.MATCH_MS,
    over: false,
    assassin: entities.find(e => e.role === 'assassin'),
    clones: [],
  };

  me.rot = 0;
  $('money').textContent = getMoney();
  $('hud-phase').textContent = 'FUGA';
  showScreen('game');
  updateRoleBanner();
  toast('Clique na tela para travar o mouse e jogar.');
}

function updateRoleBanner() {
  const a = me.role === 'assassin';
  $('role-banner').textContent = a
    ? `🔪 VOCÊ É O ASSASSINO (${me.def.name}) — elimine todos!`
    : `🏃 SOBREVIVENTE (${me.def.name}) — fuja por ${Math.ceil(CFG.MATCH_MS/1000)}s!`;
  $('role-banner').style.color = a ? '#ff6b6b' : '#4affa3';
}

/* ===========================================================================
 *  ENTRADA / CONTROLE
 * ======================================================================== */
const keys = {};
let pointerLocked = false;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!match || match.over) return;
  if (e.code === 'Space') { e.preventDefault(); primaryAction(); }
  if (e.code === 'KeyQ') secondaryAction();
});
addEventListener('keyup', e => { keys[e.code] = false; });

function setupInput() {
  addEventListener('click', () => {
    if (match && !match.over && !pointerLocked) renderer.domElement.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === renderer.domElement;
  });
  addEventListener('mousemove', e => {
    if (pointerLocked && match && !match.over) me.rot -= e.movementX * 0.0024;
  });
  addEventListener('mousedown', e => {
    if (pointerLocked && match && !match.over && e.button === 0) primaryAction();
  });
}

function primaryAction() {
  if (!me.alive) return;
  if (me.role === 'assassin') assassinPunch(me);
  else useSurvivorPower(me);
}
function secondaryAction() {
  if (!me || !me.alive || match.over) return;
  if (me.role === 'assassin') assassinSpecial(me);
  else if (me.activePower === 'mark' || me.char === 'hacker') { me.mark = { x: me.x, z: me.z }; toast('Ponto marcado! (ESPAÇO volta)'); }
}

/* ===========================================================================
 *  COMBATE
 * ======================================================================== */
function isHidden(ent) {
  for (const b of BUSHES) if (Math.hypot(ent.x - b.x, ent.z - b.z) < b.r) return true;
  return false;
}
function canBeSeen(surv, byAssassin) {
  const now = performance.now();
  if (!surv.alive) return false;
  if (surv.invisibleUntil > now) return false;     // invisivel: ninguem ve
  if (isHidden(surv)) {
    // dentro da moita: so e visto se estiver bem perto
    return Math.hypot(surv.x - byAssassin.x, surv.z - byAssassin.z) < 6;
  }
  return true;
}

function assassinPunch(a) {
  const now = performance.now();
  if (now - a.lastPunch < CFG.PUNCH_CD || a.frozenUntil > now) return;
  a.lastPunch = now;
  let target = null, nd = Infinity;
  for (const e of entities) {
    if (e.role !== 'survivor' || !e.alive) continue;
    if (e.invisibleUntil > now) continue;
    const d = Math.hypot(e.x - a.x, e.z - a.z);
    if (d < nd) { nd = d; target = e; }
  }
  if (!target || nd > CFG.PUNCH_RANGE) { if (a.isHuman) flashPunch(a); return; }
  flashPunch(a);

  let dmg = CFG.PUNCH_DMG;
  let instakill = false;

  // Marcador: se tirou +50% da vida do alvo marcado nos ultimos 10s -> mata
  if (a.def.special === 'mark' && target.markedByAssassin) {
    const since = now - 10000;
    const recent = target.dmgLog.filter(d => d.t > since).reduce((s, d) => s + d.amount, 0);
    if (recent >= CFG.HP_MAX * 0.5) instakill = true;
  }

  if (instakill) { target.hp = 0; }
  else {
    target.hp -= dmg;
    target.dmgLog.push({ t: now, amount: dmg });
  }

  // Lucas: rouba vida (ganha velocidade) e dinheiro a cada soco
  if (a.def.special === 'lifesteal') {
    a.speedMul = Math.min(1.5, a.speedMul + 0.05);
    a.moneyEarned += 2;
    if (a.isHuman) toast('💰 +R$2 (Lucas)');
  }

  spawnHitFx(target);
  if (target.hp <= 0) killSurvivor(a, target);
  else if (target.isHuman) flashDamage();
  updateHud();
}

function killSurvivor(assassin, victim) {
  victim.alive = false;
  victim.vis.group.visible = false;
  assassin.kills++;
  assassin.moneyEarned += 1; // +1 por morte
  addKillFeed(`🔪 ${assassin.name} pegou ${victim.name}`);
  if (victim.isHuman) { toast('💀 Você foi pego!'); document.exitPointerLock(); }
  const survAlive = entities.filter(e => e.role === 'survivor' && e.alive).length;
  if (survAlive === 0) endMatch('assassino');
  else if (victim.isHuman) endMatch('sobreviventes'); // você perdeu; os bots seguem
}

function flashPunch(a) {
  a.vis.nose.material.color.setHex(0xff0000);
  setTimeout(() => a.vis.nose.material.color.setHex(0xffffff), 120);
}
function spawnHitFx(t) {
  t.vis.body.material.emissive.setHex(0xff0000);
  setTimeout(() => { if (t.alive) t.vis.body.material.emissive.setHex(t.markedByAssassin ? 0x552200 : 0x000000); }, 150);
}
function flashDamage() {
  const f = document.createElement('div');
  f.style.cssText = 'position:fixed;inset:0;background:#f005;z-index:14;pointer-events:none;transition:.4s';
  document.body.appendChild(f); requestAnimationFrame(() => f.style.opacity = '0');
  setTimeout(() => f.remove(), 400);
}

/* Poderes do assassino (Q) */
function assassinSpecial(a) {
  const now = performance.now();
  const say = (m) => { if (a.isHuman) toast(m); };
  if (a.def.special === 'clones') {
    if (a._cloneCd && now < a._cloneCd) return say('Clones recarregando...');
    a._cloneCd = now + 12000;
    for (let i = 0; i < 2; i++) {
      const vis = makeBody(a.def.color, true);
      vis.body.material.transparent = true; vis.body.material.opacity = 0.55;
      const ang = Math.random() * Math.PI * 2;
      const clone = { vis, x: a.x + Math.cos(ang) * 4, z: a.z + Math.sin(ang) * 4, rot: a.rot, life: now + 8000, vx: Math.cos(ang), vz: Math.sin(ang) };
      match.clones.push(clone);
    }
    say('👥 Clones criados! (confundem os bots)');
  } else if (a.def.special === 'mark') {
    // marca o sobrevivente vivo mais proximo
    let t = null, nd = Infinity;
    for (const e of entities) if (e.role === 'survivor' && e.alive) {
      const d = Math.hypot(e.x - a.x, e.z - a.z); if (d < nd) { nd = d; t = e; }
    }
    entities.forEach(e => e.markedByAssassin = false);
    if (t) { t.markedByAssassin = true; t.vis.body.material.emissive.setHex(0x552200); say('🎯 ' + t.name + ' marcado!'); }
  } else {
    say('Este assassino não tem poder de Q.');
  }
}

/* ===========================================================================
 *  PODERES DO SOBREVIVENTE
 * ======================================================================== */
function useSurvivorPower(p) {
  const now = performance.now();
  const pw = p.activePower;
  const say = (m) => { if (p.isHuman) toast(m); };

  if (p.char === 'hacker') return hackerPower(p);

  if (pw === 'mark') {
    if (!p.mark) return say('Use Q para marcar um ponto primeiro.');
    if (p.powerUses <= 0) return say('Sem teleportes.');
    p.powerUses--; p.x = p.mark.x; p.z = p.mark.z;
    say('Teleporte! (' + p.powerUses + ')'); updateHud(); return;
  }
  if (p.powerUses <= 0 && pw !== 'lua' && pw !== 'none') return say('Sem usos.');

  if (pw === 'invisible') { p.powerUses--; p.invisibleUntil = now + 5000; say('Invisível 5s! (' + p.powerUses + ')'); }
  else if (pw === 'stun') doStun(p, 3000);
  else if (pw === 'control') doStun(p, 10000, true);
  else if (pw === 'lua') say('Lua é passivo: você já corre mais rápido.');
  else say('Sem poder ativo.');
  if (p.isHuman) updateHud();
}

function doStun(p, ms, isControl) {
  const say = (m) => { if (p.isHuman) toast(m); };
  const a = match.assassin;
  if (!a || !a.alive) return;
  if (Math.hypot(a.x - p.x, a.z - p.z) > (isControl ? 999 : 9)) return say('Chegue mais perto do assassino.');
  if (p.powerUses <= 0) return say('Sem usos.');
  p.powerUses--;
  a.frozenUntil = performance.now() + ms;
  say((isControl ? 'Assassino congelado 10s!' : 'Assassino atordoado!') + ' (' + p.powerUses + ')');
}

function hackerPower(p) {
  const now = performance.now();
  const say = (m) => { if (p.isHuman) toast(m); };
  if (!p.hackerUsed.invisible) { p.hackerUsed.invisible = true; p.invisibleUntil = now + 6000; return say('🟢 Hacker: invisível 6s!'); }
  if (!p.hackerUsed.stun) {
    const a = match.assassin;
    if (a && a.alive) { a.frozenUntil = now + 6000; p.hackerUsed.stun = true; return say('🟢 Hacker: assassino travado 6s!'); }
  }
  if (!p.hackerUsed.mark && p.mark) { p.hackerUsed.mark = true; p.x = p.mark.x; p.z = p.mark.z; return say('🟢 Hacker: teleporte!'); }
  say('Hacker já usou tudo. (Q marca ponto p/ teleporte)');
}

/* ===========================================================================
 *  IA dos bots
 * ======================================================================== */
function nearestSurvivor(from, requireVisible) {
  let t = null, nd = Infinity;
  for (const e of entities) {
    if (e.role !== 'survivor' || !e.alive || e === from) continue;
    if (requireVisible && !canBeSeen(e, from)) continue;
    const d = Math.hypot(e.x - from.x, e.z - from.z);
    if (d < nd) { nd = d; t = e; }
  }
  return { t, d: nd };
}
function nearestAssassinPos(from) {
  const a = match.assassin;
  // bots tambem fogem de clones
  let best = a && a.alive ? { x: a.x, z: a.z, d: Math.hypot(a.x - from.x, a.z - from.z) } : null;
  for (const c of match.clones) {
    const d = Math.hypot(c.x - from.x, c.z - from.z);
    if (!best || d < best.d) best = { x: c.x, z: c.z, d };
  }
  return best;
}
function nearestMedkit(from) {
  let k = null, nd = Infinity;
  for (const m of MEDKITS) if (m.active) {
    const d = Math.hypot(m.x - from.x, m.z - from.z); if (d < nd) { nd = d; k = m; }
  }
  return { k, d: nd };
}

function steer(ent, dx, dz, speed, dt) {
  const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
  // repulsao de obstaculos
  for (const o of OBSTACLES) {
    const ox = ent.x - o.x, oz = ent.z - o.z, od = Math.hypot(ox, oz);
    if (od < o.r + 4) { dx += (ox / (od || 1)) * 0.6; dz += (oz / (od || 1)) * 0.6; }
  }
  const l2 = Math.hypot(dx, dz) || 1;
  let nx = ent.x + (dx / l2) * speed * dt;
  let nz = ent.z + (dz / l2) * speed * dt;
  [nx, nz] = collide(nx, nz);
  ent.rot = Math.atan2(nx - ent.x, nz - ent.z);
  ent.x = nx; ent.z = nz;
}

function botAI(ent, dt) {
  const now = performance.now();
  if (ent.frozenUntil > now) return;
  const speed = entSpeed(ent);

  if (ent.role === 'assassin') {
    const { t, d } = nearestSurvivor(ent, true);
    if (t) {
      ent.aiTarget = t;
      if (d <= CFG.PUNCH_RANGE + 0.3) assassinPunch(ent);
      else steer(ent, t.x - ent.x, t.z - ent.z, speed, dt);
      // de vez em quando usa especial
      if (Math.random() < 0.004) assassinSpecial(ent);
    } else {
      wander(ent, speed, dt);
    }
    return;
  }

  // sobrevivente bot
  const threat = nearestAssassinPos(ent);
  if (ent.hp < 55) {
    const { k, d } = nearestMedkit(ent);
    if (k && (!threat || d < threat.d + 6)) { steer(ent, k.x - ent.x, k.z - ent.z, speed, dt); return; }
  }
  if (threat && threat.d < 18) {
    // foge na direcao oposta, e de vez em quando usa poder
    if (threat.d < 10 && ent.powerUses > 0 && Math.random() < 0.03) useSurvivorPower(ent);
    steer(ent, ent.x - threat.x, ent.z - threat.z, speed * 1.02, dt);
  } else {
    wander(ent, speed * 0.8, dt);
  }
}

function wander(ent, speed, dt) {
  const now = performance.now();
  if (now > ent.aiWander.t) {
    const ang = Math.random() * Math.PI * 2, r = 12 + Math.random() * 20;
    ent.aiWander = { x: Math.cos(ang) * r, z: Math.sin(ang) * r, t: now + 2500 + Math.random() * 2000 };
  }
  steer(ent, ent.aiWander.x - ent.x, ent.aiWander.z - ent.z, speed, dt);
}

function entSpeed(ent) {
  let s = (ent.role === 'assassin') ? CFG.ASSA_SPEED : CFG.SURV_SPEED;
  if (ent.activePower === 'lua') s = 10.5;
  return s * ent.speedMul;
}

/* ---------- colisao compartilhada ---------------------------------------- */
function collide(nx, nz) {
  const h = CFG.ARENA_HALF - 0.9;
  nx = Math.max(-h, Math.min(h, nx)); nz = Math.max(-h, Math.min(h, nz));
  for (const o of OBSTACLES) {
    const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz);
    if (d < o.r) { const k = o.r / (d || 0.01); nx = o.x + dx * k; nz = o.z + dz * k; }
  }
  return [nx, nz];
}

/* ===========================================================================
 *  Movimento do humano + Lua (congela 1s a cada 10s)
 * ======================================================================== */
function updateHuman(dt) {
  if (!me.alive) return;
  const now = performance.now();
  // poder Lua: congela 1s a cada 10s
  if (me.activePower === 'lua') {
    if (!me._luaNext) me._luaNext = now + 10000;
    if (now > me._luaNext) { me.frozenUntil = now + 1000; me._luaNext = now + 10000; toast('🌙 Lua congelou você 1s!'); }
  }
  if (me.frozenUntil > now) return;

  let fx = 0, fz = 0;
  if (keys['KeyW'] || keys['ArrowUp']) fz -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) fz += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) fx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) fx += 1;
  if (fx || fz) {
    const len = Math.hypot(fx, fz); fx /= len; fz /= len;
    const sin = Math.sin(me.rot), cos = Math.cos(me.rot);
    const wx = fx * cos - fz * sin, wz = fx * sin + fz * cos;
    const sp = entSpeed(me);
    let [nx, nz] = collide(me.x + wx * sp * dt, me.z + wz * sp * dt);
    me.x = nx; me.z = nz;
  }
}

/* ---------- medkits ------------------------------------------------------ */
function updateMedkits() {
  const now = performance.now();
  for (const m of MEDKITS) {
    if (!m.active) { if (now > m.respawnAt) { m.active = true; m.mesh.visible = true; } continue; }
    m.mesh.rotation.y += 0.02;
    for (const e of entities) {
      if (e.role !== 'survivor' || !e.alive) continue;
      if (e.hp >= CFG.HP_MAX) continue;
      if (Math.hypot(e.x - m.x, e.z - m.z) < 1.8) {
        e.hp = Math.min(CFG.HP_MAX, e.hp + CFG.MEDKIT_HEAL);
        m.active = false; m.mesh.visible = false; m.respawnAt = now + CFG.MEDKIT_RESPAWN;
        if (e.isHuman) { toast('➕ Kit médico! +' + CFG.MEDKIT_HEAL + ' vida'); updateHud(); }
        break;
      }
    }
  }
}

/* ===========================================================================
 *  Fim de partida + economia
 * ======================================================================== */
function timeUp() { if (!match.over) endMatch('sobreviventes'); }

function endMatch(winnerSide) {
  match.over = true;
  document.exitPointerLock();
  const assassinWon = winnerSide === 'assassino';

  // recompensa do humano:
  //  +15 por participar  ·  +1 por morte (Lucas ganha +2 extra por soco)
  //  +40 se vencer como assassino  ·  +20 se sobreviver e vencer
  let gained = 15;
  if (me.role === 'assassin') {
    gained += me.moneyEarned;            // +1 por morte e bônus do Lucas, ja somados
    if (assassinWon) gained += 40;
  } else if (!assassinWon && me.alive) {
    gained += 20;
  }
  setMoney(getMoney() + gained);

  // resumo
  $('result-title').textContent = assassinWon ? '🔪 Assassino venceu!' : '🏃 Sobreviventes venceram!';
  const box = $('result-summary'); box.innerHTML = '';
  const p = document.createElement('p'); p.className = 'sub';
  p.textContent = me.role === 'assassin'
    ? `Você (assassino) fez ${me.kills} morte(s).`
    : (me.alive ? 'Você sobreviveu!' : 'Você foi pego.');
  box.appendChild(p);
  const line = document.createElement('div'); line.className = 'line';
  line.innerHTML = `<span>Recompensa</span><span class="g">+R$${gained} → R$${getMoney()}</span>`;
  box.appendChild(line);

  setTimeout(() => showScreen('result'), 800);
}

/* ===========================================================================
 *  HUD
 * ======================================================================== */
function updateHud() {
  if (!me) return;
  const pct = Math.max(0, me.hp) / CFG.HP_MAX * 100;
  $('hpbar').style.width = pct + '%';
  $('hpbar').style.background = pct > 50 ? '#4affa3' : pct > 25 ? '#ffd24a' : '#ff5a5a';
  $('hptext').textContent = me.role === 'assassin' ? '∞' : Math.max(0, Math.round(me.hp)) + ' HP';
  $('hpbar-wrap').style.display = me.role === 'assassin' ? 'none' : 'block';

  const survAlive = entities.filter(e => e.role === 'survivor' && e.alive).length;
  $('alive-count').textContent = `Sobreviventes vivos: ${survAlive}`;

  let txt;
  if (me.role === 'assassin') txt = `CLIQUE/ESPAÇO: soco · Q: especial (${me.def.name})`;
  else if (me.char === 'hacker') txt = `Hacker · ESPAÇO: usar próximo poder · Q: marcar`;
  else if (me.activePower === 'mark') txt = `Q: marcar · ESPAÇO: teleporte (${me.powerUses})`;
  else if (me.activePower === 'none') txt = 'Sem poder · corra e pegue kits médicos';
  else if (me.activePower === 'lua') txt = 'Lua: veloz (congela às vezes)';
  else txt = `ESPAÇO: ${POWER_LABEL[me.activePower]} (${me.powerUses})`;
  $('power-bar').textContent = txt;
}

function addKillFeed(text) {
  const k = document.createElement('div'); k.className = 'k'; k.textContent = text;
  $('kill-feed').prepend(k); setTimeout(() => k.remove(), 6000);
}

/* ===========================================================================
 *  LOOP PRINCIPAL
 * ======================================================================== */
let prevT = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt = Math.min(0.05, (now - prevT) / 1000); prevT = now;

  if (match && !match.over) {
    updateHuman(dt);
    for (const e of entities) if (!e.isHuman && e.alive) botAI(e, dt);
    updateMedkits();

    // clones se movem e somem
    for (let i = match.clones.length - 1; i >= 0; i--) {
      const c = match.clones[i];
      c.x += c.vx * 5 * dt; c.z += c.vz * 5 * dt;
      [c.x, c.z] = collide(c.x, c.z);
      if (now > c.life) { scene.remove(c.vis.group); match.clones.splice(i, 1); }
      else { c.vis.group.position.set(c.x, 0, c.z); c.vis.group.rotation.y = c.rot; }
    }

    // posiciona meshes
    for (const e of entities) {
      e.vis.group.position.set(e.x, 0, e.z);
      e.vis.group.rotation.y = e.rot;
      const invis = e.invisibleUntil > now;
      // hacker enxerga invisiveis; senao ficam quase transparentes
      const seeThrough = me.char === 'hacker';
      e.vis.group.visible = e.alive && (!invis || e.isHuman || seeThrough);
      e.vis.body.material.transparent = invis;
      e.vis.body.material.opacity = invis ? (e.isHuman || seeThrough ? 0.4 : 0) : 1;
      if (e.role === 'survivor') e.label.visible = e.alive && !invis;
    }

    // timer
    const left = Math.max(0, match.endsAt - now);
    $('hud-timer').textContent = Math.ceil(left / 1000) + 's';
    if (left <= 0) timeUp();
    updateHud();

    // camera 3a pessoa
    const camDist = 9, camH = 6.2;
    const cx = me.x + Math.sin(me.rot) * camDist, cz = me.z + Math.cos(me.rot) * camDist;
    camera.position.lerp(new THREE.Vector3(cx, camH, cz), 0.2);
    camera.lookAt(me.x - Math.sin(me.rot) * 4, 1.6, me.z - Math.cos(me.rot) * 4);
  }

  renderer.render(scene, camera);
}

/* ===========================================================================
 *  LOJA / LOBBY
 * ======================================================================== */
function renderShop() {
  const owned = getOwned();
  const shop = $('shop'); shop.innerHTML = '';
  for (const [key, ch] of Object.entries(SURV)) {
    const have = owned.includes(key) || ch.price === 0;
    const sel = sess.myChar === key;
    const el = document.createElement('div');
    el.className = 'item' + (sel ? ' owned' : '');
    el.innerHTML = `<div class="nm">${ch.name}</div><div class="pw">${ch.desc}</div>
      <div class="pr">${have ? (sel ? 'Selecionado ✓' : 'Selecionar') : 'R$' + ch.price}</div>`;
    el.onclick = () => {
      if (!have) {
        if (getMoney() < ch.price) return toast('Dinheiro insuficiente (R$' + ch.price + ').');
        setMoney(getMoney() - ch.price); setOwned([...getOwned(), key]); toast('Comprado: ' + ch.name);
      }
      sess.myChar = key; renderShop();
    };
    shop.appendChild(el);
  }
  $('choose-power').classList.toggle('hidden', sess.myChar !== 'powerbest');

  const ashop = $('assassin-shop'); ashop.innerHTML = '';
  for (const [key, a] of Object.entries(ASSA)) {
    const sel = sess.pickAssassin === key;
    const el = document.createElement('div');
    el.className = 'item' + (sel ? ' owned' : '');
    el.innerHTML = `<div class="nm">${a.name}</div><div class="pw">${a.desc}</div>
      <div class="pr">${sel ? 'Selecionado ✓' : 'Escolher'}</div>`;
    el.onclick = () => { sess.pickAssassin = key; renderShop(); };
    ashop.appendChild(el);
  }
}

/* ===========================================================================
 *  BOOT
 * ======================================================================== */
addEventListener('load', () => {
  if (typeof THREE === 'undefined') {
    document.body.innerHTML = '<p style="color:#fff;padding:30px;font-family:sans-serif">Erro: Three.js não carregou. Abra a pasta inteira (com js/three.min.js).</p>';
    return;
  }
  initThree();
  setupInput();
  $('money').textContent = getMoney();

  $('btn-enter').onclick = () => {
    sess.name = ($('name-input').value.trim() || 'Jogador').slice(0, 16);
    showScreen('lobby'); renderShop();
  };
  $('chosen-power').onchange = e => sess.chosenPower = e.target.value;
  $('bot-count').onchange = e => sess.botCount = parseInt(e.target.value, 10);
  $('force-assassin').onchange = e => sess.forceAssassin = e.target.checked;
  $('btn-start').onclick = () => startMatch();
  $('btn-back').onclick = () => { showScreen('lobby'); renderShop(); };

  showScreen('login');
});
