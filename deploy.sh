#!/bin/bash

# JobMate deployment (Node on the host — no Docker).
# Usage: ./deploy.sh [branch-name]
# Example: ./deploy.sh main

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DEFAULT_BRANCH="main"
BRANCH="${1:-$DEFAULT_BRANCH}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}JobMate Deployment${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}[1/4]${NC} Directory: $SCRIPT_DIR"
echo ""

if [ ! -d ".git" ]; then
  echo -e "${RED}Error: Not a git repository${NC}"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}Error: node is not installed or not on PATH${NC}"
  exit 1
fi

echo -e "${GREEN}[2/4]${NC} Fetching latest from origin..."
git fetch origin
echo -e "${GREEN}[3/4]${NC} Checking out ${YELLOW}$BRANCH${NC} and pulling..."
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo -e "${GREEN}[4/4]${NC} Installing dependencies and building..."
npm ci
npm run db:generate
npm run build

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deploy build completed.${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Restart the app process (e.g. ${YELLOW}pm2 restart jobmate${NC} or ${YELLOW}npm run start${NC}) after applying DB migrations if needed:"
echo -e "  ${YELLOW}npm run db:migrate:deploy${NC}"
echo ""
