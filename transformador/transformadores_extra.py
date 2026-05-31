# -*- coding: utf-8 -*-
"""
transformadores_extra.py
========================
Transformadores ADICIONAIS do app "Transformador de Ideias".

Este módulo amplia o catálogo de "apps" disponíveis. Cada função recebe uma
IDEIA (texto) e devolve um resultado pronto — texto comum ou um arquivo HTML
jogável/visual.

Assim como o módulo principal, este arquivo NÃO depende de interface gráfica,
podendo ser testado sozinho no terminal:

    python3 transformadores_extra.py "sua ideia aqui"
"""

from __future__ import annotations

import datetime
import html
import json
import random
import textwrap

# Reaproveita utilidades do núcleo (palavras-chave, título curto, etc.).
try:
    import transformadores as core
except ImportError:  # pragma: no cover - fallback se rodar de outra pasta
    import os
    import sys

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import transformadores as core


# ----------------------------------------------------------------------------
# Pequenas utilidades locais
# ----------------------------------------------------------------------------

def _chaves(ideia: str, n: int = 8) -> list[str]:
    """Atalho para palavras-chave, sempre devolvendo ao menos algumas."""
    ch = core.palavras_chave(ideia, maximo=n)
    reserva = ["ideia", "projeto", "futuro", "criar", "mundo", "tempo"]
    while len(ch) < 4:
        ch.append(reserva[len(ch) % len(reserva)])
    return ch


def _cabecalho(tipo: str, titulo: str) -> str:
    return f"{tipo}\n{titulo}\n{'=' * max(3, len(titulo))}\n\n"


def _preencher(paragrafos: list[str], largura: int = 78) -> str:
    return "\n\n".join(textwrap.fill(p, width=largura) for p in paragrafos)


# ----------------------------------------------------------------------------
# Transformador: RESUMO / PONTOS PRINCIPAIS
# ----------------------------------------------------------------------------

def gerar_resumo(ideia: str) -> str:
    """Transforma a ideia em um resumo com os pontos principais."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    pontos = [
        f"A ideia central gira em torno de {ch[0]}.",
        f"Está relacionada também a {ch[1]} e {ch[2]}.",
        f"O objetivo é gerar valor de forma simples e direta.",
        f"Pode começar pequeno e crescer com o tempo.",
        f"Funciona melhor quando há foco em {ch[3]}.",
    ]
    linhas = "\n".join(f"  • {p}" for p in pontos)
    frase = (
        f"Em uma frase: “{titulo}” busca usar {ch[0]} para melhorar "
        f"{ch[1]} de um jeito acessível."
    )
    return _cabecalho("RESUMO", titulo) + linhas + "\n\n" + textwrap.fill(frase, 78) + "\n"


# ----------------------------------------------------------------------------
# Transformador: E-MAIL FORMAL
# ----------------------------------------------------------------------------

def gerar_email(ideia: str) -> str:
    """Transforma a ideia em um e-mail formal pronto para enviar."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    corpo = [
        "Prezado(a) responsável,",
        f"Escrevo para apresentar uma proposta sobre “{titulo}”. "
        f"A ideia surgiu da necessidade de melhorar {ch[0]}, com atenção "
        f"especial a {ch[1]}.",
        f"Acredito que essa iniciativa pode trazer benefícios reais, "
        f"principalmente no que diz respeito a {ch[2]}. Estou à disposição "
        f"para detalhar os pontos e ajustar o que for necessário.",
        "Agradeço desde já a atenção e fico no aguardo de um retorno.",
        "Atenciosamente,\n[Seu nome]",
    ]
    return _cabecalho("E-MAIL FORMAL", f"Assunto: {titulo}") + "\n\n".join(
        textwrap.fill(p, 78) if i != 0 and i != len(corpo) - 1 else p
        for i, p in enumerate(corpo)
    ) + "\n"


# ----------------------------------------------------------------------------
# Transformador: POST DE REDE SOCIAL
# ----------------------------------------------------------------------------

