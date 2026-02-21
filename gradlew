#!/usr/bin/env sh
set -eu

# Fallback wrapper for Appflow when appflow.config.json is not detected.
exec "./android/gradlew" "$@"
