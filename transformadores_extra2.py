# -*- coding: utf-8 -*-
"""
transformadores_extra2.py
=========================
Mais transformadores ("apps") para o Transformador de Ideias.

Inclui geradores divertidos e úteis: slogan, nomes de marca, análise FOFA
(SWOT), pitch de elevador, FAQ, tutorial, trava-língua, banner em ASCII,
"senha-tema" e história em emojis.

Não depende de interface gráfica. Teste no terminal:
    python3 transformadores_extra2.py "sua ideia"
"""

from __future__ import annotations

import hashlib
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
    reserva = ["ideia", "projeto", "futuro", "criar", "mundo", "tempo"]
    while len(ch) < 4:
        ch.append(reserva[len(ch) % len(reserva)])
    return ch


def _cab(tipo: str, titulo: str) -> str:
    return f"{tipo}\n{titulo}\n{'=' * max(3, len(titulo))}\n\n"


# ----------------------------------------------------------------------------
# SLOGAN
# ----------------------------------------------------------------------------

def gerar_slogan(ideia: str) -> str:
    """Gera vários slogans publicitários a partir da ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    modelos = [
        f"{titulo}: o futuro começa agora.",
        f"Com {ch[0]}, tudo fica mais fácil.",
        f"Pense em {ch[1]}. Pense em {titulo}.",
        f"{titulo} — feito para quem não para.",
        f"Sua ideia de {ch[0]}, do jeito certo.",
        f"Menos esforço, mais {ch[2]}.",
    ]
    linhas = "\n".join(f"  ★ {m}" for m in modelos)
    return _cab("SLOGANS", titulo) + linhas + "\n"


# ----------------------------------------------------------------------------
# NOMES DE MARCA (brandstorm)
# ----------------------------------------------------------------------------

def gerar_nomes_marca(ideia: str) -> str:
    """Sugere nomes de marca combinando partes das palavras-chave."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia, 6)
    sufixos = ["ify", "ly", "Hub", "Lab", "Go", "Mais", "Pro", "X", "Up"]
    prefixos = ["Neo", "Viva", "Meu", "Super", "Eco", "Smart"]
    nomes = set()
    tentativas = 0
    while len(nomes) < 8 and tentativas < 60:
        tentativas += 1
        base = random.choice(ch).capitalize()
        estilo = random.randint(0, 2)
        if estilo == 0:
            nomes.add(base + random.choice(sufixos))
        elif estilo == 1:
            nomes.add(random.choice(prefixos) + base)
        else:
            outra = random.choice(ch).capitalize()
            nomes.add(base[:3] + outra[-3:].lower())
    linhas = "\n".join(f"  • {n}" for n in sorted(nomes))
    return _cab("NOMES DE MARCA", titulo) + linhas + "\n"


# ----------------------------------------------------------------------------
# ANÁLISE FOFA (SWOT)
# ----------------------------------------------------------------------------

def gerar_fofa(ideia: str) -> str:
    """Gera uma análise FOFA (Forças, Oportunidades, Fraquezas, Ameaças)."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    secoes = {
        "FORÇAS (internas, positivas)": [
            f"Foco claro em {ch[0]}",
            "Ideia simples de entender",
            "Baixo custo para começar",
        ],
        "FRAQUEZAS (internas, negativas)": [
            f"Ainda depende de aprender {ch[1]}",
            "Recursos limitados no início",
        ],
        "OPORTUNIDADES (externas, positivas)": [
            f"Crescente interesse por {ch[2]}",
            "Possibilidade de parcerias",
        ],
        "AMEAÇAS (externas, negativas)": [
            "Concorrência já estabelecida",
            "Mudanças de mercado",
        ],
    }
    partes = []
    for titulo_secao, itens in secoes.items():
        bloco = "\n".join(f"     - {x}" for x in itens)
        partes.append(f"  {titulo_secao}\n{bloco}")
    return _cab("ANÁLISE FOFA (SWOT)", titulo) + "\n\n".join(partes) + "\n"


# ----------------------------------------------------------------------------
# PITCH DE ELEVADOR
# ----------------------------------------------------------------------------

def gerar_pitch(ideia: str) -> str:
    """Gera um pitch de elevador (apresentação de 30 segundos)."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    pitch = (
        f"Sabe quando as pessoas têm problema com {ch[0]}? "
        f"A gente criou “{titulo}”, uma solução que usa {ch[1]} para "
        f"resolver isso de forma simples e rápida. "
        f"Diferente das outras opções, focamos em {ch[2]} — e isso muda tudo. "
        f"Em poucos minutos, qualquer pessoa consegue usar. "
        f"Quer ver funcionando?"
    )
    return _cab("PITCH DE ELEVADOR (30s)", titulo) + textwrap.fill(pitch, 78) + "\n"