def gerar_post(ideia: str) -> str:
    """Transforma a ideia em um post curto com hashtags."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    aberturas = [
        "🚀 Bora falar de uma ideia que pode mudar tudo:",
        "💡 Você já parou pra pensar nisso?",
        "🔥 Novidade chegando:",
        "✨ Pequena ideia, grande impacto:",
    ]
    abertura = random.choice(aberturas)
    hashtags = " ".join(f"#{c}" for c in ch[:4])
    corpo = (
        f"{abertura} {titulo}.\n\n"
        f"Imagina unir {ch[0]} com {ch[1]} pra resolver um problema real. "
        f"É disso que estamos falando. 👇\n\n"
        f"Comenta aqui o que você acha! 💬\n\n{hashtags}"
    )
    return _cabecalho("POST DE REDE SOCIAL", titulo) + corpo + "\n"


# ----------------------------------------------------------------------------
# Transformador: RECEITA (metáfora divertida)
# ----------------------------------------------------------------------------

def gerar_receita(ideia: str) -> str:
    """Transforma a ideia em uma 'receita' criativa para realizá-la."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    ingredientes = [
        f"2 xícaras de {ch[0]}",
        f"1 colher de {ch[1]}",
        f"3 pitadas de {ch[2]}",
        "1 dose generosa de coragem",
        "Paciência a gosto",
    ]
    modo = [
        f"Misture {ch[0]} com {ch[1]} até formar uma base sólida.",
        f"Adicione {ch[2]} aos poucos, sempre mexendo as ideias.",
        "Deixe descansar (pesquise e planeje) por um tempo.",
        "Leve à ação em fogo alto: comece a executar!",
        "Sirva com entusiasmo e ajuste o tempero conforme o feedback.",
    ]
    ing = "\n".join(f"  - {i}" for i in ingredientes)
    passos = "\n".join(f"  {i}. {p}" for i, p in enumerate(modo, 1))
    return (
        _cabecalho("RECEITA", f"Como preparar: {titulo}")
        + "Ingredientes:\n" + ing + "\n\nModo de preparo:\n" + passos + "\n"
    )


# ----------------------------------------------------------------------------
# Transformador: ROTEIRO DE VÍDEO
# ----------------------------------------------------------------------------

def gerar_roteiro(ideia: str) -> str:
    """Transforma a ideia em um roteiro de vídeo curto (estilo YouTube/Reels)."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    cenas = [
        ("ABERTURA (0:00-0:10)",
         f"Gancho: faça uma pergunta provocativa sobre {ch[0]}."),
        ("INTRODUÇÃO (0:10-0:30)",
         f"Apresente a ideia “{titulo}” e por que ela importa."),
        ("DESENVOLVIMENTO (0:30-1:30)",
         f"Mostre como {ch[1]} resolve o problema. Use um exemplo real."),
        ("PONTO ALTO (1:30-2:00)",
         f"Revele o maior benefício relacionado a {ch[2]}."),
        ("ENCERRAMENTO (2:00-2:20)",
         "Resuma, agradeça e chame para ação (curtir, seguir, comentar)."),
    ]
    blocos = "\n\n".join(
        f"  [{nome}]\n  {textwrap.fill(desc, 74, subsequent_indent='  ')}"
        for nome, desc in cenas
    )
    return _cabecalho("ROTEIRO DE VÍDEO", titulo) + blocos + "\n"


# ----------------------------------------------------------------------------
# Transformador: LETRA DE MÚSICA
# ----------------------------------------------------------------------------

def gerar_musica(ideia: str) -> str:
    """Transforma a ideia em uma letra de música com refrão."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    a, b, c, d = ch[0], ch[1], ch[2], ch[3]
    refrao = (
        f"  {a.capitalize()}, {b}, é só começar\n"
        f"  Toda ideia é um lugar pra chegar\n"
        f"  {c.capitalize()} no peito, {d} no olhar\n"
        f"  Essa é a hora, é hora de sonhar"
    )
    estrofe1 = (
        f"  Tinha um {a} guardado no papel\n"
        f"  Olhei pro {b} e pintei meu céu\n"
        f"  Cada verso é um passo a mais\n"
        f"  Quem acredita nunca volta atrás"
    )
    return (
        _cabecalho("LETRA DE MÚSICA", titulo)
        + "[Verso 1]\n" + estrofe1 + "\n\n[Refrão]\n" + refrao
        + "\n\n[Verso 2]\n" + estrofe1 + "\n\n[Refrão]\n" + refrao + "\n"
    )


# ----------------------------------------------------------------------------
# Transformador: DEBATE (prós e contras)
# ----------------------------------------------------------------------------

