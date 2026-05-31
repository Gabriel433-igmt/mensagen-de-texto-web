# -*- coding: utf-8 -*-
"""
transformadores_criativos.py
============================
Transformadores focados em CRIATIVIDADE para o Transformador de Ideias.

A missão destes geradores é ajudar as pessoas a terem mais ideias, sair do
óbvio e ganhar inspiração: brainstorm, técnica SCAMPER, "e se...?", criação
de personagens e mundos, paleta de cores, conceito de logo, desafio de 30
dias, combinador maluco de ideias e invenções fictícias.

Não depende de interface gráfica. Teste no terminal:
    python3 transformadores_criativos.py "sua ideia"
"""

from __future__ import annotations

import hashlib
import html
import random
import textwrap

try:
    import transformadores as core
except ImportError:  # pragma: no cover
    import os
    import sys

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import transformadores as core


def _chaves(ideia: str, n: int = 8) -> list[str]:
    ch = core.palavras_chave(ideia, maximo=n)
    reserva = ["ideia", "projeto", "futuro", "criar", "mundo", "magia", "tempo"]
    while len(ch) < 5:
        ch.append(reserva[len(ch) % len(reserva)])
    return ch


def _cab(tipo: str, titulo: str) -> str:
    return f"{tipo}\n{titulo}\n{'=' * max(3, len(titulo))}\n\n"


def _semente(ideia: str) -> int:
    """Número estável derivado da ideia (resultados consistentes)."""
    return int(hashlib.sha256(ideia.encode("utf-8")).hexdigest(), 16)


# ----------------------------------------------------------------------------
# BRAINSTORM — vários ângulos da mesma ideia
# ----------------------------------------------------------------------------

def gerar_brainstorm(ideia: str) -> str:
    """Gera muitas variações e ângulos diferentes da ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    angulos = [
        f"Versão para crianças: como seria “{titulo}” divertido e colorido?",
        f"Versão profissional: como {ch[0]} viraria um negócio sério?",
        f"Versão econômica: como fazer {ch[1]} gastando quase nada?",
        f"Versão tecnológica: e se usasse app, site ou robô para {ch[2]}?",
        f"Versão comunitária: como reunir pessoas em volta de {ch[0]}?",
        f"Versão sustentável: como {titulo} ajudaria o planeta?",
        f"Versão surpresa: qual seria a forma mais inesperada de fazer isso?",
        f"Versão mínima: qual é a menor versão possível para começar hoje?",
    ]
    linhas = "\n".join(f"  💡 {a}" for a in angulos)
    return _cab("BRAINSTORM (8 ângulos)", titulo) + linhas + "\n"


# ----------------------------------------------------------------------------
# SCAMPER — técnica clássica de criatividade
# ----------------------------------------------------------------------------

def gerar_scamper(ideia: str) -> str:
    """Aplica a técnica SCAMPER para transformar a ideia de 7 formas."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    passos = [
        ("S — Substituir", f"O que dá para trocar em {ch[0]} por algo melhor?"),
        ("C — Combinar", f"Com o que você poderia juntar {ch[0]} para criar algo novo? (ex.: {ch[1]} + {ch[2]})"),
        ("A — Adaptar", f"O que de outro lugar dá para adaptar para {titulo}?"),
        ("M — Modificar", f"O que aconteceria se você aumentasse ou diminuísse {ch[1]}?"),
        ("P — Pôr em outro uso", f"Para que mais {titulo} poderia servir?"),
        ("E — Eliminar", f"O que dá para remover e mesmo assim funcionar?"),
        ("R — Reorganizar", "E se você invertesse a ordem ou começasse pelo fim?"),
    ]
    blocos = "\n\n".join(
        f"  {nome}\n  {textwrap.fill(pergunta, 72, subsequent_indent='  ')}"
        for nome, pergunta in passos
    )
    return _cab("SCAMPER (7 lentes criativas)", titulo) + blocos + "\n"


# ----------------------------------------------------------------------------
# E SE...? — provocações para destravar a imaginação
# ----------------------------------------------------------------------------

