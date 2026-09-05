# RENZU deployment

## Environments

| Environment | Trigger | Vite base | Pages path |
| --- | --- | --- | --- |
| Local | manual | `/` | local dev server |
| Staging | push to `main` | `/renzu/staging/` | `/renzu/staging/` |
| Production | `v*` tag or manual production dispatch | `/renzu/` | `/renzu/` |

## Deployment model

GitHub Pages publishes one artifact for the repository, so staging and production are composed into one persisted site tree rather than deployed independently.

`pages-state` stores the last complete Pages tree:

```text
pages-state
├─ index.html + assets/     # production
└─ staging/
   ├─ index.html
   └─ assets/               # staging
```

A staging deployment replaces only `staging/`. A production deployment replaces the root site while preserving `staging/`.

## Pipeline

1. Resolve target from the event.
2. Install dependencies and run tests.
3. Build with the target Vite mode.
4. Verify generated asset URLs use the expected base path.
5. Restore the previous `pages-state` tree if it exists.
6. Replace only the target environment content.
7. Persist the complete tree back to `pages-state`.
8. Upload and deploy the complete Pages artifact.
9. Smoke-check the deployed HTML and its first absolute build asset.

## GitHub repository requirement

GitHub Pages must be enabled for the repository with **GitHub Actions** as the deployment source. The workflow uses the standard `github-pages` environment and requires `pages: write`, `id-token: write`, and `contents: write` permissions.

## Release policy

- Feature branches: PR + CI only.
- `main`: automatically deploys staging.
- `v*` release tags: deploy production.
- Manual workflow dispatch can explicitly deploy either target.

`main` should remain releasable; production releases should only be tagged after staging smoke/device validation.
