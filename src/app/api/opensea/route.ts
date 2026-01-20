import { NextResponse } from 'next/server';

const OPENSEA_COLLECTION_SLUG = process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_SLUG!;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY!;
const FULFILLER_ADDRESS = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS!;
const SEAPORT_ADDRESS = process.env.NEXT_PUBLIC_SEAPORT_ADDRESS!;

export async function GET() {
    try {
        /* ------------------------------------------------------------
           1. Fetch best listing
        ------------------------------------------------------------- */
        const listingsRes = await fetch(
            `https://api.opensea.io/api/v2/listings/collection/${OPENSEA_COLLECTION_SLUG}/best`,
            {
                headers: {
                    'X-API-KEY': OPENSEA_API_KEY,
                    accept: 'application/json',
                },
                cache: 'no-store',
            }
        );

        if (!listingsRes.ok) {
            throw new Error('Failed to fetch best listing');
        }

        const listingsData = await listingsRes.json();
        const bestListing = listingsData?.listings?.[0];

        if (!bestListing) {
            return NextResponse.json({ error: 'No listings found' }, { status: 404 });
        }

        const { order_hash, chain, price, protocol_data } = bestListing;
        const consideration = protocol_data?.parameters?.consideration?.[0];

        if (!order_hash || !chain || !price || !consideration) {
            return NextResponse.json(
                { error: 'Incomplete listing data' },
                { status: 400 }
            );
        }

        /* ------------------------------------------------------------
           2. Fetch fulfillment data
        ------------------------------------------------------------- */
        const fulfillmentRes = await fetch(
            'https://api.opensea.io/api/v2/listings/fulfillment_data',
            {
                method: 'POST',
                headers: {
                    'X-API-KEY': OPENSEA_API_KEY,
                    accept: 'application/json',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    listing: {
                        hash: order_hash,
                        chain,
                        protocol_address: SEAPORT_ADDRESS,
                    },
                    fulfiller: {
                        address: FULFILLER_ADDRESS,
                    },
                    consideration: {
                        asset_contract_address: consideration.token,
                        token_id: consideration.identifierOrCriteria,
                    },
                    include_optional_creator_fees: false,
                }),
            }
        );

        if (!fulfillmentRes.ok) {
            const errText = await fulfillmentRes.text();
            throw new Error(`Fulfillment fetch failed: ${errText}`);
        }

        const fulfillmentData = await fulfillmentRes.json();
        const inputData =
            fulfillmentData?.fulfillment_data?.transaction?.input_data;

        if (!inputData) {
            throw new Error('Missing fulfillment input_data');
        }

        /* ------------------------------------------------------------
           3. Payload-based order detection
        ------------------------------------------------------------- */
        const hasBasic = !!inputData.parameters;
        const hasAdvanced = !!inputData.advancedOrder;

        if (hasBasic === hasAdvanced) {
            throw new Error(
                'Ambiguous fulfillment payload: cannot determine order type'
            );
        }

        /* ------------------------------------------------------------
           4. Return discriminated execution payload
        ------------------------------------------------------------- */
        if (hasBasic) {
            return NextResponse.json({
                type: 'basic',
                chain,
                value: price.current.value,
                basicOrderParameters: inputData.parameters,
            });
        }

        // advanced
        return NextResponse.json({
            type: 'advanced',
            chain,
            value: price.current.value,
            advancedOrder: inputData.advancedOrder,
            criteriaResolvers: inputData.criteriaResolvers ?? [],
            fulfillerConduitKey: inputData.fulfillerConduitKey,
        });
    } catch (err) {
        console.error('OpenSea pipeline failed:', err);
        return NextResponse.json(
            { error: 'Failed to fetch OpenSea fulfillment data' },
            { status: 500 }
        );
    }
}
