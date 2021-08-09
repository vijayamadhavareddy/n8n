// *********************************************************************
//                             balance
// *********************************************************************

// https://stripe.com/docs/api/balance

import {stripeApiRequest} from "../helpers";

export const balance = {
	execute: async (executionNode: any, operation: string) => {
		if (operation === 'get') {
			return stripeApiRequest.call(executionNode, 'GET', '/balance', {}, {});
		}
	}
}
