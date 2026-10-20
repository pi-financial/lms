# Pi Next.js Boilerplate

Starter template for Pi Next.js applications: Next 16 App Router, Server Components by default,
observability, feature flags, CMS, security headers, a standalone container and the org's CI/CD.

**Not included, on purpose:** a UI component framework, authentication, and a message catalogue.
Locale _routing_ is here; translated UI strings are not.

<img width="891" height="634" alt="image" src="https://github.com/user-attachments/assets/df95edf7-7d2f-4f03-8202-5dbd42ffdd58" />

## Quick start

`@pi-financial/*` packages come from GitHub Packages. `.npmrc` is committed and points the scope at
that registry, reading the token from `$npm_read_token` — it holds only the variable reference, no
credential, which is why it is in `.dockerignore` but not `.gitignore`. CI sets that variable from
the `NPM_READ_TOKEN` secret; locally you export it yourself:

```bash
cp .env.example .env.local
export npm_read_token=<GitHub PAT with read:packages>
yarn install
yarn dev
```

Needs Node >= 24 and yarn 1.22 (npm is blocked — CI and the Dockerfiles expect `yarn.lock`).

Open http://localhost:3000; the proxy redirects to `/th` or `/en`. Three demo routes:

| Route                  | Shows                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `/[locale]/users`      | client-lib → user-srv-v2, filtered from the URL, rendered server-side |
| `/[locale]/growthbook` | flags evaluated on the server for the attributes in the URL           |
| `/[locale]/directus`   | tag-cached CMS read in the locale from the path                       |

`/users` needs the Pi VPN and `/directus` needs a reachable `DIRECTUS_HOST`. Without them each page
renders an explicit degraded state — which is part of what they demonstrate.

## Commands

| Command                            | Does                                     |
| ---------------------------------- | ---------------------------------------- |
| `yarn dev`                         | Dev server, logs through `pino-pretty`   |
| `yarn build` / `yarn start`        | Standalone production build and server   |
| `yarn lint` / `yarn lint:fix`      | oxlint + Prettier                        |
| `yarn typecheck`                   | `tsc --noEmit` for the app and the tests |
| `yarn test` / `yarn test:coverage` | Jest                                     |
| `yarn gen:tokens`                  | Regenerate `app/palette.generated.css`   |

## What's wired up

**Logging and tracing — `libs/logger/`.** Three runtimes, three entry points; import the right one.

| Where                                          | Import                |
| ---------------------------------------------- | --------------------- |
| Server Component, Server Action, Route Handler | `@libs/logger`        |
| Client Component                               | `@libs/logger/client` |
| `proxy.ts` / Edge                              | `@libs/logger/edge`   |

`@libs/logger` is `server-only`, so importing it from a Client Component fails the build instead of
pulling pino into the browser bundle. `instrumentation.ts` starts OpenTelemetry before any app code;
browser telemetry posts to `/api/telemetry/{logs,traces}`, which forward to SigNoz — the collector
address never reaches the browser. Everything is off until the `NEXT_PUBLIC_SIGNOZ_*` flags are on.
`NEXT_PUBLIC_DEPLOYMENT_ENV` is normalised to `Development` / `Staging` / `Production`, because
SigNoz filters on that string verbatim.

> The telemetry routes are unauthenticated, guarded only by a per-IP rate limit and a body cap. Once
> you add a session layer, guard them with it — see the `TODO(auth)` in `telemetry-guard.ts`.

**Feature flags — `libs/growthbook/`.** `GrowthBookClient` (one per process) evaluates flags on the
server and ships only the results, so targeting rules stay in the cluster and the first render is
already correct. Register flags in the `FeatureKey` enum; anything not listed is never evaluated.
`GROWTHBOOK_KEY` is the SDK client key (`sdk-…`).

**CMS — `libs/directus/`.** Reads the shared `web_contents` collection with the same query the other
Pi apps use:

```
?fields=id,namespace,translations.value
&deep[translations][_filter][languages_code][code][_starts_with]=th
&deep[translations][_filter][value][_nnull]=true
&filter[namespace][_in]=1&limit=-1
```

