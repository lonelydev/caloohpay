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

3. **Refresh, only if needed.** CI on a PR is only meaningful if it ran against current `main`. Check first:

   ```bash
   head=$(gh pr view N --json headRefOid --jq .headRefOid)
   gh api repos/{owner}/{repo}/compare/main...$head --jq '.behind_by'
   ```

   `mergeStateStatus: CLEAN` alone does not mean up to date (a `CLEAN` PR can be many commits behind `main` with stale CI). Skip the rebase and go to step 4 only if `behind_by` is `0` **and** `mergeStateStatus` is `CLEAN`. Otherwise record `head` and the PR's comment count, then `gh pr comment N --body "@dependabot rebase"`.
   - **Poll every 30s, 3 minutes max,** until `headRefOid` changes.
   - **Any new Dependabot comment means it did not rebase; stop polling.** Read it: `gh pr view N --json comments --jq '.comments[-1] | select(.author.login=="dependabot") | .body'`.
     - "can't be rebased" (its `dependabot.yml` entry was deleted, or the PR was edited): permanent. Mark "needs human: close it so Dependabot can recreate it".
     - Any other error (for example "Something went wrong on our end"): transient. Retry the comment **once**, with another 3-minute poll. If it fails again, mark "needs human: Dependabot rebase failing".
   - If the head never changes and there is no comment within 3 minutes, mark "needs human: rebase timed out". Never push to its branch yourself.

4. **Gate.** `gh pr checks N --watch --fail-fast --interval 30` (give up after 20 minutes and mark "needs human: CI timed out"). Then verify with `gh pr checks N` that every check is `pass`.
   - On failure, find the failing step: `gh run view <run-id> --json jobs --jq '.jobs[].steps[] | select(.conclusion=="failure") | .name'`.
   - If the failing step is the same on `main` (`gh run list --branch main --workflow CI --limit 1`) or is `npm vulnerability check`, the failure is **systemic**: stop the whole loop and report. Fixing `main` comes first.
   - Otherwise mark this PR failed and continue; stop after two consecutive failures.

5. **Merge.** `gh pr merge N --squash --delete-branch` (squash is required by linear history). Then confirm `gh pr view N --json state --jq .state` is `MERGED`.

6. **Next.** `git switch main && git pull --ff-only`, then return to step 2 with the remaining list. Every Dependabot PR edits `package-lock.json`, so each merge invalidates the others; they must each be re-refreshed in step 3.

## Stop conditions

No PRs left, a systemic failure, two consecutive failures, or 20 PRs processed.

## Report

End with a table: PR number, title, outcome (merged / skipped: reason / failed: step), plus the exact next action for anything not merged. After a successful run, `npm audit --omit=dev` and `npm run verify` on updated `main` should still pass; run them and say so.
