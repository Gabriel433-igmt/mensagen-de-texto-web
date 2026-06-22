# 🔪 Fuga 3D — arquivo único + Firebase

O jogo inteiro está em **um único arquivo: `index.html`** (HTML, CSS, Three.js
e o jogo, tudo embutido). É um jogo 3D online estilo *Forsaken*: um jogador
**cria a sala** e os outros **entram com um código de 4 letras**. O multiplayer
usa o **Firebase Realtime Database** (funciona em qualquer rede, sem servidor
próprio e sem WebRTC).

## ▶️ Como jogar
1. Baixe o `index.html` e abra no navegador (precisa de internet, é online).
2. Coloque o nome → **Criar sala** (mostra o código) ou **Entrar na sala**.
3. O host escolhe os bots e clica **Iniciar**. Mín. 3 — bots completam.

**Controles:** WASD anda · mouse olha (clique pra travar) · ESPAÇO/clique =
poder (sobrevivente) ou soco (assassino) · Q = marcar ponto / poder do assassino.

## ⚙️ PASSO OBRIGATÓRIO — ligar o Firebase (1 vez, ~2 min)
O `index.html` já vem com as suas chaves do projeto **leiloes-de-hoteis**, mas
você precisa **ativar o Realtime Database** e **liberar as regras**:

1. [Firebase Console](https://console.firebase.google.com/) → projeto
   **leiloes-de-hoteis** → menu **Build → Realtime Database → Criar banco de dados**.
2. Em **Regras**, cole isto e publique (modo de teste, qualquer um lê/escreve):
   ```json
   { "rules": { ".read": true, ".write": true } }
   ```
3. Confira a **URL** do banco no topo da página do Realtime Database. Se **não**
   for exatamente `https://leiloes-de-hoteis-default-rtdb.firebaseio.com`
   (ex.: bancos na Europa/Ásia terminam em `.firebasedatabase.app`), edite a
   linha `databaseURL:` lá no `index.html` com a URL que aparecer.

> As regras abertas acima são só para testar — qualquer pessoa com o código
> consegue ler/escrever. Para algo sério depois, dá pra restringir por sala.

## ⚠️ Limitações
Protótipo jogável: host autoritativo (confia nos comandos, sem anti-cheat), o
estado vai pelo Firebase (~10x/s) então pode ter um pequeno atraso conforme a
internet, e "controlar o assassino" (The Pro) está como **congelar 10s**.

Bom jogo! 🎉
