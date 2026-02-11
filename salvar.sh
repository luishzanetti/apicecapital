#!/bin/bash
echo "📦 Salvando suas alterações no GitHub..."
git add .
git commit -m "update $(date '+%d/%m/%Y %H:%M')"
git push origin main
echo "✅ Salvo com sucesso!"