def gerar_debate(ideia: str) -> str:
    """Transforma a ideia em uma lista de argumentos a favor e contra."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    pros = [
        f"Pode melhorar significativamente {ch[0]}.",
        f"Aproxima as pessoas de {ch[1]}.",
        "É um ponto de partida simples e barato.",
        "Estimula a criatividade e novas soluções.",
    ]
    contras = [
        f"Exige cuidado com {ch[2]} para não gerar problemas.",
        "Precisa de tempo e dedicação para dar certo.",
        "Pode encontrar resistência no começo.",
        "Depende de bom planejamento para se manter.",
    ]
    pl = "\n".join(f"  ✔ {p}" for p in pros)
    cl = "\n".join(f"  ✗ {c}" for c in contras)
    fechamento = (
        f"Conclusão: “{titulo}” tem mais a ganhar do que a perder, "
        f"desde que os riscos sejam tratados com responsabilidade."
    )
    return (
        _cabecalho("DEBATE: PRÓS E CONTRAS", titulo)
        + "A FAVOR:\n" + pl + "\n\nCONTRA:\n" + cl + "\n\n"
        + textwrap.fill(fechamento, 78) + "\n"
    )


# ----------------------------------------------------------------------------
# Transformador: ANÚNCIO PUBLICITÁRIO
# ----------------------------------------------------------------------------

def gerar_anuncio(ideia: str) -> str:
    """Transforma a ideia em um anúncio publicitário chamativo."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    return (
        _cabecalho("ANÚNCIO", titulo)
        + f"🌟 CHEGOU: {titulo.upper()} 🌟\n\n"
        + f"Cansado de problemas com {ch[0]}?\n"
        + f"Apresentamos a solução que une {ch[1]} e {ch[2]} "
        + "em um só lugar!\n\n"
        + "✅ Fácil de usar\n✅ Feito para você\n✅ Resultados de verdade\n\n"
        + "👉 Não perca tempo. Comece hoje mesmo!\n"
        + "📞 Fale conosco e transforme sua rotina.\n"
    )


# ----------------------------------------------------------------------------
# Transformador: MAPA MENTAL (em texto)
# ----------------------------------------------------------------------------

def gerar_mapa_mental(ideia: str) -> str:
    """Transforma a ideia em um mapa mental em formato de árvore de texto."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia, 6)
    ramos = {
        "O quê?": [f"definição de {ch[0]}", "público-alvo"],
        "Por quê?": [f"problema de {ch[1]}", "motivação"],
        "Como?": [f"usar {ch[2]}", "passo a passo", "ferramentas"],
        "Quando?": ["prazo inicial", "metas semanais"],
    }
    linhas = [f"({titulo})"]
    ramos_itens = list(ramos.items())
    for i, (ramo, filhos) in enumerate(ramos_itens):
        ultimo_ramo = i == len(ramos_itens) - 1
        linhas.append(f" {'└' if ultimo_ramo else '├'}── {ramo}")
        prefixo = "     " if ultimo_ramo else " │   "
        for j, filho in enumerate(filhos):
            ult = j == len(filhos) - 1
            linhas.append(f"{prefixo}{'└' if ult else '├'}── {filho}")
    return _cabecalho("MAPA MENTAL", titulo) + "\n".join(linhas) + "\n"


# ----------------------------------------------------------------------------
# Transformador: ESQUELETO DE CÓDIGO (Python)
# ----------------------------------------------------------------------------

def gerar_codigo(ideia: str) -> str:
    """Transforma a ideia em um esqueleto de programa Python comentado."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    nome_classe = "".join(p.capitalize() for p in ch[:2]) or "MeuApp"
    nome_classe = "".join(c for c in nome_classe if c.isalnum()) or "MeuApp"

    codigo = f'''# -*- coding: utf-8 -*-
"""
{titulo}
{"-" * len(titulo)}
Esqueleto gerado automaticamente a partir da sua ideia.
Preencha os trechos marcados com TODO.
"""


class {nome_classe}:
    """Classe principal do projeto: {titulo}."""

    def __init__(self):
        self.{ch[0]} = None   # TODO: configurar {ch[0]}
        self.{ch[1]} = []     # TODO: armazenar {ch[1]}

    def iniciar(self):
        """Ponto de entrada do programa."""
        print("Iniciando: {titulo}")
        # TODO: implementar a lógica de {ch[2]}
        self.processar()

    def processar(self):
        """Faz o trabalho principal da ideia."""
        # TODO: aqui acontece a mágica
        raise NotImplementedError("Implemente a lógica principal aqui.")


if __name__ == "__main__":
    app = {nome_classe}()
    app.iniciar()
'''
    return _cabecalho("ESQUELETO DE CÓDIGO (Python)", titulo) + codigo


