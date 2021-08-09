// *********************************************************************
//                           payouts
// *********************************************************************

// https://stripe.com/docs/api/payouts


import {stripeApiRequest} from "../helpers";

const getAllPayouts = (en: any, endpoint: string) => {
	return stripeApiRequest.call(en, 'GET', endpoint, {}, {});
}

export const payout = {
	execute: async (executionNode: any, operation: string, itemIndex: number) => {
		const endpoint = `/payouts`;
		switch (operation) {
			case 'getAll':
				return getAllPayouts(executionNode, endpoint);
		}
	}
}
