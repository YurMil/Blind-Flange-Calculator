---
name: technical-docs-maintainer
description: Use when creating, updating, reviewing, or reorganizing technical project documentation, including README files, architecture docs, mathematical model docs, developer workflows, testing docs, CI/CD docs, API docs, release docs, ADRs, and reusable agent skill packs.
---

# Technical Docs Maintainer

Use this skill for documentation that must stay synchronized with source code and operational workflows.

## Context Discovery

Find:

```text
README.md or project root readme
docs/**
src/**
package.json
.github/workflows/**
```

For formula documentation, inspect calculation source files. For CI/CD documentation, inspect workflow files. For architecture documentation, inspect actual source directories and imports.

## Workflow

1. Identify the documentation audience: user, developer, maintainer, operator, auditor, or agent.
2. Update the most specific document first.
3. Verify claims against source files or configuration.
4. Update indexes and cross-links.
5. Keep commands copy-pasteable.
6. Mark assumptions, limitations, generated files, and source-of-truth locations.
7. Avoid duplicating long sections across documents.

## Documentation Rules

- Use clear English unless the repository has a different documentation language.
- Use Markdown unless another format is required.
- Use relative links inside repository docs.
- Prefer exact paths and commands.
- Keep examples minimal and runnable.
- Separate confirmed behavior from recommendations.
- Update docs in the same change as architecture, workflow, formula, or deployment changes.

## Agent Skill Pack Rules

When writing reusable skills:

- Keep names lowercase hyphen-case.
- Put trigger contexts in frontmatter `description`.
- Keep `SKILL.md` procedural and concise.
- Avoid hard-coded project paths unless the skill is intentionally project-specific.
- Prefer context discovery instructions over fixed source paths for universal skills.
- Validate skills with the available validator.

## Review Checklist

- New docs are linked from an index.
- Links with spaces use valid markdown syntax.
- Commands match actual scripts.
- Source behavior matches documentation.
- Documentation names the source of truth.
- Skill descriptions are broad enough for their intended reuse.
