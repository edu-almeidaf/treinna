#!/usr/bin/env bash
set -e

echo "Iniciando ambiente Treinna (MongoDB + Node.js)..."
docker compose up -d --build --remove-orphans

echo "========================================================="
echo " AMBIENTE ATIVO E PRONTO!"
echo " API Express: http://localhost:3400"
echo " Mongo Express: http://localhost:8401"
echo "========================================================="