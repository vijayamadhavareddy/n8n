import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	isEmpty,
} from 'lodash';

import {
	adjustChargeFields,
	adjustCustomerFields,
	adjustMetadata,
	handleListing,
	loadResource,
	stripeApiRequest,
} from './helpers';

import {
	balanceOperations,
	chargeFields,
	chargeOperations,
	couponFields,
	couponOperations,
	customerCardFields,
	customerCardOperations,
	customerFields,
	customerOperations,
	sourceFields,
	sourceOperations,
	tokenFields,
	tokenOperations,
	payoutOperations,
	balanceTransactionsOperations,
	balanceTransactionsFields
} from './descriptions';
import {balance} from "./operations/balanceOperations";
import {customerCard} from "./operations/customerCardOperations";
import {payout} from "./operations/payoutOperations";
import { balanceTransactions } from './operations/balanceTransactions';

export class Stripe implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Stripe',
		name: 'stripe',
		icon: 'file:stripe.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume the Stripe API',
		defaults: {
			name: 'Stripe',
			color: '#6772e5',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'stripeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Balance',
						value: 'balance',
					},
					{
						name: 'Charge',
						value: 'charge',
					},
					{
						name: 'Coupon',
						value: 'coupon',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Customer Card',
						value: 'customerCard',
					},
					{
						name: 'Source',
						value: 'source',
					},
					{
						name: 'Token',
						value: 'token',
					},
					{
						name: 'Payout',
						value: 'payout',
					},
					{
						name: 'Balance Transactions',
						value: 'balanceTransactions',
					},
				],
				default: 'balance',
				description: 'Resource to consume',
			},
			{
				displayName: 'Credential Name',
				name: 'credentialName',
				type: 'string',
				description: 'Custom Credential Name',
				default: '',
				required: false
			},
			...balanceOperations,
			...customerCardOperations,
			...customerCardFields,
			...chargeOperations,
			...chargeFields,
			...couponOperations,
			...couponFields,
			...customerOperations,
			...customerFields,
			...sourceOperations,
			...sourceFields,
			...tokenOperations,
			...tokenFields,
			...payoutOperations,
			...balanceTransactionsOperations,
			...balanceTransactionsFields
		],
	};

	methods = {
		loadOptions: {
			async getCustomers(this: ILoadOptionsFunctions) {
				return await loadResource.call(this, 'customer');
			},
			async getCurrencies(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const {data} = await stripeApiRequest.call(this, 'GET', '/country_specs', {});
				for (const currency of data[0].supported_payment_currencies) {
					returnData.push({
						name: currency.toUpperCase(),
						value: currency,
					});
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		let responseData;
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {

			try {

				switch (resource) {
					case 'balance':
						responseData = await balance.execute(this, operation)
						break;
					case 'customerCard':
						responseData = await customerCard.execute(this, operation, i);
						break;
					case 'charge':

						// *********************************************************************
						//                             charge
						// *********************************************************************

						// https://stripe.com/docs/api/charges

						if (operation === 'create') {

							// ----------------------------------
							//          charge: create
							// ----------------------------------

							const body = {
								customer: this.getNodeParameter('customerId', i),
								currency: (this.getNodeParameter('currency', i) as string).toLowerCase(),
								amount: this.getNodeParameter('amount', i),
								source: this.getNodeParameter('source', i),
							} as IDataObject;

							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

							if (!isEmpty(additionalFields)) {
								Object.assign(body, adjustChargeFields(additionalFields));
							}

							responseData = await stripeApiRequest.call(this, 'POST', '/charges', body, {});

						} else if (operation === 'get') {

							// ----------------------------------
							//           charge: get
							// ----------------------------------

							const chargeId = this.getNodeParameter('chargeId', i);
							responseData = await stripeApiRequest.call(this, 'GET', `/charges/${chargeId}`, {}, {});

						} else if (operation === 'getAll') {

							// ----------------------------------
							//          charge: getAll
							// ----------------------------------

							responseData = await handleListing.call(this, resource);

						} else if (operation === 'update') {

							// ----------------------------------
							//         charge: update
							// ----------------------------------

							const body = {} as IDataObject;

							const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

							if (isEmpty(updateFields)) {
								throw new Error(`Please enter at least one field to update for the ${resource}.`);
							}

							Object.assign(body, adjustChargeFields(updateFields));

							const chargeId = this.getNodeParameter('chargeId', i);
							responseData = await stripeApiRequest.call(this, 'POST', `/charges/${chargeId}`, body, {});

						}

						break;
					case 'coupon':

						// *********************************************************************
						//                             coupon
						// *********************************************************************

						// https://stripe.com/docs/api/coupons

						if (operation === 'create') {

							// ----------------------------------
							//          coupon: create
							// ----------------------------------

							const body = {
								duration: this.getNodeParameter('duration', i),
							} as IDataObject;

							const type = this.getNodeParameter('type', i);

							if (type === 'fixedAmount') {
								body.amount_off = this.getNodeParameter('amountOff', i);
								body.currency = this.getNodeParameter('currency', i);
							} else {
								body.percent_off = this.getNodeParameter('percentOff', i);
							}

							responseData = await stripeApiRequest.call(this, 'POST', '/coupons', body, {});

						} else if (operation === 'getAll') {

							// ----------------------------------
							//          coupon: getAll
							// ----------------------------------

							responseData = await handleListing.call(this, resource);

						}

						break;
					case 'customer':

						// *********************************************************************
						//                             customer
						// *********************************************************************

						// https://stripe.com/docs/api/customers

						if (operation === 'create') {

							// ----------------------------------
							//         customer: create
							// ----------------------------------

							const body = {
								name: this.getNodeParameter('name', i),
							} as IDataObject;

							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

							if (!isEmpty(additionalFields)) {
								Object.assign(body, adjustCustomerFields(additionalFields));
							}

							responseData = await stripeApiRequest.call(this, 'POST', '/customers', body, {});

						} else if (operation === 'delete') {

							// ----------------------------------
							//         customer: delete
							// ----------------------------------

							const customerId = this.getNodeParameter('customerId', i);
							responseData = await stripeApiRequest.call(this, 'DELETE', `/customers/${customerId}`, {}, {});

						} else if (operation === 'get') {

							// ----------------------------------
							//          customer: get
							// ----------------------------------

							const customerId = this.getNodeParameter('customerId', i);
							responseData = await stripeApiRequest.call(this, 'GET', `/customers/${customerId}`, {}, {});

						} else if (operation === 'getAll') {

							// ----------------------------------
							//        customer: getAll
							// ----------------------------------

							const qs = {} as IDataObject;
							const filters = this.getNodeParameter('filters', i) as IDataObject;

							if (!isEmpty(filters)) {
								qs.email = filters.email;
							}

							responseData = await handleListing.call(this, resource, qs);

						} else if (operation === 'update') {

							// ----------------------------------
							//        customer: update
							// ----------------------------------

							const body = {} as IDataObject;

							const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

							if (isEmpty(updateFields)) {
								throw new Error(`Please enter at least one field to update for the ${resource}.`);
							}

							Object.assign(body, adjustCustomerFields(updateFields));

							const customerId = this.getNodeParameter('customerId', i);
							responseData = await stripeApiRequest.call(this, 'POST', `/customers/${customerId}`, body, {});

						}
						break;
					case 'source':

						// *********************************************************************
						//                             source
						// *********************************************************************

						// https://stripe.com/docs/api/sources

						if (operation === 'create') {

							// ----------------------------------
							//         source: create
							// ----------------------------------

							const customerId = this.getNodeParameter('customerId', i);

							const body = {
								type: this.getNodeParameter('type', i),
								amount: this.getNodeParameter('amount', i),
								currency: this.getNodeParameter('currency', i),
							} as IDataObject;

							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

							if (!isEmpty(additionalFields)) {
								Object.assign(body, adjustMetadata(additionalFields));
							}

							responseData = await stripeApiRequest.call(this, 'POST', '/sources', body, {});

							// attach source to customer
							const endpoint = `/customers/${customerId}/sources`;
							await stripeApiRequest.call(this, 'POST', endpoint, {source: responseData.id}, {});

						} else if (operation === 'delete') {

							// ----------------------------------
							//          source: delete
							// ----------------------------------

							const sourceId = this.getNodeParameter('sourceId', i);
							const customerId = this.getNodeParameter('customerId', i);
							const endpoint = `/customers/${customerId}/sources/${sourceId}`;
							responseData = await stripeApiRequest.call(this, 'DELETE', endpoint, {}, {});

						} else if (operation === 'get') {

							// ----------------------------------
							//          source: get
							// ----------------------------------

							const sourceId = this.getNodeParameter('sourceId', i);
							responseData = await stripeApiRequest.call(this, 'GET', `/sources/${sourceId}`, {}, {});

						}

						break;
					case 'token':
						// *********************************************************************
						//                             token
						// *********************************************************************

						// https://stripe.com/docs/api/tokens

						if (operation === 'create') {

							// ----------------------------------
							//          token: create
							// ----------------------------------

							const type = this.getNodeParameter('type', i);
							const body = {} as IDataObject;

							if (type !== 'cardToken') {
								throw new Error('Only card token creation implemented.');
							}

							body.card = {
								number: this.getNodeParameter('number', i),
								exp_month: this.getNodeParameter('expirationMonth', i),
								exp_year: this.getNodeParameter('expirationYear', i),
								cvc: this.getNodeParameter('cvc', i),
							};

							responseData = await stripeApiRequest.call(this, 'POST', '/tokens', body, {});
						}
						break;
					case 'payout':
						responseData = await payout.execute(this, operation, i)
						break;
					case 'balanceTransactions':
						responseData = await balanceTransactions.execute(this, operation, i);
						break;
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({error: error.message});
					continue;
				}

				throw error;
			}

			Array.isArray(responseData)
				? returnData.push(...responseData)
				: returnData.push(responseData);
		}

		return [this.helpers.returnJsonArray(returnData)];

	}
}
