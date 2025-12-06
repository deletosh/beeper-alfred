# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment pipeline for the Beeper Alfred workflow.

## Overview

The CI/CD pipeline uses GitHub Actions to automate testing, linting, security audits, and releases.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

#### Jobs

**Lint**
- Runs ESLint on all JavaScript files
- Ensures code quality and consistency
- Fails if linting errors are found

**Test**
- Runs Jest test suite with coverage
- Tests on Node.js versions 20 and 21
- Generates coverage reports

**Validate**
- Checks project structure
- Verifies required files exist
- Validates package.json structure

**Security**
- Runs npm audit
- Checks for known vulnerabilities
- Reports security issues

#### Triggers
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### 2. Release Workflow (`.github/workflows/release.yml`)

Creates and publishes GitHub releases with the Alfred workflow package.

#### Jobs

**Build**
- Runs on macOS (for icon generation compatibility)
- Installs production dependencies
- Generates icons (if available)
- Creates `.alfredworkflow` package
- Uploads artifact for 90 days

**Release**
- Downloads workflow artifact
- Generates changelog from git commits
- Creates GitHub release
- Attaches workflow file to release

**Notify**
- Posts success notification
- Provides download link

#### Triggers

**Git Tags:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Manual Dispatch:**
Via GitHub Actions UI with version input

## Package Scripts

Add these scripts to your workflow:

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:unit": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix",
    "build": "node scripts/build-workflow.js",
    "generate-icons": "node scripts/generate-icons.js",
    "dev": "node src/index.js",
    "prepare": "npm run lint"
  }
}
```

## Build Script

The `scripts/build-workflow.js` script:

1. Creates `dist/` directory
2. Generates `info.plist` if missing
3. Packages workflow into `.alfredworkflow` file
4. Includes:
   - All source files (`src/`)
   - Icons (`icons/`)
   - Package files
   - README and LICENSE
   - Only `@beeper/desktop-api` from node_modules

## Release Process

### Automated Release (Recommended)

1. **Update version in package.json:**
   ```bash
   npm version patch|minor|major
   ```

2. **Create and push git tag:**
   ```bash
   git push origin main
   git push origin v1.0.0
   ```

3. **GitHub Actions will:**
   - Build the workflow
   - Run all tests
   - Create GitHub release
   - Attach `.alfredworkflow` file

### Manual Release

1. **Trigger via GitHub UI:**
   - Go to Actions → Release
   - Click "Run workflow"
   - Enter version number
   - Click "Run workflow"

## Testing Locally

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Linter
```bash
npm run lint
```

### Fix Linting Issues
```bash
npm run lint:fix
```

### Build Workflow Locally
```bash
npm run build
```

The workflow will be created at `dist/beeper-alfred.alfredworkflow`

## Installation from Release

1. Go to [Releases](https://github.com/deletosh/beeper-alfred/releases)
2. Download latest `beeper-alfred.alfredworkflow`
3. Double-click to install in Alfred
4. Run `bp setup` to configure

## Dependencies

### Production
- `@beeper/desktop-api` - Beeper Desktop API client

### Development
- `eslint` - Code linting
- `jest` - Testing framework
- `archiver` - Workflow packaging

## Environment Variables

No environment variables needed for CI/CD (tests run without Beeper API).

For local development:
- `BEEPER_ACCESS_TOKEN` - Set in Alfred workflow environment
- `BEEPER_API_URL` - Defaults to `http://localhost:23373`

## Code Quality Standards

### Linting Rules
- ES6+ syntax
- Single quotes
- 2-space indentation
- Semicolons required
- No unused variables

### Test Coverage Thresholds
- Branches: 60%
- Functions: 60%
- Lines: 70%
- Statements: 70%

## Troubleshooting

### CI Fails on npm audit
- Check for vulnerabilities in dependencies
- Update packages: `npm update`
- For unavoidable warnings, adjust audit level in workflow

### Build Fails - Missing info.plist
- Build script auto-generates `info.plist`
- Check `scripts/build-workflow.js` for template

### Test Coverage Too Low
- Add more tests in `src/__tests__/`
- Aim for >70% coverage
- Focus on critical paths first

### Workflow Too Large
- Check included files in `scripts/build-workflow.js`
- Only `@beeper/desktop-api` should be in node_modules
- Remove unnecessary files

## Best Practices

1. **Always run tests before pushing:**
   ```bash
   npm test && npm run lint
   ```

2. **Use conventional commits:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `refactor:` - Code refactoring
   - `test:` - Add tests
   - `chore:` - Maintenance

3. **Branch strategy:**
   - `main` - Production-ready code
   - `develop` - Integration branch
   - `feature/*` - Feature branches
   - `fix/*` - Bug fix branches

4. **Version numbering:**
   - MAJOR: Breaking changes
   - MINOR: New features (backwards compatible)
   - PATCH: Bug fixes

## Maintenance

### Update Dependencies
```bash
npm update
npm audit fix
```

### Update GitHub Actions
Check for newer versions:
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/upload-artifact@v4`
- `actions/download-artifact@v4`

## Support

For CI/CD issues:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Open issue on GitHub

## Future Enhancements

- [ ] Add code coverage reporting (Codecov)
- [ ] Add automated changelog generation
- [ ] Add pre-commit hooks (Husky)
- [ ] Add Dependabot for dependency updates
- [ ] Add badge generation (build status, coverage)
- [ ] Add performance benchmarks
- [ ] Add integration tests with Beeper API mocks