# ----------------------------------------------------------------------------
# Transformador: QUIZ JOGÁVEL (HTML)
# ----------------------------------------------------------------------------

def gerar_quiz_html(ideia: str) -> str:
    """Transforma a ideia em um QUIZ de múltipla escolha jogável (HTML)."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia, 8)
    tema = ch[0]

    perguntas = [
        {
            "p": f"Qual é a palavra mais ligada à ideia “{titulo}”?",
            "opcoes": [tema, "banana", "guarda-chuva", "telhado"],
            "certa": 0,
        },
        {
            "p": f"O que combina melhor com {ch[1]}?",
            "opcoes": ["nada a ver", ch[2], "uma pedra", "o vento"],
            "certa": 1,
        },
        {
            "p": "Qual é o primeiro passo para tirar uma ideia do papel?",
            "opcoes": ["desistir", "esperar a sorte", "começar pequeno", "ignorar"],
            "certa": 2,
        },
        {
            "p": f"Qual destes ajuda a melhorar {ch[3]}?",
            "opcoes": ["preguiça", "medo", "desorganização", "planejamento"],
            "certa": 3,
        },
    ]
    dados = json.dumps(perguntas, ensure_ascii=False)
    titulo_esc = html.escape(titulo)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quiz: {titulo_esc}</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{ font-family: system-ui, Arial, sans-serif; background:#0f172a; color:#e2e8f0;
         display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }}
  .card {{ background:#1e293b; padding:28px; border-radius:18px; max-width:520px; width:92%;
           box-shadow:0 20px 60px rgba(0,0,0,.4); }}
  h1 {{ font-size:20px; margin:0 0 4px; }}
  .sub {{ color:#94a3b8; font-size:13px; margin-bottom:18px; }}
  .pergunta {{ font-size:18px; font-weight:600; margin:14px 0; }}
  button.op {{ display:block; width:100%; text-align:left; margin:8px 0; padding:12px 14px;
               border:none; border-radius:10px; background:#334155; color:#e2e8f0;
               font-size:15px; cursor:pointer; }}
  button.op:hover {{ background:#475569; }}
  .ok {{ background:#16a34a !important; }} .erro {{ background:#dc2626 !important; }}
  .barra {{ height:8px; background:#334155; border-radius:8px; overflow:hidden; margin:10px 0; }}
  .barra > div {{ height:100%; background:#38bdf8; width:0%; transition:width .3s; }}
  #fim {{ text-align:center; }}
  .grande {{ font-size:40px; margin:10px 0; }}
  .btnr {{ background:#38bdf8; color:#0f172a; font-weight:700; padding:12px 18px;
           border:none; border-radius:10px; cursor:pointer; }}
</style>
</head>
<body>
  <div class="card">
    <h1>🧠 Quiz</h1>
    <div class="sub">Tema: {titulo_esc}</div>
    <div class="barra"><div id="progresso"></div></div>
    <div id="jogo">
      <div class="pergunta" id="pergunta"></div>
      <div id="opcoes"></div>
    </div>
    <div id="fim" style="display:none">
      <div class="grande">🏆</div>
      <div id="placar"></div>
      <button class="btnr" onclick="location.reload()">Jogar de novo</button>
    </div>
  </div>
<script>
  const PERGUNTAS = {dados};
  let atual = 0, acertos = 0, travado = false;

  function mostrar() {{
    travado = false;
    const q = PERGUNTAS[atual];
    document.getElementById('pergunta').textContent = (atual+1) + ') ' + q.p;
    document.getElementById('progresso').style.width =
      (atual / PERGUNTAS.length * 100) + '%';
    const div = document.getElementById('opcoes');
    div.innerHTML = '';
    q.opcoes.forEach((op, i) => {{
      const b = document.createElement('button');
      b.className = 'op'; b.textContent = op;
      b.onclick = () => responder(i, b);
      div.appendChild(b);
    }});
  }}

  function responder(i, botao) {{
    if (travado) return;
    travado = true;
    const q = PERGUNTAS[atual];
    if (i === q.certa) {{ acertos++; botao.classList.add('ok'); }}
    else {{
      botao.classList.add('erro');
      document.querySelectorAll('.op')[q.certa].classList.add('ok');
    }}
    setTimeout(() => {{
      atual++;
      if (atual < PERGUNTAS.length) mostrar();
      else terminar();
    }}, 800);
  }}

  function terminar() {{
    document.getElementById('jogo').style.display = 'none';
    document.getElementById('progresso').style.width = '100%';
    document.getElementById('fim').style.display = 'block';
    document.getElementById('placar').textContent =
      'Você acertou ' + acertos + ' de ' + PERGUNTAS.length + '!';
  }}

  mostrar();
</script>
</body>
</html>
"""


