# Contributing to Beeper Alfred

Thank you for your interest in contributing to Beeper Alfred! This guide will help you get started.

## Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages must adhere to this format.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

#### Good Commit Messages ✅

```
feat: add message search functionality
fix: correct unread count badge display
docs: update README with setup instructions
refactor(api): simplify client initialization
perf(cache): improve search result caching
test(search): add unit tests for network filtering
build: upgrade @beeper/desktop-api to v0.2.0
ci: add commit message validation workflow
```

#### Bad Commit Messages ❌

```
updated stuff
fixed bug
WIP
asdf
Feature: Add search (wrong type capitalization)
added new feature (missing type)
```

### Scopes (Optional)

You can optionally include a scope to provide additional context:

- **search**: Message search functionality
- **send**: Send message feature
- **unread**: Unread inbox management
- **api**: Beeper API client
- **utils**: Utility functions
- **workflow**: Alfred workflow configuration

### Validation

All commits are automatically validated in CI/CD. If your commit messages don't follow the convention:

1. The GitHub Actions workflow will fail
2. A comment will be posted on your PR with instructions
3. You'll need to amend your commits to follow the convention

### Local Testing

Before pushing, you can validate your commit messages locally:

```bash
# Check your last commit
npm run commitlint:check

# Test a commit message
echo "feat: add new feature" | npx commitlint
```

### Fixing Commit Messages

If you need to fix a commit message:

```bash
# Amend the last commit message
git commit --amend -m "feat: your new message"

# For older commits, use interactive rebase
git rebase -i HEAD~n  # where n is the number of commits to go back
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes following the commit convention
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Push to your fork
7. Create a Pull Request

## Code Style

- Follow the existing code style
- Use ES6+ syntax
- Add JSDoc comments for functions
- Run `npm run lint:fix` to automatically fix style issues

## Questions?

If you have any questions, feel free to open an issue or reach out to the maintainers.
