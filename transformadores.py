# -*- coding: utf-8 -*-
"""
transformadores.py
==================
Núcleo do app "Transformador de Ideias".

Aqui ficam os "apps"/transformadores: cada um recebe uma IDEIA (texto) e a
transforma em algo diferente — uma redação, um jogo, uma história, um poema,
um plano de ação ou uma apresentação.

Este módulo NÃO depende de interface gráfica (não importa o tkinter), por isso
pode ser testado e usado sozinho, no terminal ou por outros programas.
"""

from __future__ import annotations

import datetime
import html
import json
import random
import re
import textwrap

# ----------------------------------------------------------------------------
# Utilidades de texto
# ----------------------------------------------------------------------------

# Palavras muito comuns que não ajudam a identificar o "tema" da ideia.
_STOPWORDS = {
    "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos",
    "das", "e", "ou", "que", "com", "sem", "por", "para", "pra", "no", "na",
    "nos", "nas", "em", "ao", "aos", "à", "às", "se", "sua", "seu", "suas",
    "seus", "meu", "minha", "este", "esta", "isso", "isto", "ele", "ela",
    "como", "mais", "muito", "ser", "ter", "fazer", "sobre", "the", "of",
}


def palavras_chave(ideia: str, maximo: int = 6) -> list[str]:
    """Extrai as palavras mais relevantes da ideia (ignora palavras comuns)."""
    palavras = re.findall(r"[A-Za-zÀ-ÿ0-9]+", ideia.lower())
    vistas: list[str] = []
    for p in palavras:
        if len(p) >= 4 and p not in _STOPWORDS and p not in vistas:
            vistas.append(p)
    if not vistas:  # se não sobrou nada, usa as primeiras palavras mesmo
        vistas = [p for p in palavras if p][:maximo]
    return vistas[:maximo]


def tema_curto(ideia: str) -> str:
    """Devolve um título curto e apresentável a partir da ideia."""
    ideia = ideia.strip()
    if not ideia:
        return "Minha ideia"
    primeira_linha = ideia.splitlines()[0].strip()
    # Corta no fim da primeira frase, se houver.
    frase = re.split(r"[.!?\n]", primeira_linha)[0].strip()
    frase = frase[:70].strip()
    return frase.capitalize() if frase else "Minha ideia"


def _agora() -> str:
    return datetime.datetime.now().strftime("%d/%m/%Y %H:%M")


# ----------------------------------------------------------------------------
# Transformador: REDAÇÃO
# ----------------------------------------------------------------------------

def gerar_redacao(ideia: str) -> str:
    """Transforma a ideia em uma redação dissertativa estruturada."""
    titulo = tema_curto(ideia)
    chaves = palavras_chave(ideia)
    foco = chaves[0] if chaves else titulo.lower()
    aspecto = chaves[1] if len(chaves) > 1 else "a sociedade"
    extra = chaves[2] if len(chaves) > 2 else "o dia a dia"

    introducao = (
        f"O tema “{titulo}” tem ganhado destaque e merece reflexão. "
        f"Quando se fala em {foco}, é natural pensar em como isso influencia "
        f"{aspecto} e {extra}. A seguir, este texto apresenta argumentos que "
        f"ajudam a compreender melhor a questão e, ao final, propõe um caminho."
    )

    desenvolvimento_1 = (
        f"Em primeiro lugar, é importante reconhecer a relevância de {foco}. "
        f"Esse assunto não surge por acaso: ele responde a necessidades reais "
        f"das pessoas e revela como mudanças simples podem ter grande impacto. "
        f"Ignorar esse ponto seria deixar de lado uma parte essencial do debate."
    )

    desenvolvimento_2 = (
        f"Além disso, ao observar {aspecto}, percebe-se que existem diferentes "
        f"pontos de vista. Há quem enxergue oportunidades e há quem aponte "
        f"riscos. O equilíbrio entre esses olhares é justamente o que torna o "
        f"tema “{titulo}” tão rico para discussão e estudo."
    )

    conclusao = (
        f"Portanto, fica claro que “{titulo}” é um assunto que exige atenção. "
        f"A melhor saída é unir informação, diálogo e ação consciente, "
        f"transformando a ideia inicial em mudanças concretas para {extra}. "
        f"Assim, aquilo que começou como um simples pensamento pode se tornar "
        f"algo verdadeiramente útil."
    )

    paragrafos = [introducao, desenvolvimento_1, desenvolvimento_2, conclusao]
    corpo = "\n\n".join(textwrap.fill(p, width=78) for p in paragrafos)

    return f"REDAÇÃO\n{titulo}\n{'=' * len(titulo)}\n\n{corpo}\n"


