# 🔪 Fuga 3D

Jogo **3D** de fuga (estilo *Forsaken*) que roda **só abrindo um arquivo** no
navegador. **Não precisa instalar nada, não precisa de servidor.** É offline,
com **bots**: você sobrevive (ou é o assassino) numa arena 3D, usa poderes,
pega kits médicos e se esconde.

---

## ▶️ Como jogar (baixar e rodar)

1. Baixe a pasta do projeto (no GitHub: botão verde **`< > Code` → Download
   ZIP**) e **extraia**.
2. Dê **dois cliques no `index.html`** (ou arraste para o navegador).
3. Pronto! Coloque seu nome e jogue.

> Funciona offline porque o Three.js já vem junto em `js/three.min.js`.
> Recomendado: Chrome, Edge ou Firefox atualizados.

---

## 🎮 Controles

| Tecla | Ação |
|------|------|
| **W A S D / setas** | Andar |
| **Mouse** | Olhar (clique na tela para travar o mouse) |
| **Espaço / clique** | Sobrevivente: usar poder · Assassino: dar soco |
| **Q** | Marcar ponto (teleporte) · Assassino: poder especial |

Kits médicos (➕) ficam pelo mapa — passe por cima para curar. As **moitas
verdes** servem de esconderijo: dentro delas o assassino tem dificuldade de te
ver.

---

## 💰 Economia (salva no seu navegador)

Você começa com **R$100** (máximo **R$1000**). O dinheiro fica salvo no
navegador (`localStorage`).

| Ação | Recompensa |
|------|-----------|
| Participar de uma partida | **+R$15** |
| Sobreviver e vencer | **+R$20** |
| Vencer como assassino | **+R$40** |
| Cada morte feita pelo assassino | **+R$1** |

O assassino é **sorteado** com peso pelo seu dinheiro: quanto mais você tem,
maior a chance de ser o assassino (ou marque "Jogar como assassino" no lobby).

---

## 🦸 Personagens sobreviventes (loja)

| Personagem | Preço | Poder |
|-----------|------|-------|
| Clássico | Grátis | Sem poder |
| Lua | R$100 | Corre rápido, mas congela 1s a cada 10s |
| The Artist | R$250 | Marca um ponto (Q) e volta pra ele (5x) |
| The Bester | R$450 | Fica invisível 5s (3x) |
| The Adm | R$650 | Atordoa o assassino que estiver perto (3x) |
| The Pro | R$850 | Congela o assassino por 10s (1x) |
| The Power Best | R$900 | Escolhe um dos 3 poderes acima |
| **The Hacker** | R$1000 | Usa **todos** os poderes 1x cada e **enxerga invisíveis** |

## 🔪 Assassinos (cada um com um poder)

| Assassino | Especial |
|-----------|----------|
| Free | Soco básico |
| **Lucas** | Cada soco ganha dinheiro e velocidade |
| **Ilusionista** | Q cria clones que confundem os bots |
| **Marcador** | Marca alguém; se tirou +50% da vida em 10s, **mata na hora** |

---

## 🛠️ Arquivos

| Arquivo | O que faz |
|---------|-----------|
| `index.html` | Página do jogo (telas e HUD) |
| `js/game.js` | Todo o jogo: 3D, bots, vida, poderes, economia |
| `js/three.min.js` | Motor 3D (Three.js) embutido para rodar offline |
| `css/style.css` | Estilo |

### O que ainda dá pra melhorar
- É **um jogador + bots** (offline). Multiplayer online de verdade precisaria
  de um servidor — dá pra adicionar depois.
- "Controlar o assassino" (The Pro) está como **congelar** por 10s.
- Os bots são simples (fogem/perseguem). Dá pra deixar a IA mais esperta.

Bom jogo! 🎉
