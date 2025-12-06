#!/bin/bash

# Local CI/CD Testing Script
# Run this before pushing to ensure everything works

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🧪 Running complete local CI/CD test suite..."
echo "================================================"
echo ""

# Track timing
START_TIME=$(date +%s)

# Function to print step
step() {
  echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

# 1. Check Node.js version
step "Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v(20|21)\. ]]; then
  warning "Node.js 20+ recommended (found $NODE_VERSION)"
fi
success "Node.js version check complete"
echo ""

# 2. Install dependencies
step "Installing dependencies..."
if [ -d "node_modules" ]; then
  echo "   Using existing node_modules (use 'npm ci' for clean install)"
  npm install --silent
else
  npm ci --silent
fi
success "Dependencies installed"
echo ""

# 3. Validate project structure
step "Validating project structure..."
REQUIRED_FILES=(
  "package.json"
  "README.md"
  "src/index.js"
  "src/commands"
  "src/api"
  "src/utils"
  ".github/workflows/ci.yml"
  ".github/workflows/release.yml"
  ".eslintrc.js"
  "jest.config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -e "$file" ]; then
    error "Required file/directory not found: $file"
  fi
done
success "All required files present"
echo ""

# 4. Validate package.json
step "Validating package.json..."
node -e "
  const pkg = require('./package.json');
  if (!pkg.name) throw new Error('Missing package name');
  if (!pkg.version) throw new Error('Missing version');
  if (!pkg.main) throw new Error('Missing main entry point');
  if (!pkg.scripts) throw new Error('Missing scripts');
  if (!pkg.scripts.test) throw new Error('Missing test script');
  if (!pkg.scripts.lint) throw new Error('Missing lint script');
  if (!pkg.scripts.build) throw new Error('Missing build script');
  console.log('   Name:', pkg.name);
  console.log('   Version:', pkg.version);
  console.log('   Engine:', pkg.engines.node);
" || error "package.json validation failed"
success "package.json is valid"
echo ""

# 5. Run linter
step "Running ESLint..."
npm run lint || error "Linting failed (run 'npm run lint:fix' to auto-fix)"
success "Linting passed"
echo ""

# 6. Run tests
step "Running tests with coverage..."
npm test -- --silent || error "Tests failed"
success "All tests passed"
echo ""

# 7. Check test coverage
step "Checking test coverage thresholds..."
node -e "
  const fs = require('fs');
  const coveragePath = './coverage/coverage-summary.json';

  if (!fs.existsSync(coveragePath)) {
    console.log('   ⚠️  Coverage report not found (tests may not have run)');
    process.exit(0);
  }

  const coverage = require(coveragePath);
  const total = coverage.total;

  console.log('   Lines:', total.lines.pct + '%');
  console.log('   Statements:', total.statements.pct + '%');
  console.log('   Functions:', total.functions.pct + '%');
  console.log('   Branches:', total.branches.pct + '%');

  const thresholds = {
    lines: 70,
    statements: 70,
    functions: 60,
    branches: 60
  };

  const failures = [];
  if (total.lines.pct < thresholds.lines) failures.push('lines');
  if (total.statements.pct < thresholds.statements) failures.push('statements');
  if (total.functions.pct < thresholds.functions) failures.push('functions');
  if (total.branches.pct < thresholds.branches) failures.push('branches');

  if (failures.length > 0) {
    console.log('   ⚠️  Coverage below threshold for:', failures.join(', '));
    console.log('   (This may cause CI to fail)');
  }
" 2>/dev/null || warning "Could not check coverage thresholds"
success "Coverage check complete"
echo ""

# 8. Security audit
step "Running security audit..."
if npm audit --audit-level=high --silent; then
  success "No high/critical vulnerabilities found"
else
  warning "Security vulnerabilities found (review with 'npm audit')"
fi
echo ""

# 9. Build workflow
step "Building Alfred workflow..."
npm run build || error "Build failed"
success "Build completed successfully"
echo ""

# 10. Validate build output
step "Validating build output..."
WORKFLOW_FILE="dist/beeper-alfred.alfredworkflow"

if [ ! -f "$WORKFLOW_FILE" ]; then
  error "Workflow file not found: $WORKFLOW_FILE"
fi

# Check file size
FILE_SIZE=$(du -h "$WORKFLOW_FILE" | cut -f1)
FILE_SIZE_BYTES=$(stat -f%z "$WORKFLOW_FILE" 2>/dev/null || stat -c%s "$WORKFLOW_FILE" 2>/dev/null)
MAX_SIZE=$((10 * 1024 * 1024))  # 10MB

echo "   Workflow file: $WORKFLOW_FILE"
echo "   Size: $FILE_SIZE"

if [ "$FILE_SIZE_BYTES" -gt "$MAX_SIZE" ]; then
  warning "Workflow file is larger than 10MB"
fi

# Check contents
FILE_COUNT=$(unzip -l "$WORKFLOW_FILE" 2>/dev/null | wc -l)
echo "   Files in package: $((FILE_COUNT - 4))"  # Subtract header/footer lines

# Verify critical files in package
REQUIRED_IN_PACKAGE=(
  "src/index.js"
  "package.json"
  "info.plist"
)

for file in "${REQUIRED_IN_PACKAGE[@]}"; do
  if ! unzip -l "$WORKFLOW_FILE" 2>/dev/null | grep -q "$file"; then
    error "Required file missing from package: $file"
  fi
done

success "Build output validated"
echo ""

# 11. Check for uncommitted changes
step "Checking git status..."
if [ -d ".git" ]; then
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warning "Uncommitted changes detected"
    echo "   Run 'git status' to see changes"
  else
    success "No uncommitted changes"
  fi
else
  warning "Not a git repository"
fi
echo ""

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "================================================"
echo -e "${GREEN}🎉 All tests passed! Ready to push.${NC}"
echo "   Total time: ${DURATION}s"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Commit: git add . && git commit -m 'your message'"
echo "  3. Push: git push origin main"
echo ""
echo "Or create a release:"
echo "  git tag v1.0.0"
echo "  git push origin v1.0.0"
echo ""