# ----------------------------------------------------------------------------
# Transformador: HISTÓRIA
# ----------------------------------------------------------------------------

def gerar_historia(ideia: str) -> str:
    """Transforma a ideia em um conto curto."""
    titulo = tema_curto(ideia)
    chaves = palavras_chave(ideia)
    heroi = (chaves[0] if chaves else "alguém").capitalize()
    lugar = chaves[1] if len(chaves) > 1 else "uma cidade tranquila"
    desafio = chaves[2] if len(chaves) > 2 else "um grande mistério"

    paragrafos = [
        f"Tudo começou em {lugar}, onde {heroi} vivia sem imaginar o que "
        f"estava por vir. A ideia de “{titulo}” havia plantado uma semente "
        f"de curiosidade que não parava de crescer.",
        f"Certo dia, {heroi} se deparou com {desafio}. No início, tudo parecia "
        f"impossível. As dúvidas eram muitas e a coragem, pouca. Mas algo "
        f"dentro de {heroi} insistia em seguir adiante.",
        f"Com esforço e imaginação, {heroi} transformou cada obstáculo em "
        f"aprendizado. O que antes assustava virou desafio; o que era dúvida "
        f"virou descoberta.",
        f"No fim, {heroi} percebeu que a verdadeira aventura era a própria "
        f"jornada. E assim, “{titulo}” deixou de ser apenas uma ideia para se "
        f"tornar uma história que valia a pena ser contada.",
    ]
    corpo = "\n\n".join(textwrap.fill(p, width=78) for p in paragrafos)
    return f"HISTÓRIA\n{titulo}\n{'=' * len(titulo)}\n\n{corpo}\n"


# ----------------------------------------------------------------------------
# Transformador: POEMA
# ----------------------------------------------------------------------------

def gerar_poema(ideia: str) -> str:
    """Transforma a ideia em um poema simples."""
    titulo = tema_curto(ideia)
    chaves = palavras_chave(ideia) or ["sonho", "ideia", "luz", "caminho"]
    while len(chaves) < 4:
        chaves.append(random.choice(["sonho", "luz", "tempo", "voz", "céu"]))
    a, b, c, d = chaves[0], chaves[1], chaves[2], chaves[3]

    versos = [
        f"No silêncio nasce {a},",
        f"como {b} a brilhar.",
        f"Cada ideia é uma estrada,",
        f"feita pra se caminhar.",
        "",
        f"Se o {c} parecer distante,",
        f"e o {d} demorar,",
        "lembra que todo instante",
        "é semente pra plantar.",
    ]
    return f"POEMA\n{titulo}\n{'=' * len(titulo)}\n\n" + "\n".join(versos) + "\n"


# ----------------------------------------------------------------------------
# Transformador: PLANO DE AÇÃO
# ----------------------------------------------------------------------------

def gerar_plano(ideia: str) -> str:
    """Transforma a ideia em um plano de ação prático (passo a passo)."""
    titulo = tema_curto(ideia)
    chaves = palavras_chave(ideia)
    alvo = chaves[0] if chaves else "o objetivo"

    etapas = [
        f"Definir com clareza o que significa sucesso para “{titulo}”.",
        f"Pesquisar referências e exemplos parecidos com {alvo}.",
        "Listar os recursos necessários (tempo, ferramentas, ajuda).",
        "Dividir a ideia em tarefas pequenas e fáceis de começar.",
        "Executar a primeira tarefa hoje mesmo, mesmo que pequena.",
        "Revisar o progresso a cada semana e ajustar o que for preciso.",
        "Comemorar cada conquista para manter a motivação.",
    ]
    linhas = "\n".join(f"  [ ] {i}. {e}" for i, e in enumerate(etapas, 1))
    return (
        f"PLANO DE AÇÃO\n{titulo}\n{'=' * len(titulo)}\n\n"
        f"Objetivo: transformar a ideia em realidade.\n\n{linhas}\n"
    )


