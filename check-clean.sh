#!/bin/bash
set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

usage() {
  echo "Usage: $0 [flags]"
  echo "Flags:"
  echo "  --no-lint        Skip lint check"
  echo "  --no-type        Skip type check"
  echo "  --no-test        Skip test check"
  echo "  --no-build       Skip build check"
  echo "  --no-audit       Skip audit check"
  echo "  --no-outdated    Skip dependency outdated check"
  echo "  --no-testscan    Skip .only/.skip scan in tests"
  echo "  --no-todo        Skip TODO/FIXME scan"
  echo "  --only-lint      Only run lint check"
  echo "  --only-type      Only run type check"
  echo "  --only-test      Only run test check"
  echo "  --only-build     Only run build check"
  echo "  --only-audit     Only run audit check"
  echo "  --only-outdated  Only run dependency outdated check"
  echo "  --only-testscan  Only run .only/.skip scan in tests"
  echo "  --only-todo      Only run TODO/FIXME scan"
  echo "  -h, --help       Show this help message"
}

fail() {
  echo -e "${RED}FAILED:${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}WARNING:${NC} $1"
}

pass() {
  echo -e "${GREEN}PASS:${NC} $1"
}

# Parse flags
RUN_LINT=1
RUN_TYPE=1
RUN_TEST=1
RUN_BUILD=1
RUN_AUDIT=1
RUN_OUTDATED=1
RUN_TESTSCAN=1
RUN_TODO=1
ONLY=()

for arg in "$@"; do
  case $arg in
    --no-lint) RUN_LINT=0 ;;
    --no-type) RUN_TYPE=0 ;;
    --no-test) RUN_TEST=0 ;;
    --no-build) RUN_BUILD=0 ;;
    --no-audit) RUN_AUDIT=0 ;;
    --no-outdated) RUN_OUTDATED=0 ;;
    --no-testscan) RUN_TESTSCAN=0 ;;
    --no-todo) RUN_TODO=0 ;;
    --only-lint) ONLY+=(lint) ;;
    --only-type) ONLY+=(type) ;;
    --only-test) ONLY+=(test) ;;
    --only-build) ONLY+=(build) ;;
    --only-audit) ONLY+=(audit) ;;
    --only-outdated) ONLY+=(outdated) ;;
    --only-testscan) ONLY+=(testscan) ;;
    --only-todo) ONLY+=(todo) ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown flag: $arg"; usage; exit 1 ;;
  esac
  shift
}

if [ ${#ONLY[@]} -gt 0 ]; then
  # If any --only-* flag is set, only run those
  RUN_LINT=0; RUN_TYPE=0; RUN_TEST=0; RUN_BUILD=0; RUN_AUDIT=0; RUN_OUTDATED=0; RUN_TESTSCAN=0; RUN_TODO=0
  for check in "${ONLY[@]}"; do
    case $check in
      lint) RUN_LINT=1 ;;
      type) RUN_TYPE=1 ;;
      test) RUN_TEST=1 ;;
      build) RUN_BUILD=1 ;;
      audit) RUN_AUDIT=1 ;;
      outdated) RUN_OUTDATED=1 ;;
      testscan) RUN_TESTSCAN=1 ;;
      todo) RUN_TODO=1 ;;
    esac
  done
fi

# 1. Lint
if [ $RUN_LINT -eq 1 ]; then
  printf "\n==> Linting...\n"
  pnpm lint || fail "Lint errors found."
  pass "Lint"
fi

# 2. Type Check
if [ $RUN_TYPE -eq 1 ]; then
  printf "\n==> Type checking...\n"
  pnpm tsc --noEmit || fail "Type errors found."
  pass "Type check"
fi

# 3. Test
if [ $RUN_TEST -eq 1 ]; then
  printf "\n==> Running tests...\n"
  pnpm vitest --run --reporter verbose || fail "Tests failed."
  pass "Tests"
fi

# 4. Build
if [ $RUN_BUILD -eq 1 ]; then
  printf "\n==> Building...\n"
  pnpm build || fail "Build failed."
  pass "Build"
fi

# 5. Audit
if [ $RUN_AUDIT -eq 1 ]; then
  printf "\n==> Security audit...\n"
  pnpm audit || fail "Security vulnerabilities found."
  pass "Audit"
fi

# 6. Dependency check
if [ $RUN_OUTDATED -eq 1 ]; then
  printf "\n==> Checking for outdated dependencies...\n"
  if pnpm outdated | grep -q -v 'No outdated packages'; then
    warn "Some dependencies are outdated. Run 'pnpm outdated' to review."
  else
    pass "Dependencies up to date"
  fi
fi

# 7. Check for .only/.skip in tests
if [ $RUN_TESTSCAN -eq 1 ]; then
  printf "\n==> Checking for .only/.skip in tests...\n"
  ONLY_FOUND=$(grep -r --include='*.test.*' '\.only(' src/ || true)
  SKIP_FOUND=$(grep -r --include='*.test.*' '\.skip(' src/ || true)
  if [[ -n "$ONLY_FOUND" ]]; then
    fail ".only found in tests:\n$ONLY_FOUND"
  fi
  if [[ -n "$SKIP_FOUND" ]]; then
    warn ".skip found in tests:\n$SKIP_FOUND"
  else
    pass "No .only/.skip in tests"
  fi
fi

# 8. Check for TODO/FIXME
if [ $RUN_TODO -eq 1 ]; then
  printf "\n==> Checking for TODO/FIXME comments...\n"
  TODO_FOUND=$(grep -r 'TODO\|FIXME' src/ || true)
  if [[ -n "$TODO_FOUND" ]]; then
    warn "TODO/FIXME comments found:\n$TODO_FOUND"
  else
    pass "No TODO/FIXME comments in src/"
  fi
fi

printf "\n${GREEN}All checks complete!${NC}\n" 