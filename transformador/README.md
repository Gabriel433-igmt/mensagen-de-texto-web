# 💡 Transformador de Ideias

Um app de PC onde você **escreve uma ideia**, **escolhe um app** e ele
**transforma a ideia** naquilo que o app escolhido faz: uma redação, um jogo,
uma história, uma música, um código, um plano e muito mais.

São **30 transformadores** prontos — e ainda dá para mandar a ideia para um
**programa externo do seu PC**.

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

## 🧩 Os 30 apps disponíveis

| Texto | Texto | Interativo (HTML) |
|-------|-------|-------------------|
| 📝 Redação | 🏷️ Slogans | 🎮 Jogo da Forca |
| 📖 História | 🔤 Nomes de Marca | 🧠 Quiz |
| 🪶 Poema | 🧮 Análise FOFA (SWOT) | 🧩 Jogo da Memória |
| ✅ Plano de Ação | 🎤 Pitch de Elevador | |
| 📊 Apresentação | 💬 FAQ | |
| 🧾 Resumo | 📚 Tutorial | |
| ✉️ E-mail Formal | 👅 Trava-Língua | |
| 📱 Post de Rede Social | 🎰 Banner em ASCII | |
| 🍲 Receita | 🔐 Senha-Tema | |
| 🎬 Roteiro de Vídeo | 😀 História em Emoji | |
| 🎵 Letra de Música | ❓ Charada | |
| ⚖️ Debate (prós e contras) | 📅 Cronograma | |
| 📣 Anúncio | 💻 Código (Python) | |
| 🗺️ Mapa Mental | | |

Mais a opção **📂 App do meu PC**: escolhe um programa instalado (ex.: um
editor de texto) e o Transformador salva a ideia num arquivo e abre o programa
com ela.

---

## 🛠️ Como funciona por dentro

| Arquivo | O que faz |
|---------|-----------|
| `transformadores.py` | Núcleo: utilidades + transformadores básicos |
| `transformadores_extra.py` | Transformadores extras (quiz, memória, música...) |
| `transformadores_extra2.py` | Mais transformadores (slogan, FOFA, FAQ...) |
| `transformador_de_ideias.py` | Interface gráfica (janela) — com fallback p/ terminal |
| `transformador_cli.py` | Modo terminal |
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
