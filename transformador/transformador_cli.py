# -*- coding: utf-8 -*-
"""
transformador_cli.py
====================
Modo TERMINAL do Transformador de Ideias.

Serve para quando o computador não tem interface gráfica (Tkinter) ou quando
você prefere usar pelo terminal. Funciona em qualquer lugar onde haja Python 3,
sem instalar nada.

Como usar:
    python3 transformador_cli.py
"""

from __future__ import annotations

import os
import sys
import tempfile
import webbrowser

try:
    import transformadores as core
except ImportError:  # pragma: no cover
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import transformadores as core


LINHA = "═" * 64


def _limpar_tela() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def _cabecalho() -> None:
    print(LINHA)
    print("  💡  TRANSFORMADOR DE IDEIAS  —  modo terminal")
    print(LINHA)


def _listar_apps(catalogo: dict) -> list[str]:
    nomes = list(catalogo.keys())
    print("\n  Apps disponíveis:\n")
    # Mostra em duas colunas para caber mais coisa na tela.
    for i in range(0, len(nomes), 2):
        esquerda = f"  {i + 1:>2}) {catalogo[nomes[i]]['emoji']} {nomes[i]}"
        if i + 1 < len(nomes):
            direita = f"{i + 2:>2}) {catalogo[nomes[i + 1]]['emoji']} {nomes[i + 1]}"
            print(f"{esquerda:<36}{direita}")
        else:
            print(esquerda)
    return nomes


def _salvar(resultado: dict) -> None:
    ext = ".html" if resultado["tipo"] == "html" else ".txt"
    nome = input(f"  Nome do arquivo (Enter = resultado{ext}): ").strip()
    if not nome:
        nome = f"resultado{ext}"
    if not nome.endswith(ext):
        nome += ext
    with open(nome, "w", encoding="utf-8") as f:
        f.write(resultado["conteudo"])
    caminho = os.path.abspath(nome)
    print(f"  ✅ Salvo em: {caminho}")
    if resultado["tipo"] == "html":
        abrir = input("  Abrir no navegador agora? (s/n): ").strip().lower()
        if abrir.startswith("s"):
            webbrowser.open(f"file://{caminho}")


def executar() -> None:
    """Laço principal do modo terminal."""
    catalogo = core.catalogo_completo()

    while True:
        _limpar_tela()
        _cabecalho()

        ideia = input("\n  ✍  Escreva sua ideia (ou 'sair'): ").strip()
        if ideia.lower() in ("sair", "exit", "quit", "q"):
            print("\n  Até a próxima! 👋\n")
            return
        if not ideia:
            print("\n  ⚠ Você precisa escrever uma ideia. Tente de novo.")
            input("  (Enter para continuar)")
            continue

        nomes = _listar_apps(catalogo)
        escolha = input("\n  👉 Escolha o número do app: ").strip()
        if not escolha.isdigit() or not (1 <= int(escolha) <= len(nomes)):
            print("\n  ⚠ Número inválido.")
            input("  (Enter para continuar)")
            continue

        nome_app = nomes[int(escolha) - 1]
        try:
            resultado = core.transformar(nome_app, ideia)
        except ValueError as erro:
            print(f"\n  ⚠ {erro}")
            input("  (Enter para continuar)")
            continue

        print("\n" + LINHA)
        if resultado["tipo"] == "html":
            print("  🎮 Jogo/HTML gerado! (salve para jogar no navegador)")
            print(LINHA)
            print(resultado["conteudo"][:600] + "\n  ...")
        else:
            print(resultado["conteudo"])
        print(LINHA)

        acao = input("\n  [S]alvar  ·  [N]ova ideia  ·  [Q]sair: ").strip().lower()
        if acao.startswith("s"):
            _salvar(resultado)
            input("\n  (Enter para continuar)")
        elif acao.startswith("q"):
            print("\n  Até a próxima! 👋\n")
            return


if __name__ == "__main__":
    try:
        executar()
    except (KeyboardInterrupt, EOFError):
        print("\n\n  Encerrado. 👋\n")