def gerar_e_se(ideia: str) -> str:
    """Gera perguntas 'E se...?' para abrir novos caminhos."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    perguntas = [
        f"E se {titulo} fosse mágico e pudesse fazer qualquer coisa?",
        f"E se você tivesse só 1 dia para criar {ch[0]}?",
        f"E se {ch[1]} custasse zero reais?",
        f"E se uma criança de 5 anos resolvesse esse problema?",
        f"E se {titulo} virasse um jogo?",
        f"E se o oposto de {ch[0]} fosse a solução?",
        f"E se 1 milhão de pessoas usassem isso amanhã?",
        f"E se {ch[2]} desaparecesse — o que mudaria?",
    ]
    linhas = "\n".join(f"  🤔 {p}" for p in perguntas)
    return _cab("E SE...? (provocações criativas)", titulo) + linhas + "\n"


# ----------------------------------------------------------------------------
# PERSONAGEM — cria um personagem a partir da ideia
# ----------------------------------------------------------------------------

def gerar_personagem(ideia: str) -> str:
    """Cria um personagem detalhado inspirado na ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    s = _semente(ideia)
    nomes = ["Aurora", "Téo", "Lia", "Bento", "Nina", "Caio", "Maya", "Ravi"]
    tracos = ["corajoso", "curioso", "teimoso", "gentil", "sonhador", "esperto"]
    nome = nomes[s % len(nomes)]
    traco1 = tracos[s % len(tracos)]
    traco2 = tracos[(s // 7) % len(tracos)]
    ficha = (
        f"  Nome: {nome}\n"
        f"  Personalidade: {traco1} e {traco2}\n"
        f"  Sonho: transformar {ch[0]} em algo melhor\n"
        f"  Maior medo: nunca tentar\n"
        f"  Item especial: um caderno onde anota cada ideia sobre {ch[1]}\n\n"
        f"  História: {nome} sempre acreditou que “{titulo}” podia mudar o mundo. "
        f"Mesmo sendo {traco1}, aprendeu que as melhores ideias nascem quando a "
        f"gente ousa começar."
    )
    return _cab("PERSONAGEM", titulo) + ficha + "\n"


# ----------------------------------------------------------------------------
# MUNDO / CENÁRIO — worldbuilding
# ----------------------------------------------------------------------------

def gerar_mundo(ideia: str) -> str:
    """Cria um mundo/cenário imaginário baseado na ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    mundo = (
        f"  Nome do mundo: Terra de {ch[0].capitalize()}\n"
        f"  Como é: um lugar onde {ch[0]} é a coisa mais importante de todas.\n"
        f"  Regra mágica: tudo que envolve {ch[1]} acontece duas vezes mais rápido.\n"
        f"  Habitantes: pessoas que vivem para criar e cuidar de {ch[2]}.\n"
        f"  Conflito: alguém quer acabar com {ch[0]} — e cabe aos heróis impedir.\n"
        f"  Lugar secreto: a Biblioteca das Ideias, onde “{titulo}” foi inventado."
    )
    return _cab("MUNDO IMAGINÁRIO", titulo) + mundo + "\n"


# ----------------------------------------------------------------------------
# DESAFIO DE 30 DIAS
# ----------------------------------------------------------------------------

def gerar_desafio30(ideia: str) -> str:
    """Cria um desafio criativo de 30 dias para evoluir a ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    modelos = [
        "Escrever 3 ideias novas sobre {tema}",
        "Pesquisar 1 exemplo parecido com {a}",
        "Desenhar como seria {titulo}",
        "Conversar com alguém sobre {a}",
        "Melhorar 1 detalhe de {b}",
        "Testar uma versão pequena",
        "Anotar o que aprendeu hoje",
    ]
    linhas = []
    for dia in range(1, 31):
        m = modelos[(dia - 1) % len(modelos)]
        tarefa = m.format(tema=titulo, titulo=titulo, a=ch[0], b=ch[1])
        linhas.append(f"  Dia {dia:>2}: [ ] {tarefa}")
    return _cab("DESAFIO DE 30 DIAS", titulo) + "\n".join(linhas) + "\n"


# ----------------------------------------------------------------------------
# COMBINADOR MALUCO — força conexões inesperadas
# ----------------------------------------------------------------------------

def gerar_combinador(ideia: str) -> str:
    """Combina a ideia com elementos aleatórios para criar ideias novas."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    elementos = [
        "um dragão", "a internet", "uma horta", "música", "o espaço",
        "um robô", "uma bicicleta", "chocolate", "um superpoder",
        "uma viagem no tempo", "origami", "futebol", "uma floresta",
    ]
    s = _semente(ideia)
    random.seed(s)
    escolhidos = random.sample(elementos, 5)
    linhas = []
    for e in escolhidos:
        linhas.append(f"  🃏 {titulo} + {e}  →  e se você juntasse os dois?")
    nota = (
        "Dica: combinações estranhas são ótimas para destravar a criatividade. "
        "Escolha a mais maluca e leve a sério por 5 minutos!"
    )
    return _cab("COMBINADOR MALUCO", titulo) + "\n".join(linhas) + "\n\n" + textwrap.fill(nota, 78) + "\n"


# ----------------------------------------------------------------------------
# INVENÇÃO FICTÍCIA
# ----------------------------------------------------------------------------

def gerar_invencao(ideia: str) -> str:
    """Descreve uma invenção fictícia inspirada na ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    nome_inv = (ch[0][:4].capitalize() + ch[1][:4].capitalize() + "-3000")
    inv = (
        f"  Nome da invenção: {nome_inv}\n"
        f"  O que faz: resolve automaticamente tudo relacionado a {ch[0]}.\n"
        f"  Como funciona: aperta um botão e ele cuida de {ch[1]} sozinho.\n"
        f"  Superpoder: transforma {ch[2]} em diversão.\n"
        f"  Tamanho: cabe no bolso.\n"
        f"  Slogan: “{nome_inv} — a sua ideia, agora realidade!”"
    )
    return _cab("INVENÇÃO FICTÍCIA", titulo) + inv + "\n"


# ----------------------------------------------------------------------------
# LOGO (conceito) — ideia de logotipo + selo em ASCII
# ----------------------------------------------------------------------------

def gerar_logo(ideia: str) -> str:
    """Sugere um conceito de logotipo e desenha um selo simples em ASCII."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    s = _semente(ideia)
    simbolos = ["★", "✦", "❍", "▲", "♦", "✿", "☼", "⚡"]
    simbolo = simbolos[s % len(simbolos)]
    sigla = "".join(p[0] for p in ch[:2]).upper() or "ID"
    largura = 30
    selo = (
        "  ╔" + "═" * largura + "╗\n"
        + "  ║" + f"{simbolo} {sigla} {simbolo}".center(largura) + "║\n"
        + "  ║" + titulo[:largura].center(largura) + "║\n"
        + "  ╚" + "═" * largura + "╝"
    )
    conceito = (
        f"  Conceito de logo:\n"
        f"  - Símbolo: {simbolo} (representa {ch[0]})\n"
        f"  - Sigla/monograma: {sigla}\n"
        f"  - Estilo: moderno e simples\n"
        f"  - Cores sugeridas: veja o app 'Paleta de Cores'\n\n"
        f"  Selo (rascunho em texto):\n\n{selo}"
    )
    return _cab("LOGO (conceito)", titulo) + conceito + "\n"


# ----------------------------------------------------------------------------
# PALETA DE CORES (HTML) — gera cores a partir da ideia
# ----------------------------------------------------------------------------

def gerar_paleta_html(ideia: str) -> str:
    """Gera uma paleta de 5 cores (derivada da ideia) com prévia em HTML."""
    titulo = core.tema_curto(ideia)
    s = _semente(ideia)
    # Gera 5 tons harmônicos variando a matiz a partir da semente.
    base = s % 360
    cores = []
    for i in range(5):
        matiz = (base + i * 40) % 360
        cores.append(_hsl_para_hex(matiz, 65, 55 - i * 5))
    titulo_esc = html.escape(titulo)
    blocos = "".join(
        f'<div class="cor" style="background:{c}">'
        f'<span>{c}</span></div>'
        for c in cores
    )
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Paleta: {titulo_esc}</title>
<style>
  body {{ font-family:system-ui,Arial,sans-serif; background:#0f172a; color:#e2e8f0;
         display:flex; flex-direction:column; align-items:center;
         justify-content:center; min-height:100vh; margin:0; }}
  h1 {{ font-size:20px; }}
  .sub {{ color:#94a3b8; margin-bottom:18px; }}
  .paleta {{ display:flex; gap:0; border-radius:14px; overflow:hidden;
             box-shadow:0 20px 60px rgba(0,0,0,.4); }}
  .cor {{ width:110px; height:180px; display:flex; align-items:flex-end;
          justify-content:center; padding-bottom:10px; }}
  .cor span {{ background:rgba(0,0,0,.45); padding:3px 8px; border-radius:6px;
               font-size:12px; font-family:monospace; }}
  p {{ color:#64748b; font-size:13px; margin-top:16px; }}
</style>
</head>
<body>
  <h1>🎨 Paleta de Cores</h1>
  <div class="sub">Inspirada em: {titulo_esc}</div>
  <div class="paleta">{blocos}</div>
  <p>Clique e copie os códigos para usar nos seus desenhos e projetos.</p>
</body>
</html>
"""


def _hsl_para_hex(h: float, s: float, l: float) -> str:
    """Converte HSL (graus, %, %) em código hexadecimal #RRGGBB."""
    s /= 100.0
    l /= 100.0
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60.0) % 2 - 1))
    m = l - c / 2
    if h < 60:
        r, g, b = c, x, 0
    elif h < 120:
        r, g, b = x, c, 0
    elif h < 180:
        r, g, b = 0, c, x
    elif h < 240:
        r, g, b = 0, x, c
    elif h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return "#{:02x}{:02x}{:02x}".format(
        round((r + m) * 255), round((g + m) * 255), round((b + m) * 255)
    )


