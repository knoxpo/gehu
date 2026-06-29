# Release Checklist

Use this for every npm release of the `@gehu-js/*` packages.

## One-time repo setup

- Add npm trusted publisher config for each `@gehu-js/*` package
- Ensure GitHub Actions are enabled for the repo
- Protect `main` and require CI to pass
- Confirm ownership of all `@gehu-js/*` package names on npm
- Ensure publish runs on GitHub-hosted runners

Trusted publisher settings on npm:

- Organization or user: `knoxpo`
- Repository: `gehu`
- Workflow filename: `publish.yml`
- Allowed actions: `npm publish`

## Before cutting a release

- Merge the intended changes into `main`
- Ensure each release-worthy PR includes a `.changeset/*.md` file
- Pull the latest `main`

Run:

```sh
bun install
bun run build
bun run typecheck
bun run test:ci
bun run release:pack-check
```

## Prepare the release commit

Run:

```sh
bun run release:version
```

Review:

- package version bumps
- rewritten internal dependencies
- changelog updates

Commit the versioned files and push them to `main`.

## Production release

Create and push a stable tag on the version commit:

```sh
git tag vX.Y.Z
git push origin vX.Y.Z
```

Result:

- GitHub Actions publishes with `npm publish --provenance` to npm `latest`

## Prerelease / next release

Create and push a prerelease tag on the version commit:

```sh
git tag vX.Y.Z-next.N
git push origin vX.Y.Z-next.N
```

Result:

- GitHub Actions publishes with `npm publish --provenance` to npm `next`

## Optional tag verification

Before pushing a tag:

```sh
bun run release:assert-tag -- vX.Y.Z
```

or

```sh
bun run release:assert-tag -- vX.Y.Z-next.N
```

## If publish fails

- Check GitHub Actions logs
- Confirm the tag matches the package version
- Confirm the package has the trusted publisher configured on npm
- Confirm the package/version was not already published
- Confirm the workflow had `id-token: write`
- Re-run local validation:

```sh
bun run build
bun run typecheck
bun run test:ci
bun run release:pack-check
```

## Canonical docs

- Detailed guide: [docs/releasing.md](/Users/nayanhathiwala/Developer/Web/gehu/docs/releasing.md)
- Workflow definitions:
  - [ci.yml](/Users/nayanhathiwala/Developer/Web/gehu/.github/workflows/ci.yml)
  - [publish.yml](/Users/nayanhathiwala/Developer/Web/gehu/.github/workflows/publish.yml)
