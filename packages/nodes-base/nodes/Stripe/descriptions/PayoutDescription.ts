import {INodeProperties} from 'n8n-workflow';

export const payoutOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'get',
		description: 'Operation to perform',
		options: [
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all payouts'
			}
		],
		displayOptions: {
			show: {
				resource: [
					'payout'
				]
			}
		}
	}
]
