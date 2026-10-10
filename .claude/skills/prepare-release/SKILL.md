---
name: prepare-release
description: Dry-run the release checklist for caloohpay (version, changelog, release notes, package contents) without publishing. Use before cutting a release or when asked whether the repo is ready to release.
---

# Release readiness check

Release flow is described in `PUBLISHING.md`; the publish workflow (`.github/workflows/publish.yml`) fails when the release tag and `package.json` version differ, or when a release contains only docs/test/CI changes (unless `ALLOW_DOCS_ONLY_PUBLISH` is `true` for the job).

**This skill never publishes.** Do not run `npm publish`, `release-and-publish.sh`, `git tag`, `git push` or `gh release`; they are denied in `.claude/settings.json` and must be done by the user.

## Checklist

1. **Clean tree on `main`**: `git status` is clean and the branch is up to date.
2. **Version**: read `package.json` `version`. Confirm it is greater than the latest tag (`git describe --tags --abbrev=0`) and appropriate for the changes (semver: breaking → major, feature → minor, fix → patch).
3. **CHANGELOG.md**: the `[Unreleased]` entries are moved under a `## [X.Y.Z] - YYYY-MM-DD` heading matching `package.json`.
4. **Release notes**: `docs/vX.Y.Z-RELEASE.md` exists (see `docs/v2.1.0-RELEASE.md` for the format) if previous releases have one.
5. **Docs-only?** Run `git diff --name-only <last-tag>..HEAD`. If only docs, tests or CI changed, tell the user the publish job will refuse unless `ALLOW_DOCS_ONLY_PUBLISH: 'true'` is set deliberately.
6. **Gate**: `npm run verify` passes.
7. **Package contents**: `npm pack --dry-run` lists only `dist/`, `README.md`, `LICENSE`, `package.json`, `postinstall.js` and similar. No `src/`, `test/`, `.env*`, `.claude/`, `AGENTS.md`.
8. **Audit**: `npm audit --omit=dev --audit-level=moderate` (what CI gates on). The weekly audit workflow covers dev dependencies.
9. **Publish token**: `gh secret list | grep NPM_TOKEN` must show the secret, otherwise the publish workflow fails after the tag and release are created. If it is missing, tell the user before they start a release.

## Report

Give a pass/fail line per item and the exact commands the user should run next (from `PUBLISHING.md`).
