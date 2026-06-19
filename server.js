// ============================================================================
//  FUGA 3D - servidor de jogo (multiplayer autoritativo)
//  Fases: LOBBY -> DESENHO -> VOTACAO -> FUGA -> RESULTADO -> LOBBY ...
// ============================================================================
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const io = new Server(server);

// ----------------------------------------------------------------------------
//  Regras de economia e configuracao
// ----------------------------------------------------------------------------
const CONFIG = {
  MIN_PLAYERS: 3,
  START_MONEY: 100,
  MAX_MONEY: 1000,
  REWARD_PARTICIPATE: 15,
  REWARD_SURVIVE_WIN: 20,
  REWARD_ASSASSIN_WIN: 40,
  REWARD_PER_KILL: 1,
  KILL_RANGE: 3.5,
  ATTACK_COOLDOWN_MS: 1200,
  ARENA_HALF: 38, // metade do tamanho do mapa
  TICK_MS: 60,    // envio do estado (~16 Hz)
};

// Duracao das fases (ms)
const PHASE_MS = {
  LOBBY_COUNTDOWN: 5000,
  DESENHO: 45000,
  VOTACAO: 22000,
  FUGA: 180000, // 3 minutos
  RESULTADO: 12000,
};

// Loja de personagens/poderes. Preco escala ate 1000.
//  power:  none | lua | mark | invisible | stun | control | choose
const CHARACTERS = {
  classico:  { name: 'Clássico',       price: 0,    power: 'none',     uses: 0, color: '#4aa3ff' },
  lua:       { name: 'Lua',            price: 100,  power: 'lua',      uses: 0, color: '#c9c9ff' },
  artist:    { name: 'The Artist',     price: 250,  power: 'mark',     uses: 5, color: '#ffd24a' },
  bester:    { name: 'The Bester',     price: 450,  power: 'invisible',uses: 3, color: '#9b7bff' },
  adm:       { name: 'The Adm',        price: 650,  power: 'stun',     uses: 3, color: '#4affa3' },
  pro:       { name: 'The Pro',        price: 850,  power: 'control',  uses: 1, color: '#ff7b4a' },
  powerbest: { name: 'The Power Best', price: 1000, power: 'choose',   uses: 3, color: '#ff4af0' },
};

const POWER_LABEL = {
  none: 'Sem poder',
  lua: 'Lua: corre rápido mas congela 1s a cada 10s',
  mark: 'The Artist: marca um ponto e volta pra ele (5x)',
  invisible: 'The Bester: fica invisível por 5s (3x)',
  stun: 'The Adm: atordoa o assassino por perto (3x)',
  control: 'The Pro: congela o assassino por 10s (1x)',
  choose: 'The Power Best: escolhe invisível / atordoar / congelar',
};

// ----------------------------------------------------------------------------
//  Persistencia simples do dinheiro (por nome, em arquivo JSON)
// ----------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const WALLET_FILE = path.join(DATA_DIR, 'wallets.json');
let wallets = {};
try {
  if (fs.existsSync(WALLET_FILE)) wallets = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
} catch { wallets = {}; }

function saveWallets() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallets, null, 2));
  } catch (e) { /* ignora erro de disco */ }
}
function walletKey(name) { return String(name || '').trim().toLowerCase().slice(0, 24); }
function getMoney(name) {
  const k = walletKey(name);
  if (wallets[k] == null) wallets[k] = CONFIG.START_MONEY;
  return wallets[k];
}
function addMoney(name, amount) {
  const k = walletKey(name);
  const v = Math.max(0, Math.min(CONFIG.MAX_MONEY, getMoney(name) + amount));
  wallets[k] = v;
  return v;
}

// ----------------------------------------------------------------------------
//  Estado do jogo (uma sala global para simplicidade)
// ----------------------------------------------------------------------------
const players = new Map(); // socketId -> player

function makeSpawn(i) {
  const a = (i / 8) * Math.PI * 2;
  return { x: Math.cos(a) * 18, z: Math.sin(a) * 18 };
}

const game = {
  phase: 'LOBBY',
  phaseEndsAt: 0,
  assassinId: null,
  markedId: null,      // jogador "mais feio" (alvo destacado)
  drawings: {},        // id -> dataURL
  votes: {},           // voterId -> targetId
  killsByAssassin: 0,
  winnerSide: null,    // 'assassinos' | 'sobreviventes'
};

function alivePlayers() {
  return [...players.values()].filter(p => p.inMatch && p.alive);
}
function aliveSurvivors() {
  return alivePlayers().filter(p => p.id !== game.assassinId);
}
function matchPlayers() {
  return [...players.values()].filter(p => p.inMatch);
}

