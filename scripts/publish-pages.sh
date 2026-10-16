#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
npm run build:pages
touch dist-pages/.nojekyll
publication_dir=$(mktemp -d /tmp/fieldcheck-pages.XXXXXX)
trap 'rm -rf "$publication_dir"' EXIT
export GIT_INDEX_FILE="$publication_dir/index"
git --work-tree="$PWD/dist-pages" add --all
publication_tree=$(git write-tree)
publication_parent=$(git ls-remote --heads origin refs/heads/gh-pages | cut -f1)
if [ -n "$publication_parent" ]; then
  git fetch origin gh-pages
  publication_commit=$(git commit-tree "$publication_tree" -p "$publication_parent" -m 'Publish Fieldcheck audit app')
else
  publication_commit=$(git commit-tree "$publication_tree" -m 'Publish Fieldcheck audit app')
fi
git push origin "$publication_commit:refs/heads/gh-pages"
