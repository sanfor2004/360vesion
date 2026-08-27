# Contributing

Thank you for considering a contribution to 360Vision.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in local values.
4. Run `npm run db:generate` and `npm run db:push` to create your local SQLite database.
5. Start the app with `npm run dev`.

## Development Guidelines

- Keep changes focused and easy to review.
- Preserve existing TypeScript and CSS module patterns unless a broader refactor is part of the issue.
- Do not commit generated output, local uploads, provider metadata, or environment files.
- Add or update validation when changing API request shapes.
- Run `npm run build` before opening a pull request when possible.

## Pull Requests

Open a pull request with:

- A clear summary of the change.
- Any setup or migration steps reviewers need.
- Screenshots or screen recordings for user-facing UI changes.
- Notes about tests or checks you ran.

## Reporting Bugs

Use the bug report template and include reproduction steps, expected behavior, actual behavior, and relevant environment details.
