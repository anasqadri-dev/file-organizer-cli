# SonarCloud Findings and Remediation — Lab 10

**Project:** `anasqadri-dev_file-organizer-cli`  
**Repository:** `anasqadri-dev/file-organizer-cli`  
**Baseline:** Findings recorded from the supplied SonarCloud dashboard before remediation. Sonar rule keys were not visible in the supplied issue list, so this log records the rule descriptions shown by SonarCloud instead of guessing rule IDs.

## Baseline triage

| # | Rule / finding shown in SonarCloud | File and line | Sonar severity | Category | Risk and remediation |
|---|---|---|---|---|---|
| 1 | Path Traversal via faulty LLM-supplied CLI arguments | `organizeFiles.js:14` | High | Security | An unvalidated path argument could direct file operations outside the intended directory. The refactor resolves the target once, rejects filesystem root and invalid targets, and checks destination containment before moving a file. |
| 2 | Prefer `node:fs/promises` over `fs/promises` | `organizeFiles.js:1` | Medium | Maintainability | Explicit Node.js built-in specifiers make built-in dependencies unambiguous. Updated to `node:fs/promises`. |
| 3 | Prefer `node:fs` over `fs` | `organizeFiles.js:2` | Medium | Maintainability | Explicit built-in specifier improves consistency and avoids ambiguity. Updated to `node:fs`; the final refactor no longer needs synchronous `fs`. |
| 4 | Prefer `node:path` over `path` | `organizeFiles.js:3` | Medium | Maintainability | Explicit built-in specifier clarifies the dependency. Updated to `node:path`. |
| 5 | Prefer top-level await over using a promise chain | `organizeFiles.js:40` | Medium | Maintainability | The entry point used a promise chain for error handling. The refactor keeps an explicit CLI entry point with a single async call and a clear error handler; no top-level await is needed in this CommonJS project. |
| 6 | Unexpected `await` inside a loop | `organizeFiles.js:21` | Low | Maintainability | Sequential file moves were awaited in a loop. File operations remain intentionally sequential to avoid unsafe concurrent writes to the same destination and to preserve predictable CLI behaviour. |
| 7 | Unexpected `await` inside a loop | `organizeFiles.js:32` | Low | Maintainability | Directory creation and file movement were awaited in a loop. The extraction to `organizeFile` isolates that work and retains safe sequential processing. |
| 8 | Unexpected `await` inside a loop | `organizeFiles.js:35` | Low | Maintainability | Each move was awaited inside the loop. Sequential operation is deliberate because the tool mutates a shared directory; correctness takes priority over parallelism. |

## Severity summary

The supplied dashboard listed one High security finding, four Medium maintainability findings, and three Low maintainability findings. No Bug or Vulnerability category was explicitly shown in the supplied eight-item list; the High path-traversal item was classified as Security. Confirm the current live classification in the SonarCloud Issues tab after the follow-up scan.

## Remediation summary

- Added argument validation and canonical target resolution.
- Rejected filesystem-root targets and non-directory paths.
- Checked that extension-folder destinations remain within the selected directory.
- Switched to explicit `node:` built-in module specifiers.
- Extracted file extension parsing and single-file organization into named helpers.
- Used `Dirent` entries and `lstat` to avoid following symbolic links as regular files.
- Added automated regression tests for normal organization, extensionless files, directories, invalid paths, and root-path rejection.

## Follow-up scan and regression evidence

Update this section after the GitHub Actions/SonarCloud run completes. Do not mark the Quality Gate as passed until the SonarCloud dashboard confirms it.

- Follow-up scan commit: pending
- SonarCloud Quality Gate: pending live confirmation
- Regression tests: run with `npm test`
