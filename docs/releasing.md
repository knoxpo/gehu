# Releasing

This repo publishes each `packages/*` library as its own npm package:

- `@gehu-js/core`
- `@gehu-js/angular`
- `@gehu-js/react`
- `@gehu-js/persist`
- `@gehu-js/devtools`
- `@gehu-js/testing`

The release model is:

- one monorepo
- separate npm packages
- lockstep versions across all publishable packages
- CI on PRs and `main`
- publish only from git tags
- stable releases go to npm `latest`
- prereleases go to npm `next`

This repo uses **npm trusted publishing** for GitHub Actions, not a long-lived `NPM_TOKEN`.

## Workflows

### CI

File: `.github/workflows/ci.yml`

Runs on:

- pull requests
- pushes to `main`

Checks:

- `bun install --frozen-lockfile`
- `bun run build`
- `bun run typecheck`
- `bun run test:ci`
- `bun run release:pack-check`

`release:pack-check` validates the actual npm tarballs, not just the source tree. It fails if packages ship unexpected files, test artifacts, or broken entrypoints.

### Publish

File: `.github/workflows/publish.yml`

Runs on pushed tags matching `v*`.

Behavior:

- installs dependencies
- rebuilds and retests everything
- checks that the git tag matches the package version
- maps release channel from the tag name
- publishes each package with `npm publish --provenance`
- skips package versions that already exist on npm

Trusted publishing requirements in this workflow:

- GitHub-hosted runner
- `permissions.id-token: write`
- Node `22.14.0+`
- npm CLI `11.5.1+` via `actions/setup-node`

Changesets is still used for versioning and internal dependency rewriting. The actual publish step is explicit npm publish with provenance.

Tag mapping:

- `v1.2.3` -> npm tag `latest`
- `v1.2.3-next.0` -> npm tag `next`

## GitHub repo configuration

Configure these once in the GitHub repository.

### 1. Add trusted publishers on npm

In npm, for each published package:

- `@gehu-js/core`
- `@gehu-js/angular`
- `@gehu-js/react`
- `@gehu-js/persist`
- `@gehu-js/devtools`
- `@gehu-js/testing`

Open package settings on `npmjs.com` and add a trusted publisher with:

- Organization or user: `knoxpo`
- Repository: `gehu`
- Workflow filename: `publish.yml`
- Environment name: leave empty unless you later gate publish with a GitHub Environment
- Allowed actions: `npm publish`

Important npm constraint:

- each package can have only one trusted publisher at a time

### 2. Allow Actions to run

In GitHub:

`Settings` -> `Actions` -> `General`

Recommended:

- allow GitHub Actions
- allow `Read repository contents permission`
- keep workflow permissions at default read-only

The publish workflow requests:

- `contents: read`
- `id-token: write`

### 3. Protect `main`

In GitHub:

`Settings` -> `Branches` -> branch protection rules

Recommended:

- require pull request before merge
- require status checks to pass
- include the CI workflow check
- restrict direct pushes to `main`

### 4. Decide who can push release tags

Publishing happens when a matching tag is pushed. Limit tag creation/push access to maintainers.

Recommended convention:

- stable: `vX.Y.Z`
- prerelease: `vX.Y.Z-next.N`

## npm configuration

Before the first publish:

1. Create the npm org/scope if needed.
2. Confirm you own `@gehu-js/*`.
3. Ensure packages are public.
4. Add trusted publisher config for each package on npm.

## Changesets flow

This repo uses Changesets to:

- keep versions lockstep
- rewrite internal `workspace:*` dependencies to real semver
- generate changelogs/version updates before tagging

Config lives in:

- `.changeset/config.json`

Examples are ignored and never published.

## Release process

### Normal stable release

1. Add one or more changeset files in `.changeset/` as part of normal PRs.
2. Merge PRs into `main`.
3. On a release-prep branch or directly on `main`, run:

```sh
bun run release:version
```

4. Review the changed package versions and changelogs.
5. Commit the version bump.
6. Push that commit to `main`.
7. Tag the same commit:

```sh
git tag v0.1.0
git push origin v0.1.0
```

8. GitHub Actions publishes all changed packages to npm `latest`.

### Prerelease / next release

Use the same version-prep flow, but create a prerelease version and tag:

```sh
git tag v0.1.0-next.0
git push origin v0.1.0-next.0
```

That publishes to npm `next`, not `latest`.

Consumers can install it explicitly:

```sh
npm install @gehu-js/core@next
```

## Managing `next` and production

Use `next` for:

- release candidates
- preview integrations
- breaking-change validation
- adapter changes you want early feedback on

Use `latest` for:

- stable public releases
- documented production installs
- versions you want default `npm install` to resolve

Recommended operating model:

- merge regular work to `main`
- cut prerelease tags while validating risky or larger batches
- cut stable tags only after prerelease confidence is good

## Local verification before tagging

Run:

```sh
bun run build
bun run typecheck
bun run test:ci
bun run release:pack-check
```

Optional tag check:

```sh
bun run release:assert-tag -- v0.1.0
```

## Failure cases

### Tag does not match package version

`release:assert-tag` fails.

Fix:

- run `bun run release:version` if versions were not prepared yet
- or push the correct tag for the versioned commit

### Package tarball contains extra files

`release:pack-check` fails.

Fix:

- inspect packed files with `npm pack --dry-run`
- remove tests/source artifacts from published output
- ensure package entrypoints point to real files

### Publish succeeds for `next`, but not `latest`

Usually means:

- wrong tag pushed
- the package does not have the trusted publisher configured on npm
- package version already exists on npm
- workflow is not running on a GitHub-hosted runner

## Quick commands

```sh
# build and validate everything
bun run build
bun run typecheck
bun run test:ci
bun run release:pack-check

# prepare versions/changelogs
bun run release:version

# verify a tag matches package versions
bun run release:assert-tag -- v0.1.0
```

## Migration from token-based publishing

If this repo previously used `NPM_TOKEN`:

1. Add trusted publishers on npm for all `@gehu-js/*` packages.
2. Confirm `.github/workflows/publish.yml` has `id-token: write`.
3. Remove or stop relying on the `NPM_TOKEN` GitHub Actions secret for publish.
4. Run the next release from a GitHub-hosted runner only.
