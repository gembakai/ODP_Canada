#!/usr/bin/env bash
set -o errexit  # Salir si ocurre un error

# Instalar dependencias
npm install

# Preparar fuentes (si es necesario)
echo "Verificando fuentes para pdfmake..."
if [ ! -d "./fonts" ]; then
  echo "Directorio de fuentes no encontrado, asegurando recursos..."
  mkdir -p fonts
  cp -r /path_to_fonts_in_repo/* ./fonts/
else
  echo "Fuentes listas."
fi
