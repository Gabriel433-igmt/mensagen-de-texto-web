# -*- coding: utf-8 -*-
"""
ia.py
=====
Motor de IA de verdade para o Transformador de Ideias.

Suporta DOIS motores, nesta ordem de preferência:

  1) IA LOCAL (Ollama)  ← recomendado para todo mundo
     - Grátis, sem chave, sem conta, funciona offline.
     - Roda no próprio PC da pessoa. O instalador baixa e configura tudo.
     - É o jeito de uma "pessoa comum" usar IA de verdade SEM precisar de chave.

  2) Nuvem (OpenAI/GPT)  ← opcional, para quem tiver uma chave
     - Precisa de uma chave de API (paga por uso) e internet.
     - A chave fica SÓ no PC (arquivo 'chave_openai.txt', no .gitignore).
     - NUNCA escreva a chave no código nem a deixe pública.

Se nenhum motor estiver disponível, quem chama pode usar os modelos offline
(textos prontos) como reserva.

Não precisa instalar bibliotecas Python: usa apenas a biblioteca padrão
(urllib) para falar com os dois motores.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

# ---- Configurações ---------------------------------------------------------
# IA local (Ollama)
URL_OLLAMA = "http://localhost:11434"
MODELO_OLLAMA = "llama3.2"          # modelo pequeno e bom; trocável

# Nuvem (OpenAI)
URL_OPENAI = "https://api.openai.com/v1/chat/completions"
MODELO_OPENAI = "gpt-4o-mini"
ARQUIVO_CHAVE = "chave_openai.txt"


class ErroIA(Exception):
    """Erro amigável para problemas ao usar a IA."""


def _pasta_app() -> str:
    return os.path.dirname(os.path.abspath(__file__))


# ============================================================================
# IA LOCAL (Ollama) — grátis, sem chave
# ============================================================================

def ollama_disponivel() -> bool:
    """Diz se o Ollama está instalado e rodando no PC (sem chave nenhuma)."""
    try:
        req = urllib.request.Request(f"{URL_OLLAMA}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=2):
            return True
    except Exception:
        return False


def gerar_ollama(prompt: str, *, sistema: str | None = None,
                 modelo: str = MODELO_OLLAMA, timeout: int = 180) -> str:
    """Gera texto com a IA local (Ollama). Não usa chave nem internet."""
    mensagens = []
    if sistema:
        mensagens.append({"role": "system", "content": sistema})
    mensagens.append({"role": "user", "content": prompt})

    corpo = json.dumps({
        "model": modelo,
        "messages": mensagens,
        "stream": False,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{URL_OLLAMA}/api/chat",
        data=corpo,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            dados = json.loads(resp.read().decode("utf-8"))
        return dados["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        detalhe = ""
        try:
            detalhe = e.read().decode("utf-8")
        except Exception:
            pass
        if "model" in detalhe.lower() and "not found" in detalhe.lower():
            raise ErroIA(
                f"O modelo '{modelo}' ainda não foi baixado. Abra o terminal e "
                f"rode:  ollama pull {modelo}"
            )
        raise ErroIA(f"Erro do Ollama (código {e.code}). {detalhe}")
    except urllib.error.URLError:
        raise ErroIA("O Ollama não está rodando. Abra o programa Ollama e tente "
                     "de novo (ou rode o instalador para configurá-lo).")
    except (KeyError, ValueError):
        raise ErroIA("Resposta inesperada da IA local. Tente novamente.")


# ============================================================================
# NUVEM (OpenAI) — opcional, precisa de chave
# ============================================================================

def carregar_chave() -> str | None:
    """Procura a chave da OpenAI no ambiente ou no arquivo local. Pode ser None."""
    chave = os.environ.get("OPENAI_API_KEY", "").strip()
    if chave:
        return chave
    caminho = os.path.join(_pasta_app(), ARQUIVO_CHAVE)
    if os.path.exists(caminho):
        try:
            with open(caminho, "r", encoding="utf-8") as f:
                return f.read().strip() or None
        except OSError:
            return None
    return None


def salvar_chave(chave: str) -> str:
    """Salva a chave no arquivo local (protegido pelo .gitignore)."""
    caminho = os.path.join(_pasta_app(), ARQUIVO_CHAVE)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(chave.strip())
    try:
        os.chmod(caminho, 0o600)
    except OSError:
        pass
    return caminho


def gerar_openai(prompt: str, *, sistema: str | None = None,
                 modelo: str = MODELO_OPENAI, temperatura: float = 0.9,
                 max_tokens: int = 1200, timeout: int = 60) -> str:
    """Gera texto com o GPT (OpenAI). Precisa de chave e internet."""
    chave = carregar_chave()
    if not chave:
        raise ErroIA("Nenhuma chave da OpenAI configurada.")

    mensagens = []
    if sistema:
        mensagens.append({"role": "system", "content": sistema})
    mensagens.append({"role": "user", "content": prompt})

    corpo = json.dumps({
        "model": modelo,
        "messages": mensagens,
        "temperature": temperatura,
        "max_tokens": max_tokens,
    }).encode("utf-8")

    req = urllib.request.Request(
        URL_OPENAI, data=corpo,
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {chave}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            dados = json.loads(resp.read().decode("utf-8"))
        return dados["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        detalhe = ""
        try:
            detalhe = json.loads(e.read().decode("utf-8")).get("error", {}).get("message", "")
        except Exception:
            pass
        if e.code == 401:
            raise ErroIA("Chave inválida ou revogada. Gere uma nova em "
                         "platform.openai.com/api-keys e configure de novo.")
        if e.code == 429:
            raise ErroIA("Limite/cota atingido na conta da OpenAI. " + detalhe)
        raise ErroIA(f"Erro da API (código {e.code}). {detalhe}")
    except urllib.error.URLError:
        raise ErroIA("Sem conexão com a internet para usar o GPT.")
    except (KeyError, IndexError, ValueError):
        raise ErroIA("Resposta inesperada da IA. Tente novamente.")


# ============================================================================
# Escolha automática do motor
# ============================================================================

def motor_disponivel() -> str | None:
    """
    Diz qual motor de IA está pronto para uso:
      "ollama"  -> IA local grátis (preferida)
      "openai"  -> nuvem com chave
      None      -> nenhum (quem chamar deve usar os modelos offline)
    """
    if ollama_disponivel():
        return "ollama"
    if carregar_chave():
        return "openai"
    return None


def ia_disponivel() -> bool:
    """True se houver QUALQUER motor de IA pronto (local ou nuvem)."""
    return motor_disponivel() is not None


SISTEMA = (
    "Você é um assistente criativo e prestativo que ajuda pessoas a "
    "desenvolverem suas ideias. Responda sempre em português do Brasil, de "
    "forma clara, original e útil. Não use texto genérico ou de preenchimento."
)


def montar_prompt(nome_app: str, ideia: str, tipo: str) -> str:
    """Monta o pedido enviado à IA, de acordo com o app escolhido."""
    if tipo == "html":
        return (
            f"A pessoa tem esta ideia: \"{ideia}\".\n\n"
            f"Crie um(a) \"{nome_app}\" sobre essa ideia como uma página web "
            f"COMPLETA e funcional. Responda APENAS com o código HTML (incluindo "
            f"<!DOCTYPE html>, CSS embutido em <style> e, se for um jogo, "
            f"JavaScript embutido em <script>). Não escreva nenhuma explicação "
            f"antes ou depois do código. Deve abrir direto no navegador."
        )
    return (
        f"A pessoa tem esta ideia: \"{ideia}\".\n\n"
        f"Crie um(a) \"{nome_app}\" sobre essa ideia. Seja original, criativo e "
        f"específico para ESTA ideia (nada de texto genérico). Use uma "
        f"formatação agradável para leitura."
    )


def gerar_para_app(nome_app: str, ideia: str, tipo: str) -> str:
    """
    Gera, via IA, o conteúdo do app escolhido. Usa o Ollama (grátis) se houver;
    senão usa a OpenAI (se tiver chave). Lança ErroIA se nenhum estiver pronto.
    """
    prompt = montar_prompt(nome_app, ideia, tipo)
    motor = motor_disponivel()
    if motor == "ollama":
        texto = gerar_ollama(prompt, sistema=SISTEMA)
    elif motor == "openai":
        texto = gerar_openai(prompt, sistema=SISTEMA)
    else:
        raise ErroIA(
            "Nenhuma IA disponível. Instale a IA local grátis (Ollama) pelo "
            "instalador, ou configure uma chave da OpenAI."
        )

    if tipo == "html":
        texto = texto.strip()
        if texto.startswith("```"):
            texto = texto.split("\n", 1)[-1]
            if texto.endswith("```"):
                texto = texto.rsplit("```", 1)[0]
        texto = texto.strip()
    return texto
