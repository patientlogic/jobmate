#!/bin/bash

# JobMate release: version bump, changelog, Git tag, GitHub Release (no container build).
# Usage: ./release.sh [patch|minor|major|x.y.z]  (defaults to patch)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BUMP_TYPE="${1:-patch}"
SEMVER_REGEX='^[0-9]+\.[0-9]+\.[0-9]+$'
if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" && ! "$BUMP_TYPE" =~ $SEMVER_REGEX ]]; then
  echo -e "${RED}Error: Invalid argument '$BUMP_TYPE'. Use patch, minor, major, or a semver (e.g., 1.5.0).${NC}"
  exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}JobMate Release Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

echo -e "${GREEN}[1/8]${NC} Validating git state..."
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo -e "${RED}Error: Must be on 'main' branch (currently on '$BRANCH')${NC}"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}Error: Working directory is not clean. Commit or stash changes first.${NC}"
  exit 1
fi

git pull origin main --ff-only
echo -e "  Branch: ${YELLOW}main${NC} (clean)"
echo ""

echo -e "${GREEN}[2/8]${NC} Running tests..."
npm test
echo ""

echo -e "${GREEN}[3/8]${NC} Running linter..."
npm run lint
echo ""

echo -e "${GREEN}[4/8]${NC} Checking prerequisites..."

if ! command -v gh >/dev/null 2>&1; then
  echo -e "${RED}Error: gh (GitHub CLI) is required for releasing${NC}"
  exit 1
fi

if [ -z "$GITHUB_TOKEN" ] && [ -f .env ]; then
  GITHUB_TOKEN=$(grep -E '^GITHUB_TOKEN=' .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${RED}Error: GITHUB_TOKEN is not set. Add it to .env or export it (needed for gh release).${NC}"
  exit 1
fi

export GITHUB_TOKEN
echo -e "  gh: ${GREEN}OK${NC}"
echo -e "  GITHUB_TOKEN: ${GREEN}OK${NC}"
echo ""

PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

echo -e "${GREEN}[5/8]${NC} Bumping version (${YELLOW}$BUMP_TYPE${NC})..."
NEW_VERSION=$(npm version "$BUMP_TYPE" --no-git-tag-version)
echo -e "  New version: ${YELLOW}$NEW_VERSION${NC}"
echo ""

echo -e "${GREEN}[6/8]${NC} Updating CHANGELOG.md..."
VERSION_NUMBER="${NEW_VERSION#v}"
TODAY=$(date +%Y-%m-%d)

if [ -n "$PREV_TAG" ]; then
  COMPARE_URL="https://github.com/patientlogic/jobmate/compare/${PREV_TAG}...${NEW_VERSION}"
  LOG_RANGE="${PREV_TAG}..HEAD"
else
  COMPARE_URL=""
  LOG_RANGE=""
fi

CHANGELOG_ENTRY="## [$VERSION_NUMBER]($COMPARE_URL) ($TODAY)"$'\n'$'\n'

FEATURES=""
FIXES=""
OTHER=""

while IFS= read -r line; do
  [ -z "$line" ] && continue
  if echo "$line" | grep -qiE '^feat'; then
    msg=$(echo "$line" | sed -E 's/^feat(\([^)]*\))?:\s*//')
    FEATURES="${FEATURES}* ${msg}"$'\n'
  elif echo "$line" | grep -qiE '^fix'; then
    msg=$(echo "$line" | sed -E 's/^fix(\([^)]*\))?:\s*//')
    FIXES="${FIXES}* ${msg}"$'\n'
  else
    cleaned=$(echo "$line" | sed -E 's/^[a-z]+(\([^)]*\))?:\s*//')
    OTHER="${OTHER}* ${cleaned}"$'\n'
  fi
done < <(git log ${LOG_RANGE} --pretty=format:"%s" --no-merges)

if [ -n "$FEATURES" ]; then
  CHANGELOG_ENTRY="${CHANGELOG_ENTRY}"$'\n'"### Features"$'\n'$'\n'"${FEATURES}"
fi

if [ -n "$FIXES" ]; then
  CHANGELOG_ENTRY="${CHANGELOG_ENTRY}"$'\n'"### Bug Fixes"$'\n'$'\n'"${FIXES}"
fi

if [ -n "$OTHER" ]; then
  CHANGELOG_ENTRY="${CHANGELOG_ENTRY}"$'\n'"### Other Changes"$'\n'$'\n'"${OTHER}"
fi

if [ -f CHANGELOG.md ]; then
  HEADER=$(head -1 CHANGELOG.md)
  EXISTING=$(tail -n +2 CHANGELOG.md)
  printf '%s\n\n%s\n%s\n' "$HEADER" "$CHANGELOG_ENTRY" "$EXISTING" > CHANGELOG.md
else
  printf '# Changelog\n\n%s\n' "$CHANGELOG_ENTRY" > CHANGELOG.md
fi

echo -e "  Changelog updated"
echo ""

echo -e "${GREEN}[7/8]${NC} Committing and tagging..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): ${VERSION_NUMBER}"
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"
git push origin main
git push origin "$NEW_VERSION"
echo ""

echo -e "${GREEN}[8/8]${NC} Creating GitHub Release..."
gh release create "$NEW_VERSION" --title "$NEW_VERSION" --generate-notes
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Release $NEW_VERSION completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Version: ${YELLOW}$NEW_VERSION${NC}"
echo -e "  Tag: ${YELLOW}$NEW_VERSION${NC}"
