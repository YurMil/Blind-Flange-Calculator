# Blind Flange Calculator

Blind Flange Calculator is a standalone Vite/React utility application for blind flange sizing, reporting, and CAD/STEP export workflows. The application is developed as a pnpm workspace app and published as a static utility under:

```text
static/utility-apps/blind-flange-calculator/app.html
```

## Quick Start

```bash
corepack pnpm install
corepack pnpm typecheck:blind-flange
corepack pnpm build:blind-flange
```

For local development:

```bash
corepack pnpm dev:blind-flange
```

## Documentation

Development documentation:

- [Development Documentation Index](docs/development/README.md)
- [Project Structure](docs/development/project-structure.md)
- [Standard Files and Best Practices](docs/development/standard-files.md)
- [Application Architecture](docs/development/application-architecture.md)
- [Mathematical Model](docs/development/mathematical-model.md)
- [Development Workflow](docs/development/development-workflow.md)
- [Testing and Quality Strategy](docs/development/testing-and-quality.md)
- [CI/CD and Deployment](docs/development/ci-cd-and-deployment.md)
- [Future Development Roadmap](docs/development/future-development-roadmap.md)
- [Universal Agent Skill Pack](docs/skills/README.md)

Existing technical planning documents:

- [Microarchitecture Migration Plan](docs/blind-flange-calculator-microarchitecture-migration.md)
- [Plane 3D STEP Generation Plan](<docs/Plane 3D STEP Generation for BlindFlangeCalculator.md>)

## Main Commands

| Command | Purpose |
| --- | --- |
| `corepack pnpm dev:blind-flange` | Start the standalone Vite app locally. |
| `corepack pnpm typecheck:blind-flange` | Run TypeScript checks for the utility app. |
| `corepack pnpm build:blind-flange` | Build the deployable static app. |
| `corepack pnpm build` | Run the root build command. |
| `corepack pnpm typecheck` | Run the root typecheck command. |

## Repository Layout

```text
apps/blind-flange-calculator/        Source Vite application
static/utility-apps/blind-flange-calculator/
                                     Published static artifact
docs/                                Project and development documentation
.github/workflows/main.yml           CI/CD workflow
```

## Engineering Principle

Keep engineering calculations, standards data, CAD generation, UI components, export code, and deployment automation separated. This keeps the app maintainable, testable, and ready for a future split into a dedicated application repository.