`deep` filters the nested translations rather than the rows (a plain filter would make an
untranslated row vanish); `_starts_with` matches locales like `th-TH`; `limit: -1` stops Directus
silently capping at 100 rows. `DIRECTUS_HOST` is a base URL — the SDK appends `/items`.

`getWebContents()` never rejects, returning `{ items, degraded }`. The catch sits _outside_
`unstable_cache` so a transient outage is retried instead of pinning an empty list for an hour.

**Backend services — `libs/user/`.** The client-lib pattern: `service.ts` calls
`@pi-financial/user-srv-v2-client-axios`, `mapper.ts` converts generated DTOs into the domain types
in `definitions.ts`. Copy this shape per service. Rules in [AGENTS.md](AGENTS.md).

**Design tokens — `app/palette.generated.css`.** `yarn gen:tokens` turns the `pi-common-js` palette
and typography into Tailwind v4 `@theme` variables (`bg-pi-mint-500`, `text-body-m`). The output is
committed and a test runs `--check`, so a package upgrade that changes a colour fails the build.

**Locale and theme — `libs/preferences/`, `proxy.ts`.** Locale lives in the path (`/th/directus`)
because it changes what the page _contains_ and must be linkable; `proxy.ts` redirects unprefixed
requests using a cookie. Theme lives in a cookie, read on the server so `<html data-theme>` is right
in the first byte — a `localStorage` theme always paints the wrong colour first. Dark mode needs no
extra classes: the Pi palette inverts consistently, so `text-grey-700` resolves correctly in both.

**Security headers — `libs/security/securityHeaders.mjs`.** CSP and friends on every route,
**enforced** rather than report-only, since a fresh app loads no third party. Adding a vendor means
adding a directive; ship that to staging with `enforce: false` first. `'unsafe-inline'` stays in
`script-src` because Next injects an inline bootstrap script; removing it means nonces, which forces
every route dynamic.

