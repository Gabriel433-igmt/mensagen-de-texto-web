# 🔪 Fuga 3D — Online (P2P)

Jogo **3D online** estilo *Forsaken* que roda **só abrindo um arquivo** no
navegador. O multiplayer é **P2P (WebRTC)**: um jogador **cria a sala** e vira
o host, os outros **entram com um código**. **Não precisa instalar nada e não
precisa de servidor próprio** — a conexão usa o broker gratuito do PeerJS só
para os jogadores se acharem; o jogo em si vai direto entre os navegadores.

> ⚠️ É uma **base jogável** (protótipo), não um jogo AAA finalizado. O ciclo
> completo (sala, partida, vida, poderes, economia) funciona.

---

## ▶️ Como jogar (baixar e rodar)

1. Baixe a pasta no GitHub: **`< > Code` → Download ZIP** e **extraia**.
2. Dê **dois cliques no `index.html`** (ou arraste para o navegador).
3. Coloque seu nome.

**Para criar uma sala:** clique em **Criar sala** → aparece um **código** →
mande para os amigos.
**Para entrar:** clique em **Entrar na sala**, cole o código e conecte.

Quando todo mundo estiver na sala, o **host** clica em **Iniciar partida**.
Mínimo de **3 jogadores** — se faltar gente, **bots** completam.

> Precisa de **internet** (mesmo abrindo o arquivo local), porque é online.
> Em algumas redes muito restritas (firewall corporativo/escola) a conexão
> WebRTC pode falhar — nesse caso, tente outra rede.

---

## 🎮 Controles

| Tecla | Ação |
|------|------|
| **W A S D / setas** | Andar |
| **Mouse** | Olhar (clique na tela para travar o mouse) |
| **Espaço / clique** | Sobrevivente: poder · Assassino: soco |
| **Q** | Marcar ponto (teleporte) · Assassino: poder especial |

Kits médicos (➕) curam ao passar por cima. **Moitas verdes** = esconderijo
(o assassino tem dificuldade de te ver dentro delas).

---

## 💰 Economia (salva no navegador)

Começa com **R$100** (máx. **R$1000**).

| Ação | Recompensa |
|------|-----------|
| Participar | **+R$15** |
| Sobreviver e vencer | **+R$20** |
| Vencer como assassino | **+R$40** |
| Cada morte do assassino | **+R$1** |

O assassino é **sorteado** com peso pelo dinheiro de cada um.

## 🦸 Personagens (sobreviventes)

| Personagem | Preço | Poder |
|-----------|------|-------|
| Clássico | Grátis | Sem poder |
| Lua | R$100 | Veloz, mas congela 1s a cada 10s |
| The Artist | R$250 | Marca ponto (Q) e volta (5x) |
| The Bester | R$450 | Invisível 5s (3x) |
| The Adm | R$650 | Atordoa o assassino perto (3x) |
| The Pro | R$850 | Congela o assassino 10s (1x) |
| The Power Best | R$900 | Escolhe um dos 3 poderes |
| The Hacker | R$1000 | Usa todos os poderes 1x e enxerga invisíveis |

## 🔪 Assassinos

| Assassino | Especial |
|-----------|----------|
| Free | Soco básico |
| Lucas | Cada soco ganha dinheiro e velocidade |
| Ilusionista | Q cria clones que confundem os bots |
| Marcador | Marca alguém; se tirou +50% da vida em 10s, mata na hora |

---

## 🛠️ Arquivos

| Arquivo | O que faz |
|---------|-----------|
| `index.html` | Telas (login, criar/entrar sala, lobby, resultado) e HUD |
| `js/game.js` | Jogo + rede P2P (host autoritativo) |
| `js/three.min.js` | Motor 3D (embutido, offline) |
| `js/peerjs.min.js` | WebRTC/sinalização (embutido) |
| `css/style.css` | Estilo |

### Como o online funciona (resumo técnico)
- Quem **cria a sala** roda a simulação (host autoritativo) e envia o estado
  ~15x/s para os outros; os outros mandam só os comandos (mover/agir).
- Conexão direta entre navegadores via **WebRTC**; o broker do PeerJS é usado
  apenas para trocar o "endereço" inicial.
- Limitações: sem anti-cheat (o host confia nos comandos), sem previsão de
  movimento no cliente (pode ter um pequeno atraso conforme a latência), e
  "controlar o assassino" (The Pro) está como **congelar 10s**.

Bom jogo! 🎉
