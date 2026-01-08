git fetch edge-vue-components
git diff --quiet edge-vue-components/main..HEAD -- edge \
  && echo "edge is in sync with upstream" \
  || echo "edge has local changes vs upstream"