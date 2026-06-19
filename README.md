# 🔪 Fuga 3D

Jogo **3D online (multiplayer)** no navegador, no estilo *Forsaken*: cada
rodada tem uma fase de **desenho**, uma **votação do desenho mais feio** e
uma **fuga de 3 minutos** onde os sobreviventes correm de um **assassino**.

> ⚠️ **Estado:** é uma **base jogável e funcional** (protótipo), não um jogo
> AAA finalizado. Tem o ciclo completo de partida, economia e poderes
> funcionando. Dá pra evoluir gráficos, mapas, anti-cheat e poderes a partir
> daqui.

---

## ▶️ Como rodar

Precisa do **Node.js 18+**.

```bash
npm install
npm start
```

Abra **http://localhost:3000** no navegador. Para jogar de verdade (mín. 3
jogadores), abra **3 ou mais abas/aparelhos** apontando para o mesmo endereço.

Para outras pessoas entrarem pela internet, hospede o `server.js` (Render,
Railway, uma VPS, etc.) e compartilhe o link.

---

## 🎮 Como joga

1. **Entre** com um nome. Você começa com **R$100** (máx. **R$1000**).
2. No **lobby**, compre um personagem na loja e clique em **Ficar pronto**.
   Quando houver **3+ prontos**, a partida começa.
3. **Desenho:** desenhe algo (45s).
4. **Votação:** vote no **desenho mais feio**. O mais votado vira o **alvo
   destacado** (brilha) e precisa fugir.
5. **Fuga (3 min):** um **assassino** (sorteado) caça todos. Sobreviventes
   usam seus poderes pra escapar.
   - Mover: **WASD / setas** · Olhar: **mouse** (clique pra travar o mouse)
   - Sobrevivente: **Espaço** usa o poder · Assassino: **Espaço / clique** ataca
6. **Vitória:** se o assassino pega todos → assassino vence. Se sobrar alguém
   no tempo → sobreviventes vencem.

### 💰 Economia

| Ação | Recompensa |
|------|-----------|
| Participar | **+R$15** |
| Sobreviver e vencer | **+R$20** |
| Vencer como assassino | **+R$40** |
| Cada morte feita pelo assassino | **+R$1** |

O dinheiro é **salvo por nome** (arquivo `data/wallets.json`).

### 🦸 Personagens / poderes (loja)

| Personagem | Preço | Poder |
|-----------|------|-------|
| Clássico | Grátis | Sem poder |
| Lua | R$100 | Corre mais rápido, mas congela 1s a cada 10s |
| The Artist | R$250 | Marca um ponto e volta pra ele (5x) |
| The Bester | R$450 | Fica invisível por 5s (3x) |
| The Adm | R$650 | Atordoa o assassino que estiver perto (3x) |
| The Pro | R$850 | Congela ("controla") o assassino por 10s (1x) |
| The Power Best | R$1000 | Escolhe um dos 3 poderes acima |

O **assassino é sorteado** com peso pelo dinheiro acumulado: quem ganhou mais
tem mais chance de ser o assassino.

---

## 🛠️ Arquitetura

| Arquivo | O que faz |
|---------|-----------|
| `server.js` | Servidor autoritativo (Node + Socket.io): fases, economia, sorteio do assassino, mortes e poderes |
| `public/index.html` | Telas (login, lobby/loja, desenho, votação, resultado) e HUD |
| `public/css/style.css` | Estilo |
| `public/js/main.js` | Cliente 3D (Three.js): cena, movimento, câmera, rede |

### Notas técnicas / limitações conhecidas

- O movimento é reportado pelo cliente (sem anti-cheat). As **mortes** e os
  **poderes** são validados no servidor (distância/cooldown/usos).
- "Controlar o assassino" (The Pro) está implementado como **imobilizar** o
  assassino por 10s — controle direto exigiria mais sincronização.
- É **uma sala global** (todos no mesmo jogo). Dá pra evoluir pra várias salas.

Bom jogo! 🎉
