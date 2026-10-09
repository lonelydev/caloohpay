---
name: merge-dependabot-prs
description: Work through open Dependabot pull requests oldest-first. Refreshes each one so CI runs against current main, waits for all checks to pass, squash-merges eligible dev-dependency bumps, then moves to the next. Use to clear a backlog of stale Dependabot PRs. Pass "dry-run" to report without commenting or merging.
---

# Merge Dependabot PRs

Clears open Dependabot PRs one at a time, **oldest first**. Requires `gh` authenticated with write access. If the invocation argument is `dry-run`, do steps 1–2 and report what you *would* do; do not comment, merge or push.

The `main` ruleset requires a PR and linear history but **no required status checks**, so GitHub will let a red PR merge. You are the gate: never merge unless every check passed.

## Rules

- Never `--admin`, never force-push, never edit a PR branch, never change rulesets or repo settings.
- Never merge with a failing or pending check. `NEUTRAL` (CodeQL) and `SKIPPED` push-only steps are fine.
- Production dependencies, major bumps and GitHub Actions bumps are **never merged by this skill**; list them as "needs human".
- Don't use `gh run rerun`: it reuses the original, stale merge commit. Use `@dependabot rebase` so CI runs against current `main`.

## Steps

1. **Preconditions.** `gh auth status`; clean working tree; `git switch main && git pull --ff-only`. List candidates oldest first:

   ```bash
   gh pr list --author "app/dependabot" --state open --json number,title,createdAt,headRefName \
     --jq 'sort_by(.createdAt) | .[] | [.number,.createdAt[:10],.title]|@tsv'
   ```

   Stop if none.

2. **Classify** each PR (`gh pr view N --json title,files`). Eligible only if **all** hold:
   - every changed file is `package.json` or `package-lock.json`;
   - title is `chore(deps-dev): bump X from A to B` with the **same major** for A and B, or `chore(deps-dev): bump the dev-dependencies group …` (the group only carries minor/patch);
   - not a `chore(deps):` (production) or `ci(deps):` / `github_actions` PR.

   Everything else: skip and record under "needs human".

3. **Refresh.** Record `gh pr view N --json headRefOid`, then `gh pr comment N --body "@dependabot rebase"`. Poll every 30s (10 min max) until `headRefOid` changes and `mergeStateStatus` is not `DIRTY`/`BEHIND`. If it never changes because the PR is already up to date with `main`, continue.
   - **Stop early if Dependabot refuses.** On each poll, read the newest comment: `gh pr view N --json comments --jq '.comments[-1] | select(.author.login=="dependabot") | .body'`. If it says the PR "can't be rebased" (for example because its `dependabot.yml` entry was deleted, or the PR was edited), don't wait out the timeout. Mark the PR "needs human: Dependabot cannot rebase; close it so Dependabot can recreate it" and move on. Never push to its branch yourself.

4. **Gate.** `gh pr checks N --watch --fail-fast --interval 30`. Then verify with `gh pr checks N` that every check is `pass`.
   - On failure, find the failing step: `gh run view <run-id> --json jobs --jq '.jobs[].steps[] | select(.conclusion=="failure") | .name'`.
   - If the failing step is the same on `main` (`gh run list --branch main --workflow CI --limit 1`) or is `npm vulnerability check`, the failure is **systemic**: stop the whole loop and report. Fixing `main` comes first.
   - Otherwise mark this PR failed and continue; stop after two consecutive failures.

5. **Merge.** `gh pr merge N --squash --delete-branch` (squash is required by linear history). Then confirm `gh pr view N --json state --jq .state` is `MERGED`.

6. **Next.** `git switch main && git pull --ff-only`, then return to step 2 with the remaining list. Every Dependabot PR edits `package-lock.json`, so each merge invalidates the others; they must each be re-refreshed in step 3.

## Stop conditions

No PRs left, a systemic failure, two consecutive failures, or 20 PRs processed.

## Report

End with a table: PR number, title, outcome (merged / skipped: reason / failed: step), plus the exact next action for anything not merged. After a successful run, `npm audit --omit=dev` and `npm run verify` on updated `main` should still pass; run them and say so.
