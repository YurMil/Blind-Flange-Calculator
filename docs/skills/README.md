# Universal Engineering Application Skill Pack

This folder contains portable skill drafts for agents working on engineering web applications, static microapps, CAD/STEP export tools, standards-driven calculators, and technical documentation.

Each subfolder is structured as a standalone skill folder with a `SKILL.md` file. To use one in another Codex setup, copy the desired skill folder into the target agent's skills directory:

```text
~/.codex/skills/<skill-name>/SKILL.md
```

## Skill Catalog

| Skill | Primary use |
| --- | --- |
| [engineering-calculation-model](engineering-calculation-model/SKILL.md) | Mathematical models, engineering formulas, unit handling, calculation reviews, and assumptions. |
| [engineering-standards-data](engineering-standards-data/SKILL.md) | Standards tables, material catalogs, fastener data, gasket factors, lookup data, and traceability. |
| [cad-step-export](cad-step-export/SKILL.md) | CAD geometry, Web Worker generation, STEP export, WASM CAD libraries, and export robustness. |
| [vite-static-microapp](vite-static-microapp/SKILL.md) | Vite/React static microapps, workspace builds, generated manifests, iframe hosting, and static publication. |
| [engineering-react-ui](engineering-react-ui/SKILL.md) | React interfaces for technical tools, forms, result panels, validation, accessibility, and responsive layouts. |
| [engineering-app-quality](engineering-app-quality/SKILL.md) | Typechecking, unit tests, browser tests, regression fixtures, worker tests, and quality gates. |
| [static-app-ci-cd-release](static-app-ci-cd-release/SKILL.md) | CI/CD for static apps, artifact validation, deployment, release hygiene, and rollback readiness. |
| [technical-docs-maintainer](technical-docs-maintainer/SKILL.md) | Architecture docs, math docs, developer docs, API docs, release docs, and agent-facing knowledge packs. |
| [architecture-refactor-agent](architecture-refactor-agent/SKILL.md) | Safe refactoring of domain logic, UI boundaries, state, exports, CAD modules, and tests. |

## How To Adapt

These skills are intentionally project-neutral. Before using one in a different repository:

1. Copy only the skills that match the target project.
2. Replace example paths with the target repository's real paths.
3. Add project-specific reference files only when they are stable and useful.
4. Keep each `SKILL.md` concise and procedural.
5. Validate each copied skill with the target agent's skill validator when available.

## Maintenance Rule

When a reusable workflow changes, update the matching skill. When a project-specific behavior changes, update the target repository documentation first, then decide whether the generic skill needs a broader rule.
