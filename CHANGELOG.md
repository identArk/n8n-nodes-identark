# Changelog

All notable changes to `n8n-nodes-identark` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2]

### Fixed

- Corrected the documented API key prefix from `iak_` to `csk_` in the credential
  field description and the README. IdentArk server keys are `csk_`-prefixed; the
  previous text sent users looking for a key format that does not exist.
- Changed the default **Control Plane URL** from the raw Fly hostname
  (`https://identark-cloud.fly.dev`) to the public API endpoint
  (`https://api.identark.io`), so installs route through the documented,
  stable address rather than a deployment-specific host.

## [1.0.0]

### Added

- Initial release of the IdentArk community node.
- **Invoke LLM** — send messages to an LLM through the IdentArk gateway; the n8n
  instance never holds the provider API key.
- **Create Session** — open a cost-capped, credential-isolated agent session.
- **Get Session Cost** — read the running spend for a session.
- **Register Agent** / **Delete Agent** / **List Agents** — manage agent identities.
- **List Pending Approvals** / **Get Approval** / **Submit Decision** — drive the
  Human-in-the-Loop approval queue from a workflow.
- `IdentArk API` credential using bearer-token authentication with a health-check test.
