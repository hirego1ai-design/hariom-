#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

if [[ "${HIREGO_TEST_DATABASE:-}" != "1" ]]; then
  echo "Refusing isolated migration bootstrap without HIREGO_TEST_DATABASE=1." >&2
  exit 1
fi

guard="20261005100000_voice_ai_routing_defaults"
root="prisma/migrations"
hold="$(mktemp -d)"
restored=0

restore_migrations() {
  if [[ "$restored" -eq 1 ]]; then return; fi
  shopt -s nullglob
  for migration in "$hold"/*; do mv "$migration" "$root/"; done
  restored=1
}
trap restore_migrations EXIT

found_guard=0
shopt -s nullglob
for migration in "$root"/*/; do
  name="$(basename "${migration%/}")"
  if [[ "$name" == "$guard" || "$name" > "$guard" ]]; then
    mv "${migration%/}" "$hold/"
    [[ "$name" == "$guard" ]] && found_guard=1
  fi
done

if [[ "$found_guard" -ne 1 ]]; then
  echo "Required migration $guard was not found." >&2
  exit 1
fi

echo "Applying migrations that precede $guard..."
npx prisma migrate deploy
node scripts/bootstrap-ci-admin-config.mjs

restore_migrations
trap - EXIT

echo "Applying $guard and all later migrations..."
npx prisma migrate deploy
