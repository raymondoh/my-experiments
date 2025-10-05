#!/usr/bin/env sh
# Minimal Husky shim to make hooks POSIX-compliant during CI and local runs.
# The real husky package will replace this when "npm run prepare" executes.
if [ -z "$husky_skip_init" ]; then
  export husky_skip_init=1
fi