// ----------------------------------------------------------------------------
//  Transicoes de fase
// ----------------------------------------------------------------------------
function setPhase(phase, durationMs) {
  game.phase = phase;
  game.phaseEndsAt = Date.now() + durationMs;
  io.emit('phase', { phase, endsAt: game.phaseEndsAt, durationMs });
}

function tryStartCountdown() {
  if (game.phase !== 'LOBBY') return;
  const ready = [...players.values()].filter(p => p.ready);
  if (ready.length >= CONFIG.MIN_PLAYERS) {
    setPhase('LOBBY', PHASE_MS.LOBBY_COUNTDOWN);
    game.countdown = true;
    io.emit('sys', `Começando em ${PHASE_MS.LOBBY_COUNTDOWN / 1000}s...`);
  }
}

function startMatch() {
  game.countdown = false;
  // Quem entra na partida: jogadores prontos (ou todos se >=min prontos)
  const participants = [...players.values()].filter(p => p.ready);
  if (participants.length < CONFIG.MIN_PLAYERS) { setPhase('LOBBY', 1); game.phase = 'LOBBY'; return; }

  game.drawings = {};
  game.votes = {};
  game.markedId = null;
  game.killsByAssassin = 0;
  game.winnerSide = null;

  // Sorteia o assassino com peso pelo dinheiro acumulado (quem ganhou mais
  // tem mais chance de ser o assassino).
  let total = 0;
  const weights = participants.map(p => {
    const w = 1 + getMoney(p.name) / 100; // 100 reais = +1 de peso
    total += w;
    return w;
  });
  let r = Math.random() * total;
  let assassinIndex = 0;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { assassinIndex = i; break; } }
  game.assassinId = participants[assassinIndex].id;

  participants.forEach((p, i) => {
    p.inMatch = true;
    p.alive = true;
    p.isAssassin = (p.id === game.assassinId);
    p.frozenUntil = 0;
    p.invisibleUntil = 0;
    p.mark = null;
    const ch = CHARACTERS[p.character] || CHARACTERS.classico;
    // The Power Best usa o poder escolhido; senao usa o do personagem.
    p.activePower = ch.power === 'choose' ? (p.chosenPower || 'invisible') : ch.power;
    p.powerUses = ch.uses;
    const sp = makeSpawn(i);
    p.x = sp.x; p.z = sp.z; p.rot = 0;
    p.lastAttack = 0;
  });
  // Nao-prontos ficam de fora (espectadores)
  [...players.values()].filter(p => !p.ready).forEach(p => { p.inMatch = false; p.alive = false; });

  io.emit('matchStart', { assassinId: game.assassinId, you: null });
  setPhase('DESENHO', PHASE_MS.DESENHO);
}

function startVoting() { setPhase('VOTACAO', PHASE_MS.VOTACAO); }

function resolveVotesAndStartChase() {
  // Conta votos -> jogador mais votado vira o "marcado" (alvo destacado).
  const counts = {};
  Object.values(game.votes).forEach(t => { if (t) counts[t] = (counts[t] || 0) + 1; });
  let best = null, bestN = 0;
  for (const [id, n] of Object.entries(counts)) { if (n > bestN) { bestN = n; best = id; } }
  game.markedId = best;
  if (best && players.has(best)) io.emit('sys', `${players.get(best).name} foi votado como o desenho mais feio! Corre! 😱`);
  setPhase('FUGA', PHASE_MS.FUGA);
}

function endMatch(reason) {
  // Define vencedor
  const survivors = aliveSurvivors();
  const assassinWon = survivors.length === 0;
  game.winnerSide = assassinWon ? 'assassinos' : 'sobreviventes';

  const summary = [];
  matchPlayers().forEach(p => {
    let gained = CONFIG.REWARD_PARTICIPATE; // todos que participaram
    if (p.isAssassin) {
      gained += game.killsByAssassin * CONFIG.REWARD_PER_KILL;
      if (assassinWon) gained += CONFIG.REWARD_ASSASSIN_WIN;
    } else if (!assassinWon && p.alive) {
      gained += CONFIG.REWARD_SURVIVE_WIN;
    }
    const money = addMoney(p.name, gained);
    summary.push({ name: p.name, isAssassin: p.isAssassin, alive: p.alive, gained, money });
    const sock = io.sockets.sockets.get(p.id);
    if (sock) sock.emit('wallet', { money });
  });
  saveWallets();

  // Reset de prontidao para a proxima
  players.forEach(p => { p.ready = false; p.inMatch = false; p.alive = false; p.isAssassin = false; });
  game.assassinId = null;

  io.emit('matchEnd', { winnerSide: game.winnerSide, reason, summary });
  setPhase('RESULTADO', PHASE_MS.RESULTADO);
}