# ----------------------------------------------------------------------------
# Transformador: APRESENTAÇÃO (roteiro de slides)
# ----------------------------------------------------------------------------

def gerar_apresentacao(ideia: str) -> str:
    """Transforma a ideia em um roteiro de slides."""
    titulo = tema_curto(ideia)
    chaves = palavras_chave(ideia)
    p1 = chaves[0] if chaves else "o tema"
    p2 = chaves[1] if len(chaves) > 1 else "os benefícios"
    p3 = chaves[2] if len(chaves) > 2 else "os próximos passos"

    slides = [
        ("Capa", [titulo, f"Apresentado em {_agora()}"]),
        ("O Problema", [f"Por que falar sobre {p1}?", "Contexto e motivação"]),
        ("A Ideia", [f"O que é “{titulo}”", "Em uma frase simples"]),
        ("Como Funciona", [f"Foco em {p2}", "Passo a passo", "Exemplo prático"]),
        ("Benefícios", ["O que melhora", "Para quem", "Resultados esperados"]),
        ("Próximos Passos", [f"O que fazer com {p3}", "Chamada para ação"]),
        ("Obrigado!", ["Perguntas?", "Contato"]),
    ]
    partes = []
    for i, (tit, bullets) in enumerate(slides, 1):
        marcadores = "\n".join(f"     • {b}" for b in bullets)
        partes.append(f"  SLIDE {i} — {tit}\n{marcadores}")
    corpo = "\n\n".join(partes)
    return f"APRESENTAÇÃO (roteiro de slides)\n{titulo}\n{'=' * len(titulo)}\n\n{corpo}\n"


# ----------------------------------------------------------------------------
# Transformador: JOGO (gera um arquivo HTML jogável)
# ----------------------------------------------------------------------------