# ----------------------------------------------------------------------------
# FAQ (perguntas frequentes)
# ----------------------------------------------------------------------------

def gerar_faq(ideia: str) -> str:
    """Gera uma seção de perguntas frequentes sobre a ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    qa = [
        (f"O que é {titulo}?",
         f"É uma ideia que usa {ch[0]} para ajudar com {ch[1]}."),
        ("Para quem serve?",
         "Para qualquer pessoa que queira resolver esse problema de forma simples."),
        ("Quanto custa para começar?",
         "Pode começar com pouco ou nenhum custo — o importante é dar o primeiro passo."),
        (f"Preciso saber sobre {ch[2]}?",
         "Não necessariamente. A proposta é ser fácil para iniciantes."),
        ("Como eu começo?",
         "Defina uma meta pequena, teste e vá melhorando com o tempo."),
    ]
    partes = []
    for p, r in qa:
        partes.append(f"  P: {p}\n  R: {textwrap.fill(r, 72, subsequent_indent='     ')}")
    return _cab("PERGUNTAS FREQUENTES (FAQ)", titulo) + "\n\n".join(partes) + "\n"


# ----------------------------------------------------------------------------
# TUTORIAL PASSO A PASSO
# ----------------------------------------------------------------------------

def gerar_tutorial(ideia: str) -> str:
    """Gera um tutorial passo a passo para colocar a ideia em prática."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    passos = [
        f"Entenda bem o problema ligado a {ch[0]}.",
        f"Reúna o material e as informações sobre {ch[1]}.",
        "Faça um rascunho ou esboço da solução.",
        "Construa uma primeira versão bem simples.",
        f"Teste com foco em {ch[2]} e anote o que funciona.",
        "Peça opiniões e ajuste os detalhes.",
        "Finalize e compartilhe o resultado.",
    ]
    corpo = "\n\n".join(
        f"  PASSO {i}: {p}" for i, p in enumerate(passos, 1)
    )
    return _cab(f"TUTORIAL: como fazer {titulo}", titulo) + corpo + "\n"


# ----------------------------------------------------------------------------
# TRAVA-LÍNGUA
# ----------------------------------------------------------------------------

