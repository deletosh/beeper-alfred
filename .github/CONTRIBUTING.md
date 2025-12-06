# Contributing to Beeper Alfred

Thank you for your interest in contributing to Beeper Alfred! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**
   ```bash
   gh repo fork deletosh/beeper-alfred --clone
   cd beeper-alfred
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### 1. Create a Branch

Use descriptive branch names:
```bash
git checkout -b feature/add-message-reactions
git checkout -b fix/search-crash
git checkout -b docs/update-readme
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Run Tests and Linting

Before committing:
```bash
npm test          # Run all tests
npm run lint      # Check code style
npm run lint:fix  # Auto-fix linting issues
```

### 4. Commit Changes

Use conventional commit messages:
```bash
git commit -m "feat: add message reaction support"
git commit -m "fix: resolve search crash with empty query"
git commit -m "docs: update installation instructions"
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
gh pr create --fill
```

## Code Style

### JavaScript

- Use ES6+ syntax
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises
- Single quotes for strings
- 2-space indentation
- Semicolons required

**Good:**
```javascript
const getData = async () => {
  const result = await api.fetch();
  return result.data;
};
```

**Bad:**
```javascript
var getData = function() {
  return api.fetch().then(function(result) {
    return result.data
  })
}
```

### File Organization

```
src/
├── commands/        # Command handlers
├── api/            # API client and operations
├── utils/          # Utility functions
├── config/         # Configuration files
└── __tests__/      # Test files
```

### Naming Conventions

- **Files:** kebab-case (`message-handler.js`)
- **Variables/Functions:** camelCase (`getUserData`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Classes:** PascalCase (`BeeperClient`)

## Testing

### Writing Tests

- Place tests in `src/__tests__/` or next to the file as `*.test.js`
- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies (API calls, etc.)

**Example:**
```javascript
describe('searchMessages', () => {
  test('should return results for valid query', async () => {
    const results = await searchMessages('test');
    expect(results).toHaveLength(2);
  });

  test('should handle empty query', async () => {
    const results = await searchMessages('');
    expect(results).toEqual([]);
  });

  test('should handle API errors', async () => {
    mockApi.mockRejectedValue(new Error('API Error'));
    await expect(searchMessages('test')).rejects.toThrow();
  });
});
```

### Coverage Requirements

- Minimum 70% line coverage
- Focus on critical paths
- Don't test external libraries

## Documentation

### Code Documentation

Add JSDoc comments for functions:
```javascript
/**
 * Search messages across all chats
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} options.network - Filter by network
 * @param {number} options.limit - Max results
 * @returns {Promise<Array>} Search results
 */
async function searchMessages(query, options = {}) {
  // Implementation
}
```

### README Updates

Update README.md when adding:
- New commands
- New features
- Configuration options
- Installation steps

## Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add JSDoc comments
   - Update CHANGELOG.md

2. **Ensure CI Passes**
   - All tests pass
   - Linting passes
   - Security audit passes

3. **Request Review**
   - Fill out PR template completely
   - Link related issues
   - Add screenshots for UI changes

4. **Address Feedback**
   - Respond to review comments
   - Make requested changes
   - Re-request review when ready

5. **Merge**
   - Squash commits if needed
   - Delete branch after merge

## Issue Guidelines

### Reporting Bugs

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details:
  - Node.js version
  - Beeper Desktop version
  - macOS version
- Error messages/logs
- Screenshots if applicable

**Template:**
```markdown
## Bug Description
[Clear description]

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Node.js: v20.0.0
- Beeper Desktop: v4.1.169
- macOS: 14.0

## Additional Context
[Screenshots, logs, etc.]
```

### Feature Requests

Include:
- Clear description of the feature
- Use case / problem it solves
- Proposed solution (if any)
- Alternatives considered

## Project Structure

### Key Files

- `src/index.js` - Main entry point
- `src/commands/` - Command handlers
- `src/api/client.js` - Beeper API wrapper
- `src/utils/alfred.js` - Alfred output formatter
- `scripts/build-workflow.js` - Workflow packager

### Configuration Files

- `.eslintrc.js` - Linting rules
- `jest.config.js` - Test configuration
- `package.json` - Dependencies and scripts
- `.github/workflows/` - CI/CD pipelines

## API Integration

### Beeper Desktop API

- Base URL: `http://localhost:23373`
- SDK: `@beeper/desktop-api`
- Authentication: Bearer token

### Making API Calls

```javascript
const client = new BeeperClient(accessToken);

// Good - use client wrapper
const chats = await client.getUnreadChats();

// Bad - direct API calls
const response = await fetch('http://localhost:23373/v1/chats');
```

## Release Process

Maintainers only:

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Push Tag**
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions**
   - Automatically builds workflow
   - Creates GitHub release
   - Attaches `.alfredworkflow` file

## Getting Help

- **Questions:** Open a discussion on GitHub
- **Bugs:** Open an issue with bug template
- **Features:** Open an issue with feature request template
- **Security:** Email security@example.com (do not open public issue)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards others

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- GitHub contributors page
- Release notes (for significant contributions)

---

Thank you for contributing to Beeper Alfred! 🎉
