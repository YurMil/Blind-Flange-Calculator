# Documentation Index

English documentation for the Blind Flange Calculator codebase. Start here when onboarding, reviewing architecture, or extending the calculation / CAD / export layers.

## Product and Usage

| Document | Purpose |
| --- | --- |
| [Product Overview](product/overview.md) | Problems the app solves, primary users, and in-scope capabilities |
| [Worked Calculation Examples](algorithms/worked-examples.md) | Concrete numeric walkthroughs of PN selection, bolting, and thickness checks |

## Architecture

| Document | Purpose |
| --- | --- |
| [Architecture Index](architecture/README.md) | Entry point for structural docs |
| [Codebase Map](architecture/codebase-map.md) | File-by-file map of modules and responsibilities |
| [Bottlenecks and Risks](architecture/bottlenecks-and-risks.md) | Current architectural narrow points, tech debt, and follow-up work |
| [Application Architecture](development/application-architecture.md) | Intended layering: UI, domain, CAD, export, persistence |
| [Project Structure](development/project-structure.md) | Repository layout and folder responsibilities |

## Engineering Model

| Document | Purpose |
| --- | --- |
| [Mathematical Model](development/mathematical-model.md) | Formulas, units, assumptions, limitations, and recommended model improvements |
| [Worked Calculation Examples](algorithms/worked-examples.md) | Example inputs and expected intermediate results |

## Development Operations

| Document | Purpose |
| --- | --- |
| [Development Documentation Index](development/README.md) | Local setup, workflow, testing, CI/CD, roadmap |
| [Development Workflow](development/development-workflow.md) | Install, commands, branch discipline |
| [Testing and Quality](development/testing-and-quality.md) | Current gates and recommended test pyramid |
| [CI/CD and Deployment](development/ci-cd-and-deployment.md) | GitHub Actions and static publication |
| [Standard Files](development/standard-files.md) | Expected repository hygiene files |
| [Future Development Roadmap](development/future-development-roadmap.md) | Prioritized technical improvements |

## Planning References

| Document | Purpose |
| --- | --- |
| [Microarchitecture Migration Plan](blind-flange-calculator-microarchitecture-migration.md) | Historical plan for the Vite microapp split |
| [Plane 3D STEP Generation Spec](<Plane%203D%20STEP%20Generation%20for%20BlindFlangeCalculator.md>) | Original CAD/STEP subsystem specification |

## Agent Skills

| Document | Purpose |
| --- | --- |
| [Universal Agent Skill Pack](skills/README.md) | Portable skills for calculation, CAD, CI/CD, docs, and refactors |

## Documentation Rules

1. Write in English.
2. Prefer exact file paths and copy-pasteable commands.
3. Separate **confirmed current behavior** from **recommendations**.
4. Link new docs from this index and from [development/README.md](development/README.md) when relevant.
5. Update docs in the same change that alters architecture, formulas, or deployment.
6. Treat [Bottlenecks and Risks](architecture/bottlenecks-and-risks.md) as a living backlog of architectural follow-up work.