// Loop principal de fases
setInterval(() => {
  const now = Date.now();
  if (now < game.phaseEndsAt && game.phase !== 'LOBBY') {
    // Verifica fim antecipado da FUGA (todos sobreviventes mortos)
    if (game.phase === 'FUGA' && aliveSurvivors().length === 0) endMatch('Todos os sobreviventes foram pegos!');
    return;
  }
  switch (game.phase) {
    case 'LOBBY':
      if (game.countdown && now >= game.phaseEndsAt) startMatch();
      break;
    case 'DESENHO': startVoting(); break;
    case 'VOTACAO': resolveVotesAndStartChase(); break;
    case 'FUGA': endMatch('Tempo esgotado — sobreviventes escaparam!'); break;
    case 'RESULTADO':
      game.phase = 'LOBBY';
      game.phaseEndsAt = 0;
      io.emit('phase', { phase: 'LOBBY', endsAt: 0 });
      tryStartCountdown();
      break;
  }
}, 250);

// Broadcast do estado de movimento durante a FUGA
setInterval(() => {
  if (game.phase !== 'FUGA') return;
  const now = Date.now();
  const snap = matchPlayers().map(p => ({
    id: p.id, name: p.name, x: p.x, z: p.z, rot: p.rot,
    alive: p.alive, isAssassin: p.isAssassin,
    invisible: p.invisibleUntil > now,
    frozen: p.frozenUntil > now,
    marked: p.id === game.markedId,
    color: (CHARACTERS[p.character] || CHARACTERS.classico).color,
  }));
  io.emit('snapshot', { t: now, players: snap, assassinId: game.assassinId });
}, CONFIG.TICK_MS);

// ----------------------------------------------------------------------------
//  Conexoes
// ----------------------------------------------------------------------------
function publicLobby() {
  return [...players.values()].map(p => ({
    id: p.id, name: p.name, ready: p.ready,
    character: p.character, money: getMoney(p.name),
  }));
}
function broadcastLobby() { io.emit('lobby', { players: publicLobby(), phase: game.phase }); }

