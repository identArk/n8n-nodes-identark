import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const MODEL_OPTIONS = [
	{ name: 'Claude Haiku', value: 'claude-haiku-4-5-20251001' },
	{ name: 'Claude Sonnet 4', value: 'claude-sonnet-4-6' },
	{ name: 'GPT-4o', value: 'gpt-4o' },
	{ name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
	{ name: 'Mistral Large', value: 'mistral-large-latest' },
	{ name: 'Mistral Small', value: 'mistral-small-latest' },
];

const PROVIDER_OPTIONS = [
	{ name: 'Anthropic', value: 'anthropic' },
	{ name: 'AWS Bedrock (UK)', value: 'bedrock' },
	{ name: 'Azure OpenAI (UK)', value: 'azure_openai' },
	{ name: 'Mistral AI (EU)', value: 'mistral' },
	{ name: 'OpenAI', value: 'openai' },
];

export class IdentArk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IdentArk',
		name: 'identArk',
		icon: { light: 'file:identark.svg', dark: 'file:identark.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Route LLM calls through the IdentArk gateway so your workflows hold zero API keys',
		defaults: {
			name: 'IdentArk',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'identArkApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Agent', value: 'agent' },
					{ name: 'Approval', value: 'approval' },
					{ name: 'LLM', value: 'llm' },
					{ name: 'Session', value: 'session' },
				],
				default: 'llm',
			},

			// ── Operations: LLM ────────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['llm'],
					},
				},
				options: [
					{
						name: 'Invoke',
						value: 'invoke',
						description: 'Send messages to an LLM and get a response',
						action: 'Invoke an LLM',
					},
				],
				default: 'invoke',
			},

			// ── Operations: Session ────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['session'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Open a credential-isolated agent session',
						action: 'Create a session',
					},
					{
						name: 'Get Cost',
						value: 'getCost',
						description: 'Get the running cost for a session',
						action: 'Get session cost',
					},
				],
				default: 'create',
			},

			// ── Operations: Agent ──────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['agent'],
					},
				},
				options: [
					{
						name: 'Delete',
						value: 'delete',
						description: 'Remove an agent identity',
						action: 'Delete an agent',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List registered agents',
						action: 'List agents',
					},
					{
						name: 'Register',
						value: 'register',
						description: 'Register a new agent identity',
						action: 'Register an agent',
					},
				],
				default: 'list',
			},

			// ── Operations: Approval ───────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['approval'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get the details of a single approval request',
						action: 'Get an approval',
					},
					{
						name: 'List Pending',
						value: 'listPending',
						description: 'List human-in-the-loop approvals awaiting a decision',
						action: 'List pending approvals',
					},
					{
						name: 'Submit Decision',
						value: 'submitDecision',
						description: 'Approve or reject a pending approval request',
						action: 'Submit an approval decision',
					},
				],
				default: 'listPending',
			},

			// ── LLM: Invoke ────────────────────────────────────────────────────────
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['llm'],
						operation: ['invoke'],
					},
				},
				description: 'The message to send to the LLM',
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{ name: 'Assistant', value: 'assistant' },
					{ name: 'System', value: 'system' },
					{ name: 'User', value: 'user' },
				],
				default: 'user',
				displayOptions: {
					show: {
						resource: ['llm'],
						operation: ['invoke'],
					},
				},
				description: 'The role of the message sender',
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['llm'],
						operation: ['invoke'],
					},
				},
				description: 'Session to continue a conversation. Leave empty to start a new one.',
			},

			// ── Session: Create ────────────────────────────────────────────────────
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['create'],
					},
				},
				description: 'Identifier for the agent that owns this session',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: MODEL_OPTIONS,
				default: 'gpt-4o',
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['create'],
					},
				},
				description: 'The LLM model to use for this session',
			},
			{
				displayName: 'Provider',
				name: 'provider',
				type: 'options',
				options: PROVIDER_OPTIONS,
				default: 'openai',
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['create'],
					},
				},
				description: 'The LLM provider to route this session through',
			},
			{
				displayName: 'Credential Reference',
				name: 'credentialRef',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['create'],
					},
				},
				description: 'Vault path to the LLM credential, e.g. secret/orgs/{org}/providers/openai',
			},
			{
				displayName: 'Cost Cap (USD)',
				name: 'costCapUsd',
				type: 'number',
				default: 5,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['create'],
					},
				},
				description: 'Maximum spend allowed for this session before calls are rejected',
			},

			// ── Session: Get Cost ──────────────────────────────────────────────────
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['session'],
						operation: ['getCost'],
					},
				},
				description: 'Session to read the running cost for',
			},

			// ── Agent: Register ────────────────────────────────────────────────────
			{
				displayName: 'Agent Name',
				name: 'agentName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['register'],
					},
				},
				description: 'Human-readable name for the new agent',
			},
			{
				displayName: 'Agent Description',
				name: 'agentDescription',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['register'],
					},
				},
				description: 'Optional description of what the agent does',
			},
			{
				displayName: 'Model',
				name: 'registerModel',
				type: 'options',
				options: MODEL_OPTIONS,
				default: 'gpt-4o',
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['register'],
					},
				},
				description: 'Default model for the agent',
			},
			{
				displayName: 'Provider',
				name: 'registerProvider',
				type: 'options',
				options: PROVIDER_OPTIONS,
				default: 'openai',
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['register'],
					},
				},
				description: 'Default provider for the agent',
			},
			{
				displayName: 'Credential Reference',
				name: 'registerCredentialRef',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['register'],
					},
				},
				description: 'Vault path to the credential the agent may use',
			},

			// ── Agent: Delete ──────────────────────────────────────────────────────
			{
				displayName: 'Agent ID',
				name: 'deleteAgentId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['delete'],
					},
				},
				description: 'ID of the agent to delete',
			},

			// ── Agent: List ────────────────────────────────────────────────────────
			{
				displayName: 'Filter',
				name: 'listFilter',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'All', value: 'all' },
					{ name: 'Inactive', value: 'inactive' },
				],
				default: 'all',
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['list'],
					},
				},
				description: 'Which agents to return',
			},

			// ── Approval: List Pending ─────────────────────────────────────────────
			{
				displayName: 'Limit',
				name: 'approvalLimit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 20,
				displayOptions: {
					show: {
						resource: ['approval'],
						operation: ['listPending'],
					},
				},
				description: 'Max number of results to return',
			},

			// ── Approval: Get / Submit Decision ────────────────────────────────────
			{
				displayName: 'Approval ID',
				name: 'approvalId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['approval'],
						operation: ['get', 'submitDecision'],
					},
				},
				description: 'ID of the approval request',
			},
			{
				displayName: 'Decision',
				name: 'decision',
				type: 'options',
				options: [
					{ name: 'Approve', value: 'approve' },
					{ name: 'Reject', value: 'reject' },
				],
				default: 'approve',
				displayOptions: {
					show: {
						resource: ['approval'],
						operation: ['submitDecision'],
					},
				},
				description: 'Whether to approve or reject the request',
			},
			{
				displayName: 'Comment',
				name: 'decisionComment',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['approval'],
						operation: ['submitDecision'],
					},
				},
				description: 'Optional reason recorded with the decision in the audit log',
			},
			{
				displayName: 'MFA Token',
				name: 'mfaToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['approval'],
						operation: ['submitDecision'],
					},
				},
				description: 'Multi-factor token, if the policy requires step-up verification',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('identArkApi');
		const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');
		const action = `${resource}:${operation}`;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject;

				if (action === 'llm:invoke') {
					const message = this.getNodeParameter('message', i) as string;
					const role = this.getNodeParameter('role', i) as string;
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					const body: IDataObject = {
						new_messages: [{ role, content: message }],
					};
					if (sessionId) {
						body.session_id = sessionId;
					}

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'POST',
							url: `${baseUrl}/v1/llm/invoke`,
							body,
							json: true,
						},
					)) as IDataObject;
				} else if (action === 'session:create') {
					const agentId = this.getNodeParameter('agentId', i) as string;
					const model = this.getNodeParameter('model', i) as string;
					const provider = this.getNodeParameter('provider', i) as string;
					const credentialRef = this.getNodeParameter('credentialRef', i) as string;
					const costCapUsd = this.getNodeParameter('costCapUsd', i) as number;

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'POST',
							url: `${baseUrl}/v1/sessions`,
							body: {
								agent_id: agentId,
								model,
								provider,
								credential_ref: credentialRef,
								cost_cap_usd: costCapUsd,
							},
							json: true,
						},
					)) as IDataObject;
				} else if (action === 'session:getCost') {
					const sessionId = this.getNodeParameter('sessionId', i) as string;

					if (!sessionId) {
						throw new NodeOperationError(this.getNode(), 'Session ID is required', {
							itemIndex: i,
						});
					}

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'GET',
							url: `${baseUrl}/v1/sessions/cost`,
							qs: { session_id: sessionId },
							json: true,
						},
					)) as IDataObject;
				} else if (action === 'agent:register') {
					const name = this.getNodeParameter('agentName', i) as string;
					const description = this.getNodeParameter('agentDescription', i) as string;
					const model = this.getNodeParameter('registerModel', i) as string;
					const provider = this.getNodeParameter('registerProvider', i) as string;
					const credentialRef = this.getNodeParameter('registerCredentialRef', i) as string;

					const body: IDataObject = {
						name,
						model,
						provider,
						credential_ref: credentialRef,
					};
					if (description) {
						body.description = description;
					}

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'POST',
							url: `${baseUrl}/v1/agents`,
							body,
							json: true,
						},
					)) as IDataObject;
				} else if (action === 'agent:delete') {
					const agentId = this.getNodeParameter('deleteAgentId', i) as string;

					await this.helpers.httpRequestWithAuthentication.call(this, 'identArkApi', {
						method: 'DELETE',
						url: `${baseUrl}/v1/agents/${agentId}`,
						json: true,
					});
					// DELETE returns 204 No Content — synthesise a useful result.
					responseData = { success: true, agent_id: agentId, status: 'deleted' };
				} else if (action === 'agent:list') {
					const filter = this.getNodeParameter('listFilter', i) as string;
					const qs: IDataObject = {};
					if (filter === 'active') {
						qs.is_active = 'true';
					} else if (filter === 'inactive') {
						qs.is_active = 'false';
					}

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'GET',
							url: `${baseUrl}/v1/agents`,
							qs,
							json: true,
						},
					)) as IDataObject;
				} else if (action === 'approval:listPending') {
					const limit = this.getNodeParameter('approvalLimit', i) as number;

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'GET',
							url: `${baseUrl}/v1/mcp/approvals/pending`,
							qs: { limit: String(limit) },
							json: true,
						},
					)) as IDataObject;
				} else if (action === 'approval:get') {
					const approvalId = this.getNodeParameter('approvalId', i) as string;

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'GET',
							url: `${baseUrl}/v1/mcp/approvals/${approvalId}`,
							json: true,
						},
					)) as IDataObject;
				} else if (action === 'approval:submitDecision') {
					const approvalId = this.getNodeParameter('approvalId', i) as string;
					const decision = this.getNodeParameter('decision', i) as string;
					const comment = this.getNodeParameter('decisionComment', i) as string;
					const mfaToken = this.getNodeParameter('mfaToken', i) as string;

					const body: IDataObject = { decision };
					if (comment) {
						body.comment = comment;
					}
					if (mfaToken) {
						body.mfa_token = mfaToken;
					}

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'identArkApi',
						{
							method: 'POST',
							url: `${baseUrl}/v1/mcp/approvals/${approvalId}/decision`,
							body,
							json: true,
						},
					)) as IDataObject;
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported resource/operation: ${action}`,
						{ itemIndex: i },
					);
				}

				returnData.push({ json: responseData, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
