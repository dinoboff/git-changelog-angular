#!/usr/bin/env bash

clear
BRANCH=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
REMOTE_BRANCH=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD@{upstream})

git fetch
DIFF_COUNT=$(git rev-list --count ${BRANCH}...${REMOTE_BRANCH})

if [ $DIFF_COUNT != 0 ]; then
    echo "ERROR: ${BRANCH} is out of date with ${REMOTE_BRANCH}!"
    git rev-list --oneline ${BRANCH}...${REMOTE_BRANCH}
    exit 1
fi


FILE="draft.md"

echo "Generating change log..."
echo
git changelog HEAD > "$FILE"
cat "$FILE"

echo "Bumping package version..."
VERSION=$(head -n 1 "$FILE")
npm version "$VERSION"

echo "Pushing changes..."
git push --tags



echo "Checking ci status..."
TAG="v${VERSION}"
REV="${TAG}^{commit}"
hub ci-status -v "$REV"
while [ $? -ne 0 ]; do
    echo 'retrying in 10s...'
    sleep 10s
    hub ci-status "$REV"
done

echo
read -r -p "Publish package? [y/N] " response

case "$response" in
    [yY][eE][sS]|[yY])
        npm publish
        hub release create --draft --file="$FILE" --browse "$TAG"
        ;;
    *)
        echo
        echo "HEAD and tags still need  to be updated."
        echo "${TAG} is not yet published to npm."
        echo
        ;;
esac