**Linting.** oxlint, not ESLint: this template runs TypeScript 7 and `typescript-eslint` hard-throws
on TS >= 7 ([#10940]), which takes down `eslint-config-next` and even a bare parser. oxlint does not
touch the TS compiler API. Lost: type-aware rules. To go back, pin `typescript@^5.9` and add
`eslint` + `eslint-config-next`; nothing else depends on the choice.

[#10940]: https://github.com/typescript-eslint/typescript-eslint/issues/10940

## Docker

```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=GIT_AUTH_TOKEN,env=npm_read_token \
  -f docker/staging/Dockerfile -t nextjs-boilerplate .
```

Four stages ending in `gcr.io/distroless/nodejs24-debian12:nonroot` — no shell, no package manager,
no sources. The registry token is a BuildKit secret, so it never lands in a layer. `.npmrc` is in
`.dockerignore` because it contains `${npm_read_token}`, which does not exist inside `docker build`.
The build stages are `node:24-bookworm-slim` to match the runtime's glibc: node_modules built on
Alpine's musl load fine until some dependency ships a native binding, then fail at runtime.

### Runtime `NEXT_PUBLIC_*`

`NEXT_PUBLIC_*` are inlined into the client bundle by `next build`, which collides with promoting
one image between environments. So `.env.production` writes the ones that vary as a placeholder:

```
NEXT_PUBLIC_DEPLOYMENT_ENV=__NEXT_PUBLIC_DEPLOYMENT_ENV__
```

`docker/entrypoint.mjs` rewrites those tokens under `/app/.next` from the container environment
before importing `server.js`. Same idea as `pi-trading-web`'s `entrypoint.sh`, in Node because
distroless has no shell — and it also covers `.rsc` payloads, which the shell version does not.

To make another public var runtime-configurable: use it in code, set `NAME=__NAME__` in
`.env.production`, and have the platform supply `NAME`. Nothing in the Dockerfile changes.

- **The platform must supply `NEXT_PUBLIC_DEPLOYMENT_ENV`** (`Development` | `Staging` |
  `Production`). Without it the server falls back to `NODE_ENV`, but the browser shows the literal
  placeholder — the entrypoint logs a warning naming every token it could not fill.
- **Booleans stay baked.** The SigNoz toggles and the service name are not per-environment values
  and cannot come from a secrets manager, so they are written literally.
- **`.next` is rewritten in place at startup**, so `readOnlyRootFilesystem` is incompatible — the
  container exits on EROFS before serving. Mounting an `emptyDir` over `.next` does not help; it
  hides the build output and `server.js` then fails to load.
- **`.env*` is deleted from the standalone output** so it cannot become an in-image fallback that
  the platform cannot override and Reloader can never refresh.

## CI/CD

Thin callers around the workflows documented in `pi-financial/github-action-workflow`'s README —
`nodejs-pr.yml`, `nodejs-staging.yml`, `nodejs-promote-prod.yml`. AWS is OIDC assume-role, so there
are no static credentials, and the gitops target is `gitops_dir_name` inside `pi-financial/gitops`.

| Workflow                  | Trigger                     | Result                                                    |
| ------------------------- | --------------------------- | --------------------------------------------------------- |
| `pr-lint.yml`             | any PR                      | Conventional-commit check on the PR title                 |
| `pull_request.yml`        | PR labelled `Ready To Test` | lint → test → scan → build → PR environment + URL comment |
| `remove_labels.yml`       | new commit on a PR          | Strip `Ready To Test` + `preview` to re-arm the PR deploy |
| `deploy_staging.yml`      | push to `main`              | lint → test → SonarQube → build → ECR → bump gitops       |
| `production-promote.yaml` | Release published           | Retag the staging image into prod ECR → bump gitops       |

Production is a **retag, not a rebuild**: the bits that ship are the bits that were tested.

Gotchas, all verified against the shared workflows:

- **PR titles must be `type(TICKET-123): summary`** — the shared lint requires a scope matching
  `^[A-Z]+-\d+$`. Types: `fix feat build chore ci docs style refactor perf test`.
- **`code_language` must be `nodejs`** — the lint and test actions branch on that exact string, and
  any other value (including the `typescript` in some org examples) silently skips both.
- **`should_run_lint` and `sonarcloud_skip` are declared but never referenced.** Setting them does
  nothing; `sonarqube: 'true'` is the input that gates a real job.
- **`deployment_env` must be `staging`, `production` or `prod`** — `taganddeploy-gitops` maps it to
  the gitops directory and fails the run on anything else. It also names the GitHub Environment.
- **Declaring `permissions` drops every scope you leave out.** `pull_request.yml` needs
  `actions: read` on top of the shared README's example, because the PR comment job reads the run's
  own job logs.
- **`post-pr-deployment-comment.yml` greps the deploy log** for the string `nodejs-pr.yml` echoes
  (`PR Environment ready at ...`). Change one and the comment disappears with no error.
- **Staging does not cancel in-progress runs.** `nodejs-staging.yml` serialises its own build-push,
  so overlapping pushes queue at the deploy step rather than racing the gitops commit.

**Secrets:** `GH_ACCESS_TOKEN`, `NPM_READ_TOKEN`, `TOKEN_IMAGE_UPDATE`, `SONARQUBE_TOKEN`, plus
`DIRECTUS_PROJECT_URL` / `DIRECTUS_TOKEN` for the CMS.
**Variables:** `AWS_TH_REGION`, `ECR_REPOSITORY`, `ECR_SERVICE_ROLE_NONPROD`, `ECR_SERVICE_ROLE_PROD`.

## Using this as a template

1. Rename in `package.json`, the workflow files (`application_name`, `gitops_dir_name`) and
   `NEXT_PUBLIC_SIGNOZ_SERVICE_NAME` in `.env.*`. Set the repo variable `ECR_REPOSITORY` and add a
   matching app directory under `registry/environments/*/argocd/` in `pi-financial/gitops`.
2. Register routes in `app/nav-items.ts` — the header nav and landing page both read from it.
3. Delete the demo routes and `libs/user/` once you have real pages, or keep one as a reference.
4. Trim `FeatureKey` and `ContentNamespace` to your own.
5. Add whatever UI framework you want. Nothing here assumes one.

**Network debug.** `pi-common-js` ships a server-side network/log overlay that `pi-trading-web` uses
in dev and staging. It is not wired up here because its UI needs `@mui/material` + `@emotion`. To
enable it, install those and follow `node_modules/@pi-financial/pi-common-js/src/networkDebug/README.md`;
`NETWORK_DEBUG` is reserved in `.env.example`.
