---
name: publish-release
description: Publish an already-prepared caloohpay version to npm by creating the GitHub release that triggers the publish workflow, then verify it landed on npm. Use after the release PR (version bump, CHANGELOG, docs/vX.Y.Z-RELEASE.md) is merged to main. Always asks for confirmation first; publishing is not reversible.
---

# Publish a release

Publishing = creating a GitHub release with tag `vX.Y.Z` on `main`. That triggers `.github/workflows/publish.yml`, which validates, builds and runs `npm publish` using the `NPM_TOKEN` secret. Run `prepare-release` first; this skill assumes the release PR is already merged.

**Never run `npm publish` or `release-and-publish.sh` yourself** (denied in `.claude/settings.json`). A published npm version cannot be cleanly taken back, so confirm with the user before step 3.

## Steps

1. **Preconditions.** All must hold; if any fails, stop and report. Don't work around it.

   ```bash
   git switch main && git pull --ff-only && git fetch --tags
   V=$(node -p 'require("./package.json").version')
   ```

   - `git tag --list "v$V"` is empty and `npm view caloohpay version` is **not** `$V` (not already released).
   - `git status --short` is empty; the last commit on `main` is the release bump, with no unmerged release PR still open (`gh pr list --state open`).
   - CI on that commit is green: `gh run list --branch main --workflow CI --limit 1 --json conclusion,headSha`.
   - `CHANGELOG.md` has a `## [$V]` section and `docs/v$V-RELEASE.md` exists.
   - **The npm token is configured:** `gh secret list | grep -c NPM_TOKEN` is `1`. If it is missing the workflow would create the tag and release, then fail at `npm publish`. Tell the user to add `NPM_TOKEN` (repo Settings > Secrets and variables > Actions) and stop. Don't try to create secrets yourself.
   - Docs-only guard: `git diff --name-only <previous-tag> HEAD` contains files outside docs, tests and CI (the workflow rejects docs-only releases unless `ALLOW_DOCS_ONLY_PUBLISH` is set deliberately).

2. **Prepare the notes** from the changelog section for `$V`:

   ```bash
   awk -v v="$V" '$0 ~ "^## \\["v"\\]" {f=1; next} f && /^## \[/ {exit} f' CHANGELOG.md > notes.md
   ```

   Write `notes.md` to a temporary location (the session scratchpad directory if one is provided), not into the repo. Check the file is not empty.

3. **Confirm with the user.** State the version, the commit it will tag (`git rev-parse --short HEAD`), and that this publishes to npm. Wait for an explicit yes. If the argument was `dry-run`, stop here and print what would be created.

4. **Create the release** on the exact commit you verified:

   ```bash
   gh release create "v$V" --target "$(git rev-parse HEAD)" --title "v$V" --notes-file notes.md
   ```

5. **Watch the publish workflow:**

   ```bash
   gh run list --workflow "Publish to npm" --limit 1 --json databaseId --jq '.[0].databaseId'
   gh run watch <id> --exit-status
   ```

   Give up watching after 15 minutes and report.

6. **Verify it landed:**

   ```bash
   npm view caloohpay version dist-tags --json
   npm view caloohpay@$V dist.tarball
   ```

   `latest` must equal `$V`. Optionally run `npm pack --dry-run` on `main` and check the file list matches what the workflow published.

## If the publish fails

The tag and release already exist. Don't delete them, force-push, or re-tag without asking. Read `gh run view <id> --log-failed`, report the failing step, and if the cause is fixable outside the repo (for example an expired `NPM_TOKEN`), tell the user to fix it and then re-run with `gh run rerun <id> --failed`.

## Report

Version, tag, release URL, workflow result, and the npm `latest` version. If anything was skipped or failed, say so plainly.
