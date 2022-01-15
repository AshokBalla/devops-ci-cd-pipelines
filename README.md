# jenkins-automation-pipelines

Reusable Jenkins declarative pipelines and shared library snippets tailored for automation repositories.

## Highlights

- Declarative pipelines
- Shared library examples
- Docker agent usage
- Parallel test stage patterns

## Getting Started

```bash
python3 scripts/validate_pipelines.py
```

## Project Structure

- `pipelines/`
- `shared-library/`
- `docker/`
- `examples/`
- `scripts/`

## Reporting

- HTML, JSON, and screenshot/video friendly output paths are pre-created.
- CI examples publish artifacts and preserve failure diagnostics.

## Contribution Guide

1. Create a branch from `develop`.
2. Keep helpers reusable and environment-driven.
3. Add or update validation tests with every framework change.
4. Document any new test data, report artifacts, and CI behavior.

## Notes

- Available templates:
- `pipeline-template-1`
- `pipeline-template-2`
- `pipeline-template-3`
- `pipeline-template-4`
- `pipeline-template-5`
- `pipeline-template-6`
- `pipeline-template-7`
- `pipeline-template-8`
- `pipeline-template-9`
- `pipeline-template-10`
- `pipeline-template-11`
- `pipeline-template-12`
- `pipeline-template-13`
- `pipeline-template-14`
- - 2023: created focused repository split for Reusable Jenkins pipelines and shared library examples for automation programs.

## Career Evolution & Historical Tests
The `original-tests` directory contains historical test suites and experiments from earlier stages of this project's lifecycle (2023-2025). This folder is preserved to demonstrate the evolution from initial test scripts to the modern, scalable framework architecture seen in the current `tests/` and `src/` directories.
