---
name: publish-release
description: Release a prepared caloohpay version by creating the GitHub release that triggers the publish workflow, which stages the package on npm; the user then approves it with 2FA, and this skill verifies it is live. Use after the release PR (version bump, CHANGELOG, docs/vX.Y.Z-RELEASE.md) is merged to main. Always asks for confirmation first; a published npm version is not reversible.
---

# Publish a release

Releasing = creating a GitHub release with tag `vX.Y.Z` on `main`. That triggers `.github/workflows/publish.yml`, which validates, builds and runs **`npm stage publish`** with the `NPM_TOKEN` secret. `NPM_TOKEN` is a stage-only npm token: it can upload a version but cannot make it public. **The version is not live until the user approves it with 2FA** on npmjs.com or with `npm stage approve`. Run `prepare-release` first; this skill assumes the release PR is already merged.

**Never run `npm publish`, `npm stage approve`, `npm stage reject` or `release-and-publish.sh` yourself.** Approval is the human check; it needs the user's 2FA. A published npm version cannot be cleanly taken back, so confirm with the user before step 3.

## Steps

1. **Preconditions.** All must hold; if any fails, stop and report. Don't work around it.

   ```bash
   git switch main && git pull --ff-only && git fetch --tags
   V=$(node -p 'require("./package.json").version')
   ```

   - `git tag --list "v$V"` is empty and `npm view caloohpay version` is **not** `$V` (not already released).
   - `git status --short` is empty and `gh pr list --state open` shows no unmerged release PR. `package.json` on `HEAD` is `$V`. The tag will point at `HEAD`, so list anything merged after the version bump (`git log --oneline -S"\"version\": \"$V\"" -- package.json`, then the commits after it) and tell the user.
   - CI on `HEAD` is green: `gh run list --branch main --workflow CI --limit 1 --json conclusion,headSha`.
   - `CHANGELOG.md` has a `## [$V]` section and `docs/v$V-RELEASE.md` exists.
   - `grep -n "npm stage publish" .github/workflows/publish.yml` matches. If the workflow still runs `npm publish`, a stage-only token is rejected with `E_STAGE_REQUIRED`; stop.
   - **The npm token is configured:** `gh secret list | grep -c NPM_TOKEN` is `1`. If it is missing, the workflow would create the tag and release, then fail at the staging step. Tell the user to add `NPM_TOKEN` and stop. Don't try to create secrets yourself. You cannot see the token's type or expiry, so ask the user to confirm it is **Read and write (stage only)**, scoped to `caloohpay`, and not past its 90-day expiry.
   - Docs-only guard: `git diff --name-only <previous-tag> HEAD` contains files outside docs, tests and CI (the workflow rejects docs-only releases unless `ALLOW_DOCS_ONLY_PUBLISH` is set deliberately).

2. **Prepare the notes** from the changelog section for `$V`:

   ```bash
   awk -v v="$V" '$0 ~ "^## \\["v"\\]" {f=1; next} f && /^## \[/ {exit} f' CHANGELOG.md > notes.md
   ```

   Write `notes.md` to a temporary location (the session scratchpad directory if one is provided), not into the repo. Check the file is not empty.

3. **Confirm with the user.** State the version, the commit it will tag (`git rev-parse --short HEAD`), and that this creates the tag and a public GitHub release and stages the package on npm for their approval. Wait for an explicit yes. If the argument was `dry-run`, stop here and print what would be created.

4. **Create the release** on the exact commit you verified:

   ```bash
   gh release create "v$V" --target "$(git rev-parse HEAD)" --title "v$V" --notes-file notes.md
   ```

5. **Watch the workflow:**

   ```bash
   gh run list --workflow "Publish to npm" --limit 1 --json databaseId --jq '.[0].databaseId'
   gh run watch <id> --exit-status
   ```

   Give up watching after 15 minutes and report. A green run means the version is **staged, not live**.

6. **Hand over for approval.** Tell the user the version is staged and how to approve it:
   - npmjs.com: open `caloohpay`, **Staged Packages** tab, review, **Approve** (2FA prompt); or
   - CLI (npm 11.15.0 or later): `npm stage list caloohpay`, optionally `npm stage view <stage-id>`, then `npm stage approve <stage-id>`.

   Then wait. Don't poll in a loop. When the user says they approved it, go to step 7.

7. **Verify it is live:**

   ```bash
   npm view caloohpay version dist-tags --json
   npm view caloohpay@$V dist.tarball
   ```

   `latest` must equal `$V`. If it does not, the version is still staged or was rejected; say so and don't claim success.

## If something fails

The tag and release already exist. Don't delete them, force-push, or re-tag without asking. Read `gh run view <id> --log-failed` and report the failing step.

- `E_STAGE_REQUIRED`: the workflow ran `npm publish` with the stage-only token; it must use `npm stage publish`.
- Authentication error at the staging step: likely an expired or wrongly scoped `NPM_TOKEN`. The user creates a new token and updates the secret, then you re-run with `gh run rerun <id> --failed`.
- A staged version that should not go live: only the user can discard it (`npm stage reject <stage-id>`, which needs 2FA).

## Report

Version, tag, release URL, workflow result, and one of: **staged, awaiting approval**, or **live** (with the npm `latest` version). If anything was skipped or failed, say so plainly.
