import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class IdentArkApi implements ICredentialType {
	name = 'identArkApi';

	displayName = 'IdentArk API';

	icon: Icon = { light: 'file:identark.svg', dark: 'file:identark.dark.svg' };

	documentationUrl = 'https://github.com/identark/n8n-nodes-identark#credentials';

	properties: INodeProperties[] = [
		{
			displayName:
				'Need an API key? Create a free IdentArk account at <a href="https://identark.io" target="_blank">identark.io</a>, then copy your key from Settings → API Keys.',
			name: 'signupNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your IdentArk API key (starts with csk_)',
		},
		{
			displayName: 'Control Plane URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.identark.io',
			required: true,
			description: 'Base URL of your IdentArk control plane',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.apiKey}}',
			},
		},
	};

	// Tests the credential, not just reachability. /health is unauthenticated, so
	// it returns 200 for an empty or invalid key — a green tick that means nothing.
	// /v1/agents requires agents:read, which every scope preset (read, invoke,
	// admin) includes, and is already called by the List Agents operation.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/agents',
			method: 'GET',
		},
	};
}
