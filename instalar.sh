#!/usr/bin/env bash
#
# Instalador do Transformador de Ideias (Linux e macOS)
# -----------------------------------------------------
# Prepara tudo que o app precisa para rodar:
#   - Verifica o Python 3
#   - Instala o Tkinter (interface grafica) se faltar
#   - Cria um atalho/launcher para abrir o app facilmente
#
# Uso:
#   chmod +x instalar.sh
#   ./instalar.sh
#
set -u

PASTA="$(cd "$(dirname "$0")" && pwd)"
APP="$PASTA/transformador_de_ideias.py"

echo "================================================================"
echo "   INSTALADOR  -  Transformador de Ideias  (Linux/macOS)"
echo "================================================================"
echo

# ---- 1) Verifica o Python 3 -----------------------------------------
echo "[1/4] Verificando o Python 3..."
if command -v python3 >/dev/null 2>&1; then
    echo "   Encontrado: $(python3 --version)"
else
    echo "   Python 3 NAO encontrado."
    echo "   Tentando instalar..."
    if command -v apt >/dev/null 2>&1; then
        sudo apt update && sudo apt install -y python3
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y python3
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -S --noconfirm python
    elif command -v brew >/dev/null 2>&1; then
        brew install python
    else
        echo "   Nao consegui instalar automaticamente."
        echo "   Instale o Python 3 manualmente: https://www.python.org/downloads/"
        exit 1
    fi
fi

# ---- 2) Verifica/instala o Tkinter ----------------------------------
echo
echo "[2/4] Verificando a interface grafica (Tkinter)..."
if python3 -c "import tkinter" >/dev/null 2>&1; then
    echo "   Tkinter OK (interface grafica disponivel)."
else
    echo "   Tkinter ausente. Tentando instalar..."
    if command -v apt >/dev/null 2>&1; then
        sudo apt install -y python3-tk
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y python3-tkinter
    elif command -v pacman >/dev/null 2>&1; then
        sudo pacman -S --noconfirm tk
    elif command -v brew >/dev/null 2>&1; then
        brew install python-tk
    else
        echo "   Nao consegui instalar o Tkinter automaticamente."
        echo "   Sem problema: o app vai funcionar no MODO TERMINAL."
    fi
    if python3 -c "import tkinter" >/dev/null 2>&1; then
        echo "   Tkinter instalado com sucesso!"
    else
        echo "   Aviso: seguira sem janela grafica (modo terminal)."
    fi
fi

# ---- 3) IA local GRATIS (Ollama) — sem chave, sem pagar -------------
echo
echo "[3/4] IA de verdade, GRATIS e SEM CHAVE (Ollama)..."
echo "   Isso permite usar IA de verdade sem precisar de chave nenhuma."
echo "   Atencao: baixa alguns GB (o programa da IA + o modelo)."
read -r -p "   Quer instalar a IA local agora? (s/n): " QUER_IA
case "$QUER_IA" in
  s|S|sim|SIM)
    if command -v ollama >/dev/null 2>&1; then
        echo "   Ollama ja instalado."
    elif [ "$(uname)" = "Darwin" ]; then
        if command -v brew >/dev/null 2>&1; then
            brew install ollama
        else
            echo "   Baixe o Ollama em: https://ollama.com/download"
        fi
    else
        echo "   Instalando Ollama (Linux)..."
        curl -fsSL https://ollama.com/install.sh | sh
    fi
    # Garante o servico rodando e baixa o modelo.
    if command -v ollama >/dev/null 2>&1; then
        (ollama serve >/dev/null 2>&1 &) ; sleep 3
        echo "   Baixando o modelo de IA (llama3.2)... pode demorar."
        ollama pull llama3.2 && echo "   IA local pronta! Sem chave, de graca. 🎉"
    fi
    ;;
  *)
    echo "   Ok, pulei a IA local. (Da pra instalar depois rodando de novo.)"
    ;;
esac

# ---- 4) Cria o launcher e o atalho ----------------------------------
echo
echo "[4/4] Criando atalho/launcher..."

LAUNCHER="$PASTA/executar.sh"
cat > "$LAUNCHER" <<EOF
#!/usr/bin/env bash
cd "\$(dirname "\$0")"
python3 transformador_de_ideias.py
EOF
chmod +x "$LAUNCHER"
echo "   Launcher criado: $LAUNCHER"

# Atalho de aplicativo (.desktop) no Linux
if [ "$(uname)" = "Linux" ]; then
    APPS_DIR="$HOME/.local/share/applications"
    mkdir -p "$APPS_DIR"
    DESKTOP="$APPS_DIR/transformador-de-ideias.desktop"
    cat > "$DESKTOP" <<EOF
[Desktop Entry]
Type=Application
Name=Transformador de Ideias
Comment=Escreva uma ideia e transforme em redacao, jogo, musica e mais
Exec=python3 "$APP"
Path=$PASTA
Icon=accessories-text-editor
Terminal=false
Categories=Utility;Education;
EOF
    chmod +x "$DESKTOP" 2>/dev/null
    echo "   Atalho criado no menu de aplicativos."
    # Tenta copiar tambem para a Area de Trabalho, se existir.
    for DESK in "$HOME/Desktop" "$HOME/Área de Trabalho" "$HOME/Área de trabalho"; do
        if [ -d "$DESK" ]; then
            cp "$DESKTOP" "$DESK/" 2>/dev/null && chmod +x "$DESK/transformador-de-ideias.desktop" 2>/dev/null
            echo "   Atalho copiado para: $DESK"
            break
        fi
    done
fi

echo
echo "================================================================"
echo "   INSTALACAO CONCLUIDA!"
echo "================================================================"
echo
echo "  Para abrir o app:"
echo "    ./executar.sh"
echo "  ou (Linux) pelo menu de aplicativos: 'Transformador de Ideias'"
echo
read -r -p "Quer abrir o app agora? (s/n): " ABRIR
case "$ABRIR" in
    s|S|sim|SIM) python3 "$APP" ;;
    *) echo "Ok! Bom uso. 👋" ;;
esac