# ----------------------------------------------------------------------------
# Transformador: JOGO DA MEMÓRIA (HTML)
# ----------------------------------------------------------------------------

def gerar_memoria_html(ideia: str) -> str:
    """Transforma a ideia em um JOGO DA MEMÓRIA com emojis (HTML)."""
    titulo = core.tema_curto(ideia)
    titulo_esc = html.escape(titulo)
    # Emojis escolhidos por "tema" simples a partir das letras da ideia.
    emojis = ["🌟", "🚀", "💡", "🎯", "🔥", "🎨", "🧩", "⚡"]
    random.shuffle(emojis)
    dados = json.dumps(emojis[:6], ensure_ascii=False)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Memória: {titulo_esc}</title>
<style>
  body {{ font-family:system-ui,Arial,sans-serif; background:#0f172a; color:#e2e8f0;
         display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }}
  .card {{ background:#1e293b; padding:24px; border-radius:18px; text-align:center;
           box-shadow:0 20px 60px rgba(0,0,0,.4); }}
  h1 {{ font-size:20px; margin:0 0 2px; }}
  .sub {{ color:#94a3b8; font-size:13px; margin-bottom:16px; }}
  .grade {{ display:grid; grid-template-columns:repeat(4, 72px); gap:10px; justify-content:center; }}
  .carta {{ width:72px; height:72px; background:#334155; border-radius:12px; font-size:34px;
            display:flex; align-items:center; justify-content:center; cursor:pointer;
            user-select:none; transition:transform .2s; }}
  .carta.virada {{ background:#0ea5e9; }}
  .carta.par {{ background:#16a34a; cursor:default; }}
  .info {{ margin-top:14px; }}
  button {{ margin-top:14px; background:#38bdf8; color:#0f172a; font-weight:700;
            border:none; border-radius:10px; padding:10px 16px; cursor:pointer; }}
</style>
</head>
<body>
  <div class="card">
    <h1>🧩 Jogo da Memória</h1>
    <div class="sub">Tema: {titulo_esc}</div>
    <div class="grade" id="grade"></div>
    <div class="info">Jogadas: <b id="jogadas">0</b> · Pares: <b id="pares">0</b>/6</div>
    <button onclick="location.reload()">🔁 Reiniciar</button>
  </div>
<script>
  const BASE = {dados};
  let cartas = [...BASE, ...BASE].sort(() => Math.random() - 0.5);
  let viradas = [], jogadas = 0, pares = 0, travado = false;

  const grade = document.getElementById('grade');
  cartas.forEach((emoji, i) => {{
    const c = document.createElement('div');
    c.className = 'carta'; c.dataset.emoji = emoji; c.dataset.idx = i;
    c.onclick = () => virar(c);
    grade.appendChild(c);
  }});

  function virar(c) {{
    if (travado || c.classList.contains('virada') || c.classList.contains('par')) return;
    c.classList.add('virada'); c.textContent = c.dataset.emoji;
    viradas.push(c);
    if (viradas.length === 2) {{
      travado = true; jogadas++;
      document.getElementById('jogadas').textContent = jogadas;
      const [a, b] = viradas;
      if (a.dataset.emoji === b.dataset.emoji) {{
        a.classList.add('par'); b.classList.add('par');
        pares++; document.getElementById('pares').textContent = pares;
        viradas = []; travado = false;
        if (pares === 6) setTimeout(() => alert('🎉 Você venceu em ' + jogadas + ' jogadas!'), 200);
      }} else {{
        setTimeout(() => {{
          a.classList.remove('virada'); b.classList.remove('virada');
          a.textContent = ''; b.textContent = '';
          viradas = []; travado = false;
        }}, 800);
      }}
    }}
  }}
</script>
</body>
</html>
"""


# ----------------------------------------------------------------------------
# Transformador: CHARADA / ADIVINHA
# ----------------------------------------------------------------------------

def gerar_charada(ideia: str) -> str:
    """Transforma a ideia em uma charada com resposta escondida."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    resposta = max(ch, key=len)
    charada = (
        f"O que é, o que é:\n\n"
        f"  Nasce de um pensamento sobre {ch[0]},\n"
        f"  caminha junto com {ch[1]},\n"
        f"  e quando vira realidade,\n"
        f"  muda tudo num instante?\n\n"
        f"(Dica: tem a ver com “{titulo}”.)\n\n"
        f"Resposta: {resposta[::-1]}  (leia de trás pra frente)\n"
    )
    return _cabecalho("CHARADA", titulo) + charada


# ----------------------------------------------------------------------------
# Transformador: CRONOGRAMA / ROADMAP
# ----------------------------------------------------------------------------

def gerar_cronograma(ideia: str) -> str:
    """Transforma a ideia em um cronograma de 4 semanas."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    semanas = [
        ("Semana 1 — Descoberta",
         [f"Estudar {ch[0]}", "Anotar referências", "Definir metas"]),
        ("Semana 2 — Protótipo",
         [f"Criar versão simples de {ch[1]}", "Testar com amigos"]),
        ("Semana 3 — Ajustes",
         ["Coletar feedback", f"Melhorar {ch[2]}", "Corrigir erros"]),
        ("Semana 4 — Lançamento",
         ["Finalizar detalhes", "Divulgar a ideia", "Comemorar!"]),
    ]
    partes = []
    for nome, tarefas in semanas:
        t = "\n".join(f"     [ ] {x}" for x in tarefas)
        partes.append(f"  📅 {nome}\n{t}")
    return _cabecalho("CRONOGRAMA (4 semanas)", titulo) + "\n\n".join(partes) + "\n"


# ----------------------------------------------------------------------------
# Registro dos transformadores extras
# ----------------------------------------------------------------------------

TRANSFORMADORES_EXTRA = {
    "Resumo":            {"func": gerar_resumo,       "tipo": "texto", "emoji": "🧾"},
    "E-mail Formal":     {"func": gerar_email,        "tipo": "texto", "emoji": "✉️"},
    "Post de Rede":      {"func": gerar_post,         "tipo": "texto", "emoji": "📱"},
    "Receita":           {"func": gerar_receita,      "tipo": "texto", "emoji": "🍲"},
    "Roteiro de Vídeo":  {"func": gerar_roteiro,      "tipo": "texto", "emoji": "🎬"},
    "Letra de Música":   {"func": gerar_musica,       "tipo": "texto", "emoji": "🎵"},
    "Debate":            {"func": gerar_debate,       "tipo": "texto", "emoji": "⚖️"},
    "Anúncio":           {"func": gerar_anuncio,      "tipo": "texto", "emoji": "📣"},
    "Mapa Mental":       {"func": gerar_mapa_mental,  "tipo": "texto", "emoji": "🗺️"},
    "Código (Python)":   {"func": gerar_codigo,       "tipo": "texto", "emoji": "💻"},
    "Charada":           {"func": gerar_charada,      "tipo": "texto", "emoji": "❓"},
    "Cronograma":        {"func": gerar_cronograma,   "tipo": "texto", "emoji": "📅"},
    "Quiz (HTML)":       {"func": gerar_quiz_html,    "tipo": "html",  "emoji": "🧠"},
    "Jogo da Memória":   {"func": gerar_memoria_html, "tipo": "html",  "emoji": "🧩"},
}


# ----------------------------------------------------------------------------
# Teste pelo terminal
# ----------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    ideia_demo = " ".join(sys.argv[1:]) or (
        "Um app que ajuda crianças a aprender reciclagem de forma divertida"
    )
    print(f"IDEIA: {ideia_demo}\n")
    for nome, info in TRANSFORMADORES_EXTRA.items():
        print("#" * 70)
        print(f"# APP: {nome}")
        print("#" * 70)
        saida = info["func"](ideia_demo)
        if info["tipo"] == "html":
            print(f"(HTML jogável gerado: {len(saida)} caracteres — salve como .html)\n")
        else:
            print(saida)
        print()
