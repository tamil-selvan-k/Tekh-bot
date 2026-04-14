# Contributing to Tekh-bot

Thank you for contributing.

Tekh-bot is a user-facing product focused on technical guidance and career awareness for students and professionals. Contributions should prioritize product quality, reliability, and user trust.

## Contribution Principles

- Keep user experience fast, clear, and stable.
- Prefer practical and accurate technical responses over overly verbose output.
- Avoid breaking API contracts or UI behavior without clear migration notes.
- Preserve security, privacy, and operational safety.

## Repository Structure

- `client/` - Web UI
- `server/` - Express backend, chat orchestration, retrieval and integrations

## Development Setup

1. Install dependencies in each app:

```bash
cd server
npm install

cd ../client
npm install
```

2. Configure environment variables in `server/.env`.

3. Run backend:

```bash
cd server
npm run dev
```

4. Run client (if available in package scripts) or serve static files for local testing.

## Coding Guidelines

- Follow existing code style and file organization.
- Keep changes minimal and scoped to the issue.
- Add comments only where logic is non-obvious.
- Do not commit secrets, API keys, or credentials.

## Pull Request Checklist

Before opening a PR:

- Ensure the feature/fix works end-to-end locally.
- Verify no new runtime errors are introduced.
- Confirm responsive behavior on mobile and desktop for UI changes.
- Update docs when behavior, config, or API changes.
- Include a concise summary of what changed and why.

## Suggested PR Format

- **Title**: short and action-focused
- **Summary**: what problem is solved
- **Scope**: files/components affected
- **Validation**: how it was tested
- **Notes**: limitations or follow-up work

## Reporting Issues

When reporting a bug, include:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Relevant logs or screenshots

## Security

If you discover a security issue, do not post sensitive details publicly. Share it privately with maintainers first.
