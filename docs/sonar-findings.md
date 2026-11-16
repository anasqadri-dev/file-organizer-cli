# SonarCloud Findings and Remediation — Lab 10

**Project:** `anasqadri-dev_file-organizer-cli`  
**Repository:** `anasqadri-dev/file-organizer-cli`  
**Analysis branch:** `main`  
**Baseline:** The eight findings below were transcribed from the original SonarCloud issue list/dashboard provided during the lab. The Sonar rule keys were not visible in that evidence, so this report preserves the displayed rule descriptions rather than guessing rule IDs.

## Task 1 — Connect and run the first scan

- Connected the public GitHub repository to the SonarCloud project `anasqadri-dev_file-organizer-cli`.
- Added `sonar-project.properties` at the repository root.
- Configured the GitHub Actions secret `SONAR_TOKEN` (the token value is intentionally not stored in this repository).
- Disabled SonarCloud Automatic Analysis because this project uses CI-based analysis through GitHub Actions.
- CI workflow: `.github/workflows/sonarcloud.yml`; scanner action: `SonarSource/sonarqube-scan-action@v8.5.0`.
- The scanner successfully submitted an analysis on 2026-11-16 for commit `3db50a3dac748c8db7e2c5a6d9c9a53107706965`.
- Successful run: https://github.com/anasqadri-dev/file-organizer-cli/actions/runs/43854495817
- SonarCloud dashboard: https://sonarcloud.io/dashboard?id=anasqadri-dev_file-organizer-cli&branch=main

## Task 2 — Triage the baseline findings

| # | Rule / finding shown in SonarCloud | File and line (baseline) | Severity as displayed | Category | Risk and disposition |
|---|---|---|---|---|---|
| 1 | Path Traversal via faulty LLM-supplied CLI arguments | `organizeFiles.js:14` | High | Security | An unvalidated path could direct file operations outside the intended directory. Fixed with canonical path resolution, validation, root rejection, and destination-containment checks. |
| 2 | Prefer `node:fs/promises` over `fs/promises` | `organizeFiles.js:1` | Medium | Maintainability | Explicit built-in module specifier avoids ambiguity. Updated to `node:fs/promises`. |
| 3 | Prefer `node:fs` over `fs` | `organizeFiles.js:2` | Medium | Maintainability | Explicit built-in module specifier improves consistency. The final implementation no longer needs the synchronous API. |
| 4 | Prefer `node:path` over `path` | `organizeFiles.js:3` | Medium | Maintainability | Explicit built-in module specifier clarifies the dependency. Updated to `node:path`. |
| 5 | Prefer top-level await over using a promise chain | `organizeFiles.js:40` | Medium | Maintainability | The CLI entry point was simplified to one async invocation with a clear error handler. The project remains CommonJS, so top-level await is not applicable without an unnecessary module-system migration. |
| 6 | Unexpected `await` inside a loop | `organizeFiles.js:21` | Low | Maintainability | Sequential file processing was retained deliberately to keep filesystem mutations deterministic and avoid concurrent operations against shared destination folders. |
| 7 | Unexpected `await` inside a loop | `organizeFiles.js:32` | Low | Maintainability | File operations were extracted into `organizeFile`; sequential processing remains intentional for predictable filesystem behaviour. |
| 8 | Unexpected `await` inside a loop | `organizeFiles.js:35` | Low | Maintainability | The move is awaited to ensure each filesystem operation completes before the next item is processed. This is a documented trade-off rather than an unexamined suppression. |

### Baseline severity summary

- High: 1 Security finding.
- Medium: 4 Maintainability findings.
- Low: 3 Maintainability findings.
- The supplied eight-item baseline did not explicitly identify any Bug or Vulnerability issue type. Severity and issue type are separate SonarCloud attributes; the live Issues page is the authoritative source for the final current classification.

## Task 3 — Fix security findings first

- Resolved the path-traversal risk by resolving the supplied path before filesystem work.
- Rejects filesystem-root targets, missing paths, non-directory targets, and the script's own directory.
- Verifies generated extension-folder destinations remain inside the selected target directory.
- Uses `lstat` and directory-entry types so symbolic links and directories are not treated as regular files.
- Added regression coverage for invalid paths, root rejection, and non-regular entries.

## Task 4 — Reduce maintainability findings

- Replaced ambiguous built-in imports with `node:`-prefixed specifiers.
- Extracted extension parsing into `getExtensionFolder`.
- Extracted per-file work into `organizeFile`.
- Kept filesystem operations sequential intentionally; parallelizing moves is not automatically safer or more maintainable for a CLI that mutates one shared directory.
- The final live Issues page should be checked after report processing to confirm the exact remaining Code Smells and their severities. Do not claim that every baseline smell disappeared solely because the scanner submitted successfully.

## Task 5 — Re-scan and regression verification

- CI workflow run: https://github.com/anasqadri-dev/file-organizer-cli/actions/runs/43854495817
- Run result: **Success**.
- SonarCloud scanner result: **ANALYSIS SUCCESSFUL**; report submitted to the SonarCloud project for processing.
- Regression tests in the same run: **6 passed, 0 failed**.
- `sonar.qualitygate.wait=true` is configured so subsequent CI scans wait for the Quality Gate result and fail the job if the gate does not pass.
- Quality Gate status: **awaiting the CI run with Quality Gate waiting enabled / live dashboard confirmation**.
- Before/after dashboard screenshots: capture the original baseline dashboard and the updated dashboard from SonarCloud for submission. The CI run log is not a substitute for these dashboard screenshots.

## Remediation summary

- Added argument validation and canonical target resolution.
- Rejected filesystem-root targets and non-directory paths.
- Checked destination containment before moving files.
- Switched to explicit `node:` built-in module specifiers.
- Extracted extension parsing and single-file organization into named helpers.
- Used `Dirent` entries and `lstat` to avoid following symbolic links as regular files.
- Added six automated regression tests for extension parsing, invalid paths, normal organization, non-regular entries, and root-path rejection.
- Configured CI-based SonarCloud analysis and Quality Gate waiting.