def gerar_jogo_html(ideia: str) -> str:
    """
    Transforma a ideia em um JOGO de adivinhação jogável (arquivo HTML).
    Devolve o conteúdo HTML completo — basta salvar como .html e abrir no
    navegador para jogar.
    """
    titulo = tema_curto(ideia)
    chaves = palavras_chave(ideia, maximo=8)
    if not chaves:
        chaves = ["ideia", "jogo", "diversao"]
    # A palavra secreta é a palavra-chave mais "forte" (a mais longa).
    secreta = max(chaves, key=len)
    dicas = [c for c in chaves if c != secreta][:4] or ["pense no tema"]

    dados = json.dumps(
        {"secreta": secreta, "dicas": dicas, "tema": titulo},
        ensure_ascii=False,
    )
    titulo_esc = html.escape(titulo)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Jogo: {titulo_esc}</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{
    font-family: system-ui, Arial, sans-serif; background: #0f172a; color: #e2e8f0;
    display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;
  }}
  .card {{
    background: #1e293b; padding: 32px; border-radius: 18px; max-width: 460px;
    width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.4);
  }}
  h1 {{ font-size: 22px; margin: 0 0 4px; }}
  .sub {{ color: #94a3b8; font-size: 14px; margin-bottom: 20px; }}
  .palavra {{ font-size: 34px; letter-spacing: 8px; margin: 18px 0; font-weight: 700; }}
  input {{
    padding: 12px; font-size: 18px; border-radius: 10px; border: none; width: 70%;
    text-align: center; text-transform: lowercase;
  }}
  button {{
    padding: 12px 18px; font-size: 16px; border: none; border-radius: 10px;
    background: #38bdf8; color: #0f172a; font-weight: 700; cursor: pointer; margin-top: 14px;
  }}
  button:hover {{ background: #7dd3fc; }}
  .msg {{ margin-top: 16px; min-height: 24px; font-weight: 600; }}
  .dica {{ color: #fbbf24; font-size: 14px; margin-top: 10px; }}
  .ok {{ color: #4ade80; }} .erro {{ color: #f87171; }}
</style>
</head>
<body>
  <div class="card">
    <h1>🎮 Jogo da Adivinhação</h1>
    <div class="sub">Tema: {titulo_esc}</div>
    <div class="palavra" id="palavra"></div>
    <div>
      <input id="chute" maxlength="1" placeholder="?" autocomplete="off">
      <div><button onclick="tentar()">Tentar letra</button></div>
    </div>
    <div class="dica" id="dica"></div>
    <div class="msg" id="msg"></div>
    <div>Tentativas restantes: <b id="vidas">6</b></div>
    <button onclick="location.reload()" style="background:#475569;color:#fff;margin-top:18px">🔁 Jogar de novo</button>
  </div>
<script>
  const DADOS = {dados};
  const secreta = DADOS.secreta.toLowerCase();
  let descobertas = new Set();
  let vidas = 6;
  let idxDica = 0;

  function render() {{
    document.getElementById('palavra').textContent =
      secreta.split('').map(l => descobertas.has(l) ? l : '_').join(' ');
    document.getElementById('vidas').textContent = vidas;
  }}

  function tentar() {{
    const campo = document.getElementById('chute');
    const letra = (campo.value || '').toLowerCase().trim();
    campo.value = '';
    if (!letra || letra.length !== 1) return;
    const msg = document.getElementById('msg');

    if (secreta.includes(letra)) {{
      descobertas.add(letra);
      msg.textContent = 'Boa! A letra existe.'; msg.className = 'msg ok';
    }} else {{
      vidas--;
      msg.textContent = 'Essa letra não tem...'; msg.className = 'msg erro';
      // A cada erro, revela uma dica.
      if (idxDica < DADOS.dicas.length) {{
        document.getElementById('dica').textContent = '💡 Dica: ' + DADOS.dicas[idxDica];
        idxDica++;
      }}
    }}
    render();

    const venceu = secreta.split('').every(l => descobertas.has(l));
    if (venceu) {{
      msg.textContent = '🎉 Você venceu! A palavra era: ' + secreta;
      msg.className = 'msg ok';
    }} else if (vidas <= 0) {{
      msg.textContent = '💀 Fim de jogo! A palavra era: ' + secreta;
      msg.className = 'msg erro';
      descobertas = new Set(secreta.split(''));
      render();
    }}
  }}

  document.getElementById('chute').addEventListener('keydown', e => {{
    if (e.key === 'Enter') tentar();
  }});
  render();
</script>
</body>
</html>
"""


# ----------------------------------------------------------------------------
# Registro dos transformadores ("apps" disponíveis)
# ----------------------------------------------------------------------------

# Cada transformador tem: nome amigável, função, e o tipo de saída.
#   tipo "texto" -> mostra/salva como .txt
#   tipo "html"  -> salva como .html (abre no navegador)
TRANSFORMADORES = {
    "Redação":       {"func": gerar_redacao,     "tipo": "texto", "emoji": "📝"},
    "História":      {"func": gerar_historia,    "tipo": "texto", "emoji": "📖"},
    "Poema":         {"func": gerar_poema,       "tipo": "texto", "emoji": "🪶"},
    "Plano de Ação": {"func": gerar_plano,        "tipo": "texto", "emoji": "✅"},
    "Apresentação":  {"func": gerar_apresentacao, "tipo": "texto", "emoji": "📊"},
    "Jogo (HTML)":   {"func": gerar_jogo_html,    "tipo": "html",  "emoji": "🎮"},
}


def _carregar_personalizados() -> dict:
    """
    Carrega transformadores criados por VOCÊ, sem precisar programar.

    Basta criar um arquivo 'minhas_ideias.json' na mesma pasta do app, com uma
    lista de itens assim:

        [
          {
            "nome": "Meu Gerador",
            "emoji": "✨",
            "modelo": "Minha ideia: {ideia}\\nFoco em {chave1} e {chave2}."
          }
        ]

    Placeholders que você pode usar no "modelo":
        {ideia}            -> o texto completo que a pessoa escreveu
        {titulo}           -> um título curto da ideia
        {chave1}..{chave6} -> as palavras mais importantes da ideia

    Cada item vira um novo "app" dentro do programa. Assim qualquer pessoa pode
    inventar suas próprias ideias e aumentar a criatividade!
    """
    import json
    import os

    caminho = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "minhas_ideias.json"
    )
    if not os.path.exists(caminho):
        return {}
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            itens = json.load(f)
    except Exception:
        return {}  # arquivo com erro: ignora, sem quebrar o app

    personalizados: dict = {}
    for item in itens:
        nome = str(item.get("nome", "")).strip()
        modelo = str(item.get("modelo", ""))
        if not nome or not modelo:
            continue
        personalizados[nome] = {
            "func": _criar_funcao_modelo(modelo),
            "tipo": "html" if "<html" in modelo.lower() else "texto",
            "emoji": item.get("emoji", "⭐"),
        }
    return personalizados


def _criar_funcao_modelo(modelo: str):
    """Cria uma função geradora a partir de um 'modelo' com placeholders."""
    def gerar(ideia: str) -> str:
        ch = palavras_chave(ideia, maximo=6)
        while len(ch) < 6:
            ch.append("ideia")
        valores = {
            "ideia": ideia.strip(),
            "titulo": tema_curto(ideia),
            "chave1": ch[0], "chave2": ch[1], "chave3": ch[2],
            "chave4": ch[3], "chave5": ch[4], "chave6": ch[5],
        }
        texto = modelo
        for chave, valor in valores.items():
            texto = texto.replace("{" + chave + "}", str(valor))
        return texto

    return gerar


def catalogo_completo() -> dict:
    """
    Junta TODOS os transformadores disponíveis: núcleo + módulos extras +
    criativos + os personalizados que o usuário criar em 'minhas_ideias.json'.

    Faz a importação dos extras de forma "preguiçosa" (só quando chamada) para
    evitar importação circular, já que os extras importam este módulo. Se algum
    módulo não existir, o app continua funcionando com o que houver.

    Retorna um único dicionário {nome: {func, tipo, emoji}}.
    """
    catalogo = dict(TRANSFORMADORES)
    for modulo, atributo in (
        ("transformadores_extra", "TRANSFORMADORES_EXTRA"),
        ("transformadores_extra2", "TRANSFORMADORES_EXTRA2"),
        ("transformadores_criativos", "TRANSFORMADORES_CRIATIVOS"),
    ):
        try:
            mod = __import__(modulo)
            catalogo.update(getattr(mod, atributo))
        except Exception:  # módulo extra ausente ou com erro: ignora
            pass
    # Por último, os transformadores criados pelo próprio usuário.
    try:
        catalogo.update(_carregar_personalizados())
    except Exception:
        pass
    return catalogo


def transformar(nome_app: str, ideia: str) -> dict:
    """
    Aplica o transformador escolhido à ideia.

    Retorna um dicionário: {"conteudo": str, "tipo": "texto"|"html"}.
    Lança ValueError se a ideia estiver vazia ou o app não existir.
    """
    if not ideia or not ideia.strip():
        raise ValueError("Escreva uma ideia primeiro.")
    catalogo = catalogo_completo()
    if nome_app not in catalogo:
        raise ValueError(f"App desconhecido: {nome_app}")
    info = catalogo[nome_app]
    return {"conteudo": info["func"](ideia), "tipo": info["tipo"]}


# ----------------------------------------------------------------------------
# Teste rápido pelo terminal:  python3 transformadores.py "sua ideia aqui"
# ----------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    ideia_demo = " ".join(sys.argv[1:]) or "Um aplicativo que ajuda crianças a aprender a reciclar lixo de forma divertida"
    print(f'IDEIA: {ideia_demo}\n')
    for nome in TRANSFORMADORES:
        print("#" * 70)
        print(f"# APP SELECIONADO: {nome}")
        print("#" * 70)
        resultado = transformar(nome, ideia_demo)
        if resultado["tipo"] == "html":
            print(f"(gerado HTML jogável com {len(resultado['conteudo'])} caracteres — salve como .html)\n")
        else:
            print(resultado["conteudo"])
        print()
