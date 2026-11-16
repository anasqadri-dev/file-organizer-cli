# SonarCloud Findings and Remediation — Lab 10

**Project:** `anasqadri-dev_file-organizer-cli`  
**Repository:** `anasqadri-dev/file-organizer-cli`  
**Analysis branch:** `main`

## Task 1 — Configure SonarCloud

- Connected the GitHub repository to SonarCloud project `anasqadri-dev_file-organizer-cli`.
- Added `sonar-project.properties`.
- Added the `SONAR_TOKEN` GitHub Actions secret; the token value is not stored in this repository.
- Disabled Automatic Analysis because the project uses CI-based analysis through GitHub Actions.
- CI workflow: `.github/workflows/sonarcloud.yml`.
- Scanner action: `SonarSource/sonarqube-scan-action@v8.5.0`.
- Enabled `sonar.qualitygate.wait=true` so the CI job waits for the server-side Quality Gate result.

## Task 2 — Record and classify findings

The original issue list supplied for the lab contained eight findings. The later live dashboard screenshot for `main` showed four currently open issues under the selected Open + Confirmed filters:

| Current finding shown in dashboard | Category | Severity | Location shown | Remediation |
|---|---|---|---|---|
| Path Traversal via faulty LLM-supplied CLI arguments | Security | High | `organizeFiles.js:32` | Restrict CLI input to one safe child-directory name; resolve real paths and reject symlink escapes outside the trusted working directory. |
| Path Traversal via faulty LLM-supplied CLI arguments | Security | High | `organizeFiles.js:112` | Apply the same trusted-directory boundary to the organizing operation; verify with the next SonarCloud scan. |
| Prefer using an optional chain expression instead, as it's more concise and easier to read. | Maintainability | Low | `organizeFiles.js:34` | Use optional chaining when reading the error code. |
| Unexpected 'await' inside a loop. | Maintainability | Low | `organizeFiles.js:118` | Collect regular file names and process them with `Promise.all`; each individual file operation still awaits its own mkdir and rename. |

The dashboard screenshot showed Quality Gate **Failed**, Security grade **C** with 2 open issues, Reliability grade **A** with 0 open issues, and Maintainability grade **A** with 2 open issues. The New Code tab showed 2 failed conditions. These are the observed values at the time of the screenshot, not the result of the pending remediation scan.

## Task 3 — Security remediation

The previous path validation was not sufficient to satisfy the live SonarCloud security findings. The follow-up change therefore uses a narrower interface:

- The CLI accepts only a single direct-child directory name containing ASCII letters, digits, underscores, or hyphens (or `.` for the current directory).
- Absolute paths, separators, and traversal strings such as `../outside` are rejected before filesystem operations.
- The trusted working directory and requested target are canonicalized with `realpath`.
- The canonical target must remain within the trusted working directory; a symlink pointing outside is rejected.
- Files are moved only into extension directories created within that validated target directory.
- The root directory and the organizer's own script directory remain protected.

Example usage from the parent working directory:

```bash
node organizeFiles.js Downloads
```

The argument is a child directory name, not an arbitrary absolute or relative path.

## Task 4 — Maintainability remediation

- Use optional chaining for `error?.code`.
- Filter the directory entries and process the resulting file list with `Promise.all`, avoiding an awaited operation directly inside the loop.
- Each file operation still awaits directory creation and rename to preserve correct per-file operation ordering.
- Use explicit `node:` built-in module specifiers.

## Task 5 — Regression tests and final scan

The regression suite covers:
1. Extension normalization and extensionless files.
2. Rejection of traversal and absolute paths.
3. Rejection of missing target directories.
4. Rejection of a file used as a directory.
5. Normal organization while leaving directories and extensionless files untouched.
6. Ignoring non-regular entries.
7. Rejection of filesystem-root targets.
8. Rejection of symlinks that escape the trusted working directory.

The prior scanner run submitted an analysis successfully, but the supplied dashboard screenshot proves that its Quality Gate failed. The follow-up branch now contains the narrower path validation and additional regression tests. Its new CI run and SonarCloud Quality Gate result must complete before claiming the issues are resolved.

- Previous analysis run: https://github.com/anasqadri-dev/file-organizer-cli/actions/runs/43854495817
- SonarCloud dashboard: https://sonarcloud.io/dashboard?id=anasqadri-dev_file-organizer-cli&branch=main
- Before/after dashboard screenshots should be included in the lab submission.

## Remediation summary

The follow-up changes address the four issues visible in the latest supplied dashboard screenshot. Do not report them as fixed until the subsequent SonarCloud analysis confirms the findings are resolved and the Quality Gate passes.