# ----------------------------------------------------------------------------
# Registro
# ----------------------------------------------------------------------------

TRANSFORMADORES_CRIATIVOS = {
    "Brainstorm":        {"func": gerar_brainstorm,   "tipo": "texto", "emoji": "🌈"},
    "SCAMPER":           {"func": gerar_scamper,      "tipo": "texto", "emoji": "🔄"},
    "E se...?":          {"func": gerar_e_se,         "tipo": "texto", "emoji": "🤔"},
    "Personagem":        {"func": gerar_personagem,   "tipo": "texto", "emoji": "🎭"},
    "Mundo Imaginário":  {"func": gerar_mundo,        "tipo": "texto", "emoji": "🏰"},
    "Desafio 30 Dias":   {"func": gerar_desafio30,    "tipo": "texto", "emoji": "📆"},
    "Combinador Maluco": {"func": gerar_combinador,   "tipo": "texto", "emoji": "🃏"},
    "Invenção":          {"func": gerar_invencao,     "tipo": "texto", "emoji": "🛠️"},
    "Logo (conceito)":   {"func": gerar_logo,         "tipo": "texto", "emoji": "🖼️"},
    "Paleta de Cores":   {"func": gerar_paleta_html,  "tipo": "html",  "emoji": "🎨"},
}


if __name__ == "__main__":
    import sys

    ideia_demo = " ".join(sys.argv[1:]) or "Um app que ensina reciclagem para crianças"
    print(f"IDEIA: {ideia_demo}\n")
    for nome, info in TRANSFORMADORES_CRIATIVOS.items():
        print("#" * 70)
        print(f"# APP: {nome}")
        print("#" * 70)
        saida = info["func"](ideia_demo)
        if info["tipo"] == "html":
            print(f"(HTML gerado: {len(saida)} caracteres — salve como .html)\n")
        else:
            print(saida)
        print()
