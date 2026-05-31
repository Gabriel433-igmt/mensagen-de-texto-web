# 💡 Transformador de Ideias

Um app de PC onde você **escreve uma ideia**, **escolhe um app** e ele
**transforma a ideia** naquilo que o app escolhido faz: uma redação, um jogo,
uma história, uma música, um código, um plano e muito mais.

São **40 transformadores** prontos — incluindo vários para **aumentar a
criatividade** — e você ainda pode **criar os seus próprios** sem programar,
ou mandar a ideia para um **programa externo do seu PC**.

---

## ⬇️ Como baixar (SEM git)

Você não precisa do git. Para baixar tudo de uma vez:

1. Abra o repositório no GitHub.
2. Clique no botão verde **`< > Code`** (no topo da lista de arquivos).
3. Clique em **`Download ZIP`**.
4. **Extraia** o arquivo `.zip` (botão direito → "Extrair tudo").
5. Pronto! Dentro da pasta extraída está o app inteiro.

Depois é só rodar o instalador (abaixo) ou abrir o `transformador_de_ideias.py`.

---

## 🚀 Instalação fácil (instala tudo que precisa)

O instalador verifica/instala o **Python** (que já vem com a interface gráfica
**Tkinter**) e cria um **atalho** para abrir o app.

### Windows
1. Baixe esta pasta.
2. Clique duas vezes em **`instalar.bat`**.
3. Siga as instruções na tela. Pronto! Use o atalho na Área de Trabalho.

### Linux / macOS
```bash
chmod +x instalar.sh
./instalar.sh
```

> Não tem nenhuma biblioteca externa para baixar — o app usa só o que já vem
> com o Python. O instalador cuida do resto.

---

## ▶️ Como rodar (sem instalador)

Tendo o Python 3 instalado:

```bash
python3 transformador_de_ideias.py
```

- Se o computador tiver interface gráfica (Tkinter), abre a **janela**.
- Se **não** tiver, o app cai automaticamente no **modo terminal** — então
  ele **sempre funciona**.

Para forçar o modo terminal:

```bash
python3 transformador_cli.py
```

### Instalar como comando do sistema (opcional)
```bash
pip install .
transformador-de-ideias        # abre a janela
transformador-de-ideias-cli    # modo terminal
```

---

## 🧩 Os 40 apps disponíveis

**Escrita e organização:** 📝 Redação · 📖 História · 🪶 Poema ·
✅ Plano de Ação · 📊 Apresentação · 🧾 Resumo · ✉️ E-mail Formal ·
📱 Post de Rede Social · 🍲 Receita · 🎬 Roteiro de Vídeo · 🎵 Letra de Música ·
⚖️ Debate · 📣 Anúncio · 🗺️ Mapa Mental · 💻 Código (Python) · ❓ Charada ·
📅 Cronograma · 🏷️ Slogans · 🔤 Nomes de Marca · 🧮 Análise FOFA · 🎤 Pitch ·
💬 FAQ · 📚 Tutorial · 👅 Trava-Língua · 🎰 Banner ASCII · 🔐 Senha-Tema ·
😀 História em Emoji

**🌟 Criatividade (novos!):** 🌈 Brainstorm · 🔄 SCAMPER · 🤔 E se...? ·
🎭 Personagem · 🏰 Mundo Imaginário · 📆 Desafio de 30 Dias ·
🃏 Combinador Maluco · 🛠️ Invenção · 🖼️ Logo (conceito) · 🎨 Paleta de Cores

**🎮 Interativos (geram um arquivo HTML para abrir no navegador):**
🎮 Jogo da Forca · 🧠 Quiz · 🧩 Jogo da Memória · 🎨 Paleta de Cores

Mais a opção **📂 App do meu PC**: escolhe um programa instalado (ex.: um
editor de texto) e o Transformador salva a ideia num arquivo e abre o programa
com ela.

---

## ✨ Crie suas PRÓPRIAS ideias (sem programar!)

Quer adicionar seus próprios geradores? É só criar um arquivo chamado
**`minhas_ideias.json`** na pasta do app. Use o **`minhas_ideias.json.exemplo`**
como modelo (basta copiar e renomear).

Formato:

```json
[
  {
    "nome": "Meu Gerador de Sonhos",
    "emoji": "🌟",
    "modelo": "Um dia, a ideia \"{ideia}\" virou realidade!\nComeçou com {chave1} e {chave2}."
  }
]
```

Você pode usar estes "encaixes" dentro do `modelo`:

| Encaixe | Vira... |
|---------|---------|
| `{ideia}` | o texto completo que a pessoa escreveu |
| `{titulo}` | um título curto da ideia |
| `{chave1}` ... `{chave6}` | as palavras mais importantes da ideia |

Cada item do arquivo vira um **novo app** dentro do programa. Assim qualquer
pessoa pode inventar quantas ideias quiser e soltar a criatividade! 🚀

---

## 🛠️ Como funciona por dentro

| Arquivo | O que faz |
|---------|-----------|
| `transformadores.py` | Núcleo: utilidades + transformadores básicos |
| `transformadores_extra.py` | Transformadores extras (quiz, memória, música...) |
| `transformadores_extra2.py` | Mais transformadores (slogan, FOFA, FAQ...) |
| `transformadores_criativos.py` | Transformadores de criatividade (brainstorm, SCAMPER...) |
| `transformador_de_ideias.py` | Interface gráfica (janela) — com fallback p/ terminal |
| `transformador_cli.py` | Modo terminal |
| `minhas_ideias.json.exemplo` | Modelo para você criar seus próprios geradores |
| `instalar.bat` / `instalar.sh` | Instaladores que preparam tudo |
| `pyproject.toml` | Empacotamento para `pip install .` |

Cada transformador é uma função simples que recebe a sua ideia (texto) e
devolve o resultado. Tudo funciona **offline**, sem chave de API.

---

## 💡 Exemplo

Ideia: *"um app que ajuda crianças a aprender reciclagem de forma divertida"*

- Escolhendo **Redação** → vira um texto dissertativo com introdução,
  desenvolvimento e conclusão.
- Escolhendo **Jogo da Forca** → vira um arquivo `.html` jogável no navegador.
- Escolhendo **Letra de Música** → vira uma letra com versos e refrão.

Divirta-se transformando ideias! 🎉
