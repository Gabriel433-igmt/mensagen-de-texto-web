# -*- coding: utf-8 -*-
"""
Transformador de Ideias  —  app de desktop (PC)
===============================================

O que faz:
  1) Você ESCREVE uma ideia.
  2) Você SELECIONA um "app"/transformador (Redação, Jogo, História, Quiz,
     Música, Receita, Código e muito mais) — ou escolhe um PROGRAMA do seu PC.
  3) O app TRANSFORMA a ideia naquilo que o transformador escolhido faz.

Como rodar:
    python3 transformador_de_ideias.py

Se o computador não tiver interface gráfica (Tkinter), este mesmo arquivo
cai automaticamente no MODO TERMINAL, garantindo que o app sempre funcione.
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import webbrowser

# Garante que os módulos vizinhos sejam encontrados, mesmo rodando de fora.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import transformadores as core  # noqa: E402

# Tenta carregar a interface gráfica. Se não houver Tkinter, usamos o terminal.
try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk

    TEM_GUI = True
except Exception:  # pragma: no cover - ambiente sem Tkinter
    TEM_GUI = False


APP_EXTERNO = "📂 App do meu PC (programa externo)"


# ============================================================================
# INTERFACE GRÁFICA
# ============================================================================

if TEM_GUI:

    class TransformadorApp(tk.Tk):
        # Cores do tema escuro.
        BG = "#0f172a"
        PAINEL = "#1e293b"
        TEXTO = "#e2e8f0"
        DESTAQUE = "#38bdf8"
        SAIDA_BG = "#0b1220"

        def __init__(self) -> None:
            super().__init__()
            self.title("Transformador de Ideias")
            self.geometry("880x680")
            self.minsize(700, 560)
            self.configure(bg=self.BG)

            self.catalogo = core.catalogo_completo()
            self.ultimo_resultado: dict | None = None

            self._construir_interface()
            self._adicionar_menu()
            self.bind("<Control-Return>", lambda e: self.transformar())

        # ---------------------------------------------------------- interface
        def _construir_interface(self) -> None:
            # ---- Cabeçalho ----
            cabecalho = tk.Frame(self, bg=self.BG)
            cabecalho.pack(fill="x", padx=20, pady=(18, 6))
            tk.Label(
                cabecalho, text="💡 Transformador de Ideias",
                font=("Segoe UI", 20, "bold"), fg=self.DESTAQUE, bg=self.BG,
            ).pack(anchor="w")
            tk.Label(
                cabecalho,
                text=f"Escreva uma ideia, escolha um dos {len(self.catalogo)} apps "
                     "e veja a mágica acontecer.",
                font=("Segoe UI", 11), fg="#94a3b8", bg=self.BG,
            ).pack(anchor="w")

            # ---- Entrada da ideia ----
            bloco_ideia = tk.Frame(self, bg=self.BG)
            bloco_ideia.pack(fill="x", padx=20, pady=(10, 6))
            linha_topo = tk.Frame(bloco_ideia, bg=self.BG)
            linha_topo.pack(fill="x")
            tk.Label(
                linha_topo, text="1) Sua ideia:", font=("Segoe UI", 11, "bold"),
                fg=self.TEXTO, bg=self.BG,
            ).pack(side="left")
            tk.Button(
                linha_topo, text="🎲 Ideia aleatória", font=("Segoe UI", 9),
                bg="#334155", fg=self.TEXTO, relief="flat", cursor="hand2",
                command=self.ideia_aleatoria,
            ).pack(side="right")

            self.txt_ideia = tk.Text(
                bloco_ideia, height=4, wrap="word", font=("Segoe UI", 11),
                bg=self.PAINEL, fg=self.TEXTO, insertbackground=self.TEXTO,
                relief="flat", padx=10, pady=8,
            )
            self.txt_ideia.pack(fill="x", pady=(4, 0))
            self.txt_ideia.insert(
                "1.0",
                "Ex: um app que ajuda crianças a aprender reciclagem de forma divertida",
            )

            # ---- Seleção do app ----
            bloco_app = tk.Frame(self, bg=self.BG)
            bloco_app.pack(fill="x", padx=20, pady=(10, 6))
            tk.Label(
                bloco_app, text="2) Escolha o app:",
                font=("Segoe UI", 11, "bold"), fg=self.TEXTO, bg=self.BG,
            ).pack(anchor="w")

            linha = tk.Frame(bloco_app, bg=self.BG)
            linha.pack(fill="x", pady=(4, 0))

            self.opcoes = [
                f"{info['emoji']} {nome}" for nome, info in self.catalogo.items()
            ] + [APP_EXTERNO]
            self.var_app = tk.StringVar(value=self.opcoes[0])
            self.combo = ttk.Combobox(
                linha, textvariable=self.var_app, values=self.opcoes,
                state="readonly", font=("Segoe UI", 11),
            )
            self.combo.pack(side="left", fill="x", expand=True)

            tk.Button(
                linha, text="✨ Transformar (Ctrl+Enter)",
                font=("Segoe UI", 11, "bold"), bg=self.DESTAQUE, fg="#0f172a",
                relief="flat", padx=16, pady=6, activebackground="#7dd3fc",
                cursor="hand2", command=self.transformar,
            ).pack(side="left", padx=(10, 0))

            # ---- Resultado ----
            bloco_res = tk.Frame(self, bg=self.BG)
            bloco_res.pack(fill="both", expand=True, padx=20, pady=(10, 6))
            tk.Label(
                bloco_res, text="3) Resultado:", font=("Segoe UI", 11, "bold"),
                fg=self.TEXTO, bg=self.BG,
            ).pack(anchor="w")

            quadro = tk.Frame(bloco_res, bg=self.BG)
            quadro.pack(fill="both", expand=True, pady=(4, 0))
            scroll = tk.Scrollbar(quadro)
            scroll.pack(side="right", fill="y")
            self.txt_saida = tk.Text(
                quadro, wrap="word", font=("Consolas", 11), bg=self.SAIDA_BG,
                fg=self.TEXTO, insertbackground=self.TEXTO, relief="flat",
                padx=12, pady=10, yscrollcommand=scroll.set,
            )
            self.txt_saida.pack(fill="both", expand=True)
            scroll.config(command=self.txt_saida.yview)

            # ---- Botões de ação ----
            rodape = tk.Frame(self, bg=self.BG)
            rodape.pack(fill="x", padx=20, pady=(0, 16))
            self._botao(rodape, "💾 Salvar", self.salvar).pack(side="left")
            self._botao(rodape, "📋 Copiar", self.copiar).pack(side="left", padx=8)
            self._botao(rodape, "🌐 Abrir jogo", self.abrir_no_navegador).pack(side="left")
            self._botao(rodape, "🧹 Limpar", self.limpar).pack(side="right")

            # ---- Barra de status ----
            self.status = tk.Label(
                self, text="Pronto.", font=("Segoe UI", 9), fg="#64748b",
                bg=self.BG, anchor="w",
            )
            self.status.pack(fill="x", padx=20, pady=(0, 8))

        def _botao(self, pai, texto, comando):
            return tk.Button(
                pai, text=texto, font=("Segoe UI", 10), bg="#334155",
                fg=self.TEXTO, relief="flat", padx=12, pady=6,
                activebackground="#475569", cursor="hand2", command=comando,
            )

        def _adicionar_menu(self) -> None:
            menu = tk.Menu(self)
            ajuda = tk.Menu(menu, tearoff=0)
            ajuda.add_command(label="Sobre", command=self._sobre)
            ajuda.add_command(
                label="Lista de apps",
                command=lambda: messagebox.showinfo(
                    "Apps disponíveis",
                    "\n".join(f"{i['emoji']} {n}" for n, i in self.catalogo.items()),
                ),
            )
            menu.add_cascade(label="Ajuda", menu=ajuda)
            self.config(menu=menu)

        def _sobre(self) -> None:
            messagebox.showinfo(
                "Sobre",
                "Transformador de Ideias\n\n"
                "Escreva uma ideia, escolha um app e ele transforma a ideia\n"
                "em redação, jogo, história, música, código e muito mais.\n\n"
                f"Total de apps: {len(self.catalogo)}",
            )

        def _set_status(self, msg: str) -> None:
            self.status.config(text=msg)

        # -------------------------------------------------------------- ações
        def _nome_app_selecionado(self) -> str:
            rotulo = self.var_app.get()
            if rotulo == APP_EXTERNO:
                return APP_EXTERNO
            return rotulo.split(" ", 1)[1]

        def ideia_aleatoria(self) -> None:
            exemplos = [
                "um app que ajuda crianças a aprender reciclagem de forma divertida",
                "uma horta comunitária no bairro para cultivar alimentos",
                "um jogo que ensina matemática para adolescentes",
                "um site que conecta voluntários a abrigos de animais",
                "um caderno digital que organiza receitas de família",
                "um robô que rega plantas sozinho quando a terra seca",
            ]
            import random
            self.txt_ideia.delete("1.0", "end")
            self.txt_ideia.insert("1.0", random.choice(exemplos))
            self._set_status("Ideia aleatória inserida.")

        def transformar(self) -> None:
            ideia = self.txt_ideia.get("1.0", "end").strip()
            nome = self._nome_app_selecionado()

            if nome == APP_EXTERNO:
                self._usar_app_externo(ideia)
                return

            try:
                resultado = core.transformar(nome, ideia)
            except ValueError as erro:
                messagebox.showwarning("Atenção", str(erro))
                return

            self.ultimo_resultado = resultado
            self.txt_saida.delete("1.0", "end")
            if resultado["tipo"] == "html":
                self.txt_saida.insert(
                    "1.0",
                    "🎮 Conteúdo interativo (HTML) gerado com sucesso!\n\n"
                    "• Clique em '🌐 Abrir jogo' para abrir no navegador.\n"
                    "• Ou em '💾 Salvar' para guardar o arquivo .html.\n\n"
                    "----- prévia do código -----\n\n"
                    + resultado["conteudo"][:1200] + "\n...",
                )
                self._set_status(f"'{nome}' gerou um HTML jogável.")
            else:
                self.txt_saida.insert("1.0", resultado["conteudo"])
                self._set_status(f"'{nome}' aplicado com sucesso.")

        def _usar_app_externo(self, ideia: str) -> None:
            if not ideia:
                messagebox.showwarning("Atenção", "Escreva uma ideia primeiro.")
                return
            caminho = filedialog.askopenfilename(
                title="Escolha um programa do seu PC",
                filetypes=[("Programas", "*.exe *.bat *.cmd *.sh *.app *"),
                           ("Todos", "*.*")],
            )
            if not caminho:
                return
            tmp = tempfile.NamedTemporaryFile(
                mode="w", suffix="_ideia.txt", delete=False, encoding="utf-8"
            )
            tmp.write(ideia)
            tmp.close()
            try:
                subprocess.Popen([caminho, tmp.name])
                self.txt_saida.delete("1.0", "end")
                self.txt_saida.insert(
                    "1.0",
                    f"✅ Programa aberto:\n{caminho}\n\n"
                    f"A ideia foi salva em:\n{tmp.name}\n"
                    f"e passada como argumento para o programa.\n",
                )
                self._set_status("Programa externo aberto com a ideia.")
            except OSError as erro:
                messagebox.showerror(
                    "Erro ao abrir o programa",
                    f"Não foi possível abrir:\n{caminho}\n\n{erro}",
                )

        def salvar(self) -> None:
            if not self.ultimo_resultado:
                messagebox.showinfo("Nada para salvar", "Gere um resultado primeiro.")
                return
            tipo = self.ultimo_resultado["tipo"]
            ext = ".html" if tipo == "html" else ".txt"
            caminho = filedialog.asksaveasfilename(
                defaultextension=ext,
                filetypes=[("HTML", "*.html")] if tipo == "html"
                else [("Texto", "*.txt")],
                title="Salvar resultado",
            )
            if not caminho:
                return
            with open(caminho, "w", encoding="utf-8") as f:
                f.write(self.ultimo_resultado["conteudo"])
            messagebox.showinfo("Salvo!", f"Arquivo salvo em:\n{caminho}")
            self._set_status(f"Salvo em {caminho}")

        def abrir_no_navegador(self) -> None:
            if not self.ultimo_resultado or self.ultimo_resultado["tipo"] != "html":
                messagebox.showinfo(
                    "Apenas jogos/HTML",
                    "Selecione um app que gere HTML (ex: 'Jogo (HTML)', 'Quiz (HTML)', "
                    "'Jogo da Memória') e transforme primeiro.",
                )
                return
            tmp = tempfile.NamedTemporaryFile(
                mode="w", suffix=".html", delete=False, encoding="utf-8"
            )
            tmp.write(self.ultimo_resultado["conteudo"])
            tmp.close()
            webbrowser.open(f"file://{tmp.name}")
            self._set_status("Aberto no navegador.")

        def copiar(self) -> None:
            conteudo = self.txt_saida.get("1.0", "end").strip()
            if not conteudo:
                return
            self.clipboard_clear()
            self.clipboard_append(conteudo)
            self._set_status("Copiado para a área de transferência.")

        def limpar(self) -> None:
            self.txt_ideia.delete("1.0", "end")
            self.txt_saida.delete("1.0", "end")
            self.ultimo_resultado = None
            self._set_status("Limpo.")


def main() -> None:
    """Abre a interface gráfica; se não houver Tkinter, usa o terminal."""
    if TEM_GUI:
        TransformadorApp().mainloop()
    else:
        print("Interface gráfica (Tkinter) não encontrada — abrindo modo terminal.\n")
        import transformador_cli
        transformador_cli.executar()


if __name__ == "__main__":
    main()
