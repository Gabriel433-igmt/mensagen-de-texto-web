# -*- coding: utf-8 -*-
"""
ia.py
=====
Motor de IA de verdade para o Transformador de Ideias.

Quando há uma chave de API configurada, este módulo envia a ideia da pessoa
para o modelo GPT (OpenAI) e devolve um texto ORIGINAL — diferente a cada vez,
de verdade, em vez de um texto pronto.

SEGURANÇA:
  - A chave NUNCA fica escrita no código.
  - Ela é lida (nesta ordem) de:
        1) a variável de ambiente OPENAI_API_KEY, ou
        2) um arquivo local chamado 'chave_openai.txt' na pasta do app.
  - O arquivo 'chave_openai.txt' está no .gitignore: ele nunca vai para o
    GitHub.

Não precisa instalar nada: usa apenas a biblioteca padrão do Python (urllib)
para falar com a API.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

# Modelo padrão: barato e bom. Pode trocar em config (ex.: "gpt-4o").
MODELO_PADRAO = "gpt-4o-mini"
URL_API = "https://api.openai.com/v1/chat/completions"
ARQUIVO_CHAVE = "chave_openai.txt"


def _pasta_app() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def carregar_chave() -> str | None:
    """Procura a chave da API no ambiente ou no arquivo local. Pode ser None."""
    chave = os.environ.get("OPENAI_API_KEY", "").strip()
    if chave:
        return chave
    caminho = os.path.join(_pasta_app(), ARQUIVO_CHAVE)
    if os.path.exists(caminho):
        try:
            with open(caminho, "r", encoding="utf-8") as f:
                conteudo = f.read().strip()
            return conteudo or None
        except OSError:
            return None
    return None


def salvar_chave(chave: str) -> str:
    """Salva a chave no arquivo local (protegido pelo .gitignore)."""
    caminho = os.path.join(_pasta_app(), ARQUIVO_CHAVE)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(chave.strip())
    # Em sistemas Unix, restringe a leitura ao próprio usuário.
    try:
        os.chmod(caminho, 0o600)
    except OSError:
        pass
    return caminho


def ia_disponivel() -> bool:
    """Diz se há uma chave configurada (não testa a internet)."""
    return carregar_chave() is not None


class ErroIA(Exception):
    """Erro amigável para problemas ao usar a IA."""


def gerar(prompt: str, *, sistema: str | None = None,
          modelo: str = MODELO_PADRAO, temperatura: float = 0.9,
          max_tokens: int = 1200, timeout: int = 60) -> str:
    """
    Envia o prompt para o GPT e devolve o texto gerado.

    Lança ErroIA com uma mensagem clara se algo der errado (sem chave, sem
    internet, chave inválida, etc.).
    """
    chave = carregar_chave()
    if not chave:
        raise ErroIA(
            "Nenhuma chave de IA configurada. Clique em 'Configurar chave' e "
            "cole sua chave da OpenAI (começa com 'sk-')."
        )

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

    requisicao = urllib.request.Request(
        URL_API,
        data=corpo,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {chave}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(requisicao, timeout=timeout) as resp:
            dados = json.loads(resp.read().decode("utf-8"))
        return dados["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        detalhe = ""
        try:
            erro_json = json.loads(e.read().decode("utf-8"))
            detalhe = erro_json.get("error", {}).get("message", "")
        except Exception:
            pass
        if e.code == 401:
            raise ErroIA("Chave inválida ou revogada. Gere uma nova em "
                         "platform.openai.com/api-keys e configure de novo.")
        if e.code == 429:
            raise ErroIA("Limite/cota atingido na sua conta da OpenAI "
                         "(verifique seus créditos). Detalhe: " + detalhe)
        raise ErroIA(f"Erro da API (código {e.code}). {detalhe}")
    except urllib.error.URLError:
        raise ErroIA("Sem conexão com a internet. A IA precisa de internet "
                     "para funcionar (ou desligue o modo IA para usar offline).")
    except (KeyError, IndexError, ValueError):
        raise ErroIA("Resposta inesperada da IA. Tente novamente.")


# ----------------------------------------------------------------------------
# Construção do "pedido" (prompt) para cada tipo de transformador
# ----------------------------------------------------------------------------

SISTEMA = (
    "Você é um assistente criativo e prestativo que ajuda pessoas a "
    "desenvolverem suas ideias. Responda sempre em português do Brasil, de "
    "forma clara, original e útil. Não use texto genérico ou de preenchimento."
)


def montar_prompt(nome_app: str, ideia: str, tipo: str) -> str:
    """Monta o pedido enviado ao GPT, de acordo com o app escolhido."""
    if tipo == "html":
        return (
            f"A pessoa tem esta ideia: \"{ideia}\".\n\n"
            f"Crie um(a) \"{nome_app}\" sobre essa ideia como uma página web "
            f"COMPLETA e funcional. Responda APENAS com o código HTML (incluindo "
            f"<!DOCTYPE html>, CSS embutido em <style> e, se for um jogo, "
            f"JavaScript embutido em <script>). Não escreva nenhuma explicação "
            f"antes ou depois do código. O resultado deve abrir direto no "
            f"navegador e funcionar."
        )
    return (
        f"A pessoa tem esta ideia: \"{ideia}\".\n\n"
        f"Crie um(a) \"{nome_app}\" sobre essa ideia. Seja original, criativo e "
        f"específico para ESTA ideia (nada de texto genérico). Use uma "
        f"formatação agradável para leitura."
    )


def gerar_para_app(nome_app: str, ideia: str, tipo: str,
                   modelo: str = MODELO_PADRAO) -> str:
    """Gera, via IA, o conteúdo do app escolhido para a ideia dada."""
    prompt = montar_prompt(nome_app, ideia, tipo)
    texto = gerar(prompt, sistema=SISTEMA, modelo=modelo)
    # Para HTML, remove cercas de código que o modelo às vezes adiciona.
    if tipo == "html":
        texto = texto.strip()
        if texto.startswith("```"):
            texto = texto.split("\n", 1)[-1]
            if texto.endswith("```"):
                texto = texto.rsplit("```", 1)[0]
        texto = texto.strip()
    return texto