def gerar_trava_lingua(ideia: str) -> str:
    """Gera um trava-língua divertido com as palavras da ideia."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    a, b, c = ch[0], ch[1], ch[2]
    frase = (
        f"O {a} de {b} {c}eou, "
        f"e quem {c}eia o {a} de {b} "
        f"bem {b}ado {c}eador será!"
    )
    return _cab("TRAVA-LÍNGUA", titulo) + "  " + frase + "\n\n  (Tente falar 3x rápido!)\n"


# ----------------------------------------------------------------------------
# BANNER EM ASCII
# ----------------------------------------------------------------------------

# Mini "fonte" de blocos para letras do alfabeto (5 linhas de altura).
_ASCII_FONTE = {
    "A": ["  ▄█▄  ", " █   █ ", " █████ ", " █   █ ", " █   █ "],
    "B": [" ████  ", " █   █ ", " ████  ", " █   █ ", " ████  "],
    "C": ["  ████ ", " █     ", " █     ", " █     ", "  ████ "],
    "D": [" ████  ", " █   █ ", " █   █ ", " █   █ ", " ████  "],
    "E": [" █████ ", " █     ", " ████  ", " █     ", " █████ "],
    "I": [" █████ ", "   █   ", "   █   ", "   █   ", " █████ "],
    "O": ["  ███  ", " █   █ ", " █   █ ", " █   █ ", "  ███  "],
    "R": [" ████  ", " █   █ ", " ████  ", " █  █  ", " █   █ "],
    " ": ["   ", "   ", "   ", "   ", "   "],
}


def gerar_banner(ideia: str) -> str:
    """Gera um banner em arte ASCII com a primeira palavra-chave."""
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    palavra = ch[0].upper()[:8]
    linhas = ["", "", "", "", ""]
    for letra in palavra:
        bloco = _ASCII_FONTE.get(letra, _ASCII_FONTE[" "])
        for i in range(5):
            linhas[i] += bloco[i]
    banner = "\n".join(linhas)
    return _cab("BANNER ASCII", titulo) + banner + "\n"


# ----------------------------------------------------------------------------
# "SENHA-TEMA" (sugestão criativa de senha forte)
# ----------------------------------------------------------------------------

def gerar_senha_tema(ideia: str) -> str:
    """Sugere uma senha forte e fácil de lembrar baseada na ideia.

    Observação: é apenas uma SUGESTÃO criativa para inspirar — para contas
    importantes, use um gerenciador de senhas de verdade.
    """
    titulo = core.tema_curto(ideia)
    ch = _chaves(ideia)
    base = (ch[0][:3] + ch[1][:3]).capitalize()
    # Um número estável derivado da ideia (não aleatório a cada execução).
    h = int(hashlib.sha256(ideia.encode("utf-8")).hexdigest(), 16)
    numero = h % 100
    simbolo = "!@#$%&*"[h % 7]
    senha = f"{base}{numero}{simbolo}{ch[2][:2].upper()}"
    dica = (
        "Dica: ela mistura partes das suas palavras-chave com números e "
        "um símbolo. Lembre só da ideia e a senha 'volta' à memória."
    )
    return (
        _cab("SENHA-TEMA", titulo)
        + f"  Sugestão de senha: {senha}\n\n"
        + textwrap.fill(dica, 78)
        + "\n\n  ⚠ Para contas importantes, prefira um gerenciador de senhas.\n"
    )


# ----------------------------------------------------------------------------
# HISTÓRIA EM EMOJIS
# ----------------------------------------------------------------------------

def gerar_historia_emoji(ideia: str) -> str:
    """Conta a ideia como uma mini-história só de emojis (com legenda)."""
    titulo = core.tema_curto(ideia)
    bancos = ["💡", "🧠", "📝", "🚀", "⭐", "🔥", "🎯", "🏆", "🌍", "🤝", "📈", "🎉"]
    h = sum(ord(c) for c in ideia)
    seq = [bancos[(h + i * 7) % len(bancos)] for i in range(8)]
    historia = (
        f"  {seq[0]} {seq[1]}  → tudo começou com uma ideia\n"
        f"  {seq[2]} {seq[3]}  → veio o trabalho e o esforço\n"
        f"  {seq[4]} {seq[5]}  → apareceram os desafios\n"
        f"  {seq[6]} {seq[7]}  → e no fim, a vitória!"
    )
    return _cab("HISTÓRIA EM EMOJIS", titulo) + historia + "\n"


# ----------------------------------------------------------------------------
# Registro
# ----------------------------------------------------------------------------

TRANSFORMADORES_EXTRA2 = {
    "Slogans":          {"func": gerar_slogan,          "tipo": "texto", "emoji": "🏷️"},
    "Nomes de Marca":   {"func": gerar_nomes_marca,     "tipo": "texto", "emoji": "🔤"},
    "Análise FOFA":     {"func": gerar_fofa,            "tipo": "texto", "emoji": "🧮"},
    "Pitch":            {"func": gerar_pitch,           "tipo": "texto", "emoji": "🎤"},
    "FAQ":              {"func": gerar_faq,             "tipo": "texto", "emoji": "💬"},
    "Tutorial":         {"func": gerar_tutorial,        "tipo": "texto", "emoji": "📚"},
    "Trava-Língua":     {"func": gerar_trava_lingua,    "tipo": "texto", "emoji": "👅"},
    "Banner ASCII":     {"func": gerar_banner,          "tipo": "texto", "emoji": "🎰"},
    "Senha-Tema":       {"func": gerar_senha_tema,      "tipo": "texto", "emoji": "🔐"},
    "História em Emoji":{"func": gerar_historia_emoji,  "tipo": "texto", "emoji": "😀"},
}


if __name__ == "__main__":
    import sys

    ideia_demo = " ".join(sys.argv[1:]) or "Um app que ensina reciclagem para crianças"
    print(f"IDEIA: {ideia_demo}\n")
    for nome, info in TRANSFORMADORES_EXTRA2.items():
        print("#" * 70)
        print(f"# APP: {nome}")
        print("#" * 70)
        print(info["func"](ideia_demo))
        print()
