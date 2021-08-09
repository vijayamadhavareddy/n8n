// *********************************************************************
//                           balance trasactions
// *********************************************************************

// https://stripe.com/docs/api/balance_transactions


import {
	IExecuteFunctions,
} from 'n8n-core';
import {stripeApiRequest} from "../helpers";

const getAllBalanceTransactionOfGivenPayout = (en: IExecuteFunctions, endpoint: string, i: number) => {
    const payoutId = en.getNodeParameter('payout', i);
    const customCrdentialName = en.getNodeParameter('credentialName', i);
    const startingAfter = en.getNodeParameter('startingAfter', i);
    const limit = en.getNodeParameter('limit', i);
    endpoint = `${endpoint}?payout=${payoutId}`;
    if(startingAfter && startingAfter !== '') {
        endpoint = `${endpoint}&starting_after=${startingAfter}`;
    }
    if(limit && limit !== '') {
        endpoint = `${endpoint}&limit=${limit}`;
    }
    if(customCrdentialName && customCrdentialName !== '') {
        (en as any).updateCustomCredentials('stripeApi', customCrdentialName as string);
    }
	return stripeApiRequest.call(en, 'GET', endpoint, {}, {});
}

export const balanceTransactions = {
	execute: async (executionNode: IExecuteFunctions, operation: string, itemIndex: number) => {
		const endpoint = `/balance_transactions`;
		switch (operation) {
			case 'getAll':
				return getAllBalanceTransactionOfGivenPayout(executionNode, endpoint, itemIndex);
		}
	}
}