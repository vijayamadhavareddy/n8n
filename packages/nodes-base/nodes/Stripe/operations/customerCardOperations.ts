// *********************************************************************
//                           customer card
// *********************************************************************

// https://stripe.com/docs/api/cards
import {IDataObject} from "n8n-workflow";
import {stripeApiRequest} from "../helpers";

// ----------------------------------
//         customerCard: add
// ----------------------------------

const addCard = async (en: any, i: number, endpoint: string) => {
	const body = {
		source: en.getNodeParameter('token', i),
	} as IDataObject;
	return stripeApiRequest.call(en, 'POST', endpoint, body, {});
}

// ----------------------------------
//       customerCard: remove
// ----------------------------------

const removeCard = async (en: any, i: number, endpoint: string) => {
	const cardId = en.getNodeParameter('cardId', i);
	endpoint = `${endpoint}/${cardId}`;
	return stripeApiRequest.call(en, 'DELETE', endpoint, {}, {});
}

// ----------------------------------
//        customerCard: get
// ----------------------------------

const getCard = async (en: any, i: number, endpoint: string) => {
	const sourceId = en.getNodeParameter('sourceId', i);
	endpoint = `${endpoint}/${sourceId}`;
	return stripeApiRequest.call(en, 'GET', endpoint, {}, {});
}

export const customerCard = {
	execute: async (executionNode: any, operation: string, itemIndex: number) => {
		const customerId = executionNode.getNodeParameter('customerId', itemIndex);
		const endpoint = `/customers/${customerId}/sources`;
		switch (operation) {
			case 'add':
				return addCard(executionNode, itemIndex, endpoint);
			case 'remove':
				return removeCard(executionNode, itemIndex, endpoint);
			case 'get':
				return getCard(executionNode, itemIndex, endpoint)
		}
	}
}

