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
			description: 'Your IdentArk API key (starts with iak_)',
		},
		{
			displayName: 'Control Plane URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://identark-cloud.fly.dev',
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

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/health',
			method: 'GET',
		},
	};
}
