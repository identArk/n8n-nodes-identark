# n8n-nodes-identark

This is an n8n community node. It lets you use [IdentArk](https://identark.io) in your n8n workflows.

IdentArk is credential-isolation and governance infrastructure for AI agents. Your n8n
instance routes LLM calls through the IdentArk gateway, so the API keys live in IdentArk's
vault — **not** in your workflows, environment, or credentials store. Every call is
risk-scored, cost-tracked, and written to an immutable audit log, and high-risk actions can
be paused for human approval.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short: **Settings → Community Nodes → Install**, then enter `n8n-nodes-identark`.

The node is free and open source. It connects to the IdentArk control plane, which is where credential isolation, risk scoring, approvals, and audit logging run — [create a free account at identark.io](https://identark.io) to get started.

## Operations

| Operation | Description |
|-----------|-------------|
| **Invoke LLM** | Send a message to an LLM through the gateway and get the response. Supports `system` / `user` / `assistant` roles and continuing a conversation via a session ID. |
| **Create Session** | Open a credential-isolated agent session with a model, provider, vault credential reference, and a cost cap. |
| **Get Session Cost** | Read the running spend for a session. |
| **Register Agent** | Register a new agent identity with a default model, provider, and credential reference. |
| **Delete Agent** | Remove an agent identity. |
| **List Agents** | List registered agents, optionally filtered by active/inactive. |
| **List Pending Approvals** | List Human-in-the-Loop approvals awaiting a decision. |
| **Get Approval** | Fetch the full context of a single approval request. |
| **Submit Decision** | Approve or reject a pending request, with an optional comment and MFA token. |

## Credentials

You need an IdentArk account and an API key. **[Create a free account at identark.io →](https://identark.io)** (no card required).

1. Sign up at [identark.io](https://identark.io) and create an organisation.
2. In the dashboard, open **Settings → API Keys** and generate a key (it starts with `iak_`).
3. Register your LLM provider credentials in the IdentArk vault.

Then in n8n create an **IdentArk API** credential:

| Field | Description |
|-------|-------------|
| **API Key** | Your IdentArk API key (`iak_…`). Sent as a bearer token. |
| **Control Plane URL** | Base URL of your IdentArk control plane. Defaults to `https://identark-cloud.fly.dev`. |

The credential is verified against the control plane's `/health` endpoint when you save it.

## Compatibility

- Requires n8n with community-node API version 1.
- Tested against the current n8n LTS release.
- Node.js >= 20.15.
- No runtime dependencies.

## Usage

A typical governed-agent workflow:

1. **Create Session** — choose the model, provider, vault credential reference, and cost cap.
2. **Invoke LLM** — pass the returned session ID to continue the conversation. The provider
   key never enters n8n; the gateway injects it at call time.
3. **Get Session Cost** — check spend before the next step or for billing.

To add human oversight, branch on **List Pending Approvals** → **Get Approval** →
**Submit Decision**: surface high-risk actions to a reviewer (e.g. via a Slack or email
node) and only proceed once the decision is approved.

If you're new to n8n, see [Try it out](https://docs.n8n.io/try-it-out/).

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [IdentArk documentation](https://identark.io)
- [IdentArk SDK on GitHub](https://github.com/identark/identark)

## Version history

### 1.0.0

Initial release: Invoke LLM, Create/Get-cost Session, agent management
(Register/Delete/List), and the Human-in-the-Loop approval flow
(List Pending / Get / Submit Decision).

## License

[MIT](LICENSE)