io.on('connection', (socket) => {
  const player = {
    id: socket.id, name: 'Jogador', ready: false,
    character: 'classico', chosenPower: 'invisible',
    inMatch: false, alive: false, isAssassin: false,
    x: 0, z: 0, rot: 0, mark: null,
    frozenUntil: 0, invisibleUntil: 0, lastAttack: 0,
    activePower: 'none', powerUses: 0,
  };
  players.set(socket.id, player);

  socket.emit('hello', {
    id: socket.id,
    config: { MIN_PLAYERS: CONFIG.MIN_PLAYERS, MAX_MONEY: CONFIG.MAX_MONEY, ARENA_HALF: CONFIG.ARENA_HALF },
    characters: CHARACTERS,
    powerLabels: POWER_LABEL,
  });

  socket.on('join', ({ name }) => {
    player.name = (String(name || 'Jogador').trim().slice(0, 16)) || 'Jogador';
    socket.emit('wallet', { money: getMoney(player.name) });
    broadcastLobby();
  });

  socket.on('buy', ({ character, chosenPower }) => {
    if (game.phase !== 'LOBBY') return socket.emit('sys', 'Só dá pra comprar no lobby.');
    const ch = CHARACTERS[character];
    if (!ch) return;
    const money = getMoney(player.name);
    if (character !== 'classico' && player.character === character) {
      // ja tem; so troca o poder escolhido se for o power best
    }
    if (money < ch.price && player.character !== character) {
      return socket.emit('sys', `Dinheiro insuficiente. Precisa de R$${ch.price}.`);
    }
    // Cobra apenas se ainda nao tiver esse personagem
    if (player.character !== character && ch.price > 0) addMoney(player.name, -ch.price);
    player.character = character;
    if (ch.power === 'choose' && chosenPower) player.chosenPower = chosenPower;
    socket.emit('wallet', { money: getMoney(player.name) });
    socket.emit('bought', { character, chosenPower: player.chosenPower });
    broadcastLobby();
  });

  socket.on('ready', ({ ready }) => {
    if (game.phase !== 'LOBBY') return;
    player.ready = !!ready;
    broadcastLobby();
    tryStartCountdown();
  });

  socket.on('drawing', ({ dataURL }) => {
    if (game.phase !== 'DESENHO') return;
    if (typeof dataURL === 'string' && dataURL.length < 200000) game.drawings[socket.id] = dataURL;
  });

  socket.on('getDrawings', () => {
    if (game.phase !== 'VOTACAO') return;
    const list = matchPlayers()
      .filter(p => p.id !== socket.id) // nao vota em si mesmo
      .map(p => ({ id: p.id, name: p.name, dataURL: game.drawings[p.id] || null }));
    socket.emit('drawings', list);
  });

  socket.on('vote', ({ targetId }) => {
    if (game.phase !== 'VOTACAO') return;
    if (targetId && targetId !== socket.id && players.has(targetId)) game.votes[socket.id] = targetId;
  });

  socket.on('move', ({ x, z, rot }) => {
    if (game.phase !== 'FUGA' || !player.inMatch || !player.alive) return;
    if (player.frozenUntil > Date.now()) return; // congelado nao move
    const h = CONFIG.ARENA_HALF;
    player.x = Math.max(-h, Math.min(h, +x || 0));
    player.z = Math.max(-h, Math.min(h, +z || 0));
    player.rot = +rot || 0;
  });

  // Assassino ataca
  socket.on('attack', () => {
    if (game.phase !== 'FUGA' || !player.isAssassin || !player.alive) return;
    const now = Date.now();
    if (now - player.lastAttack < CONFIG.ATTACK_COOLDOWN_MS) return;
    if (player.frozenUntil > now) return;
    player.lastAttack = now;
    let nearest = null, nd = Infinity;
    for (const s of aliveSurvivors()) {
      if (s.invisibleUntil > now) continue; // invisivel nao pode ser pego
      const d = Math.hypot(s.x - player.x, s.z - player.z);
      if (d < nd) { nd = d; nearest = s; }
    }
    if (nearest && nd <= CONFIG.KILL_RANGE) {
      nearest.alive = false;
      game.killsByAssassin++;
      io.emit('kill', { killer: player.name, victim: nearest.name, victimId: nearest.id });
      const vs = io.sockets.sockets.get(nearest.id);
      if (vs) vs.emit('died');
    } else {
      socket.emit('miss');
    }
  });

  // Uso de poder pelos sobreviventes
  socket.on('power', ({ action }) => {
    if (game.phase !== 'FUGA' || !player.inMatch || !player.alive || player.isAssassin) return;
    const now = Date.now();
    const p = player.activePower;

    if (p === 'mark') {
      if (action === 'mark') { player.mark = { x: player.x, z: player.z }; return socket.emit('powerInfo', { msg: 'Ponto marcado!' }); }
      if (action === 'use') {
        if (player.powerUses <= 0 || !player.mark) return socket.emit('powerInfo', { msg: 'Sem marca ou sem usos.' });
        player.powerUses--;
        player.x = player.mark.x; player.z = player.mark.z;
        socket.emit('teleport', { x: player.x, z: player.z, uses: player.powerUses });
        return;
      }
    }

    if (action !== 'use') return;
    if (player.powerUses <= 0) return socket.emit('powerInfo', { msg: 'Sem usos restantes.' });

    if (p === 'invisible') {
      player.powerUses--;
      player.invisibleUntil = now + 5000;
      socket.emit('powerInfo', { msg: 'Invisível por 5s!', uses: player.powerUses });
    } else if (p === 'stun') {
      const assassin = players.get(game.assassinId);
      if (assassin && Math.hypot(assassin.x - player.x, assassin.z - player.z) <= 8) {
        player.powerUses--;
        assassin.frozenUntil = now + 3000;
        io.emit('sys', `${player.name} atordoou o assassino!`);
        socket.emit('powerInfo', { msg: 'Assassino atordoado!', uses: player.powerUses });
      } else {
        socket.emit('powerInfo', { msg: 'Chegue mais perto do assassino.' });
      }
    } else if (p === 'control') {
      const assassin = players.get(game.assassinId);
      if (assassin) {
        player.powerUses--;
        assassin.frozenUntil = now + 10000; // "controla" = imobiliza por 10s
        io.emit('sys', `${player.name} tomou controle do assassino por 10s!`);
        socket.emit('powerInfo', { msg: 'Assassino imobilizado 10s!', uses: player.powerUses });
      }
    } else {
      socket.emit('powerInfo', { msg: 'Esse personagem não tem poder ativo.' });
    }
  });

  socket.on('chat', ({ text }) => {
    const t = String(text || '').slice(0, 120);
    if (t) io.emit('chat', { name: player.name, text: t });
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    if (game.assassinId === socket.id && game.phase === 'FUGA') {
      // assassino saiu: sobreviventes vencem
      endMatch('O assassino saiu da partida.');
    }
    broadcastLobby();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Fuga 3D rodando em http://localhost:${PORT}`));
