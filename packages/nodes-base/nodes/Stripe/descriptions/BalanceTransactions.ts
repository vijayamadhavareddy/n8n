import {INodeProperties} from 'n8n-workflow';

export const balanceTransactionsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'getAll',
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
					'balanceTransactions'
				]
			}
		}
	}
];

export const balanceTransactionsFields: INodeProperties[] = [

	// ----------------------------------
	//       coupon: getAll
	// ----------------------------------
	{
		displayName: 'Payout',
		name: 'payout',
		type: 'string',
		default: '',
		description: 'Payout Id',
        required: true,
		displayOptions: {
			show: {
				resource: [
					'balanceTransactions',
				],
				operation: [
					'getAll',
				],
			},
		},
	},
    {
		displayName: 'Starting After',
		name: 'startingAfter',
		type: 'string',
		default: '',
		description: 'Starting After last transaction',
        required: false,
		displayOptions: {
			show: {
				resource: [
					'balanceTransactions',
				],
				operation: [
					'getAll',
				],
			},
		},
	},
    {
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: '',
		description: 'Limit',
        required: false,
		displayOptions: {
			show: {
				resource: [
					'balanceTransactions',
				],
				operation: [
					'getAll',
				],
			},
		},
	}
];