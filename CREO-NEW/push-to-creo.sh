#!/usr/bin/env bash
set -euo pipefail

NEW_REMOTE="git@github.com:vivekstills/CREO.git"

if git remote | grep -q "^origin$"; then
  git remote remove origin
fi

git remote add origin "$NEW_REMOTE"

git add -A

git commit -m "Initial CREO commit"

git push -u origin main
