# Development Documentation

This folder contains the operational documentation for developing and maintaining the Blind Flange Calculator as a standalone Vite/React utility app.

## Documents

- [Project Structure](project-structure.md) explains the current repository layout and the responsibility of each major folder.
- [Standard Files and Best Practices](standard-files.md) describes the standard files this type of application should keep and how to maintain them.
- [Application Architecture](application-architecture.md) defines the intended internal architecture for UI, domain logic, CAD, exports, and persistence.
- [Mathematical Model](mathematical-model.md) documents the implemented calculation formulas, assumptions, units, and limitations.
- [Development Workflow](development-workflow.md) documents local setup, common commands, branch discipline, and change flow.
- [Testing and Quality Strategy](testing-and-quality.md) defines the expected quality gates and recommended future test layers.
- [CI/CD and Deployment](ci-cd-and-deployment.md) explains the GitHub Actions workflow and static app publication model.
- [Future Development Roadmap](future-development-roadmap.md) lists the recommended next technical improvements.
- [Universal Agent Skill Pack](../skills/README.md) contains portable skills for engineering web applications, calculation models, CAD/STEP exports, static microapps, CI/CD, refactoring, and technical documentation.

## Documentation Standards

All new documentation should be written in English, stored in Markdown, and linked from this index when it is relevant to future development.

Keep documents practical:

- Describe the current behavior before proposing future changes.
- Prefer file paths and commands over vague descriptions.
- Separate confirmed implementation details from recommendations.
- Update documentation in the same pull request that changes architecture, deployment, or important developer workflows.
