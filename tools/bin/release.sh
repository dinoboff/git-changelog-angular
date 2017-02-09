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


VERSION=$(head -n 1 "$FILE")

echo "Bumping package version..."
if npm version "$VERSION"; then
    echo "Version set to ${VERSION}."
else
    echo "ERROR: failed to update version to ${VERSION}!"
    exit 1
fi


echo "Pushing changes..."
if git push && git push --tags; then
    echo "New tag sent to origin"
else
    echo "ERROR: Failed to update origin!"
    exit 1
fi


TAG="v${VERSION}"
REV="${TAG}^{commit}"

echo "Checking ci status..."

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
