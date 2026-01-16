import { NextResponse } from 'next/server';

const OPENSEA_COLLECTION_SLUG = 'max-pain-and-frens-by-xcopy';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY!;

// ⚠️ Must be the address that will actually call Seaport on-chain for testing liquidmaxpain.brn.eth
const FULFILLER_ADDRESS = process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ARBITRAGE_ADDRESS!;

// Seaport v1.5 (Ethereum mainnet)
const SEAPORT_ADDRESS = process.env.NEXT_PUBLIC_SEAPORT_ADDRESS!;

export async function GET() {
    try {
        /* ------------------------------------------------------------
           1. Fetch best listing from collection
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

        const price = bestListing.price?.current?.value;
        const orderHash = bestListing.order_hash;

        const protocolParams = bestListing?.protocol_data?.parameters;
        const considerationreq = protocolParams?.consideration?.[0];

        if (!price || !orderHash || !considerationreq) {
            return NextResponse.json(
                { error: 'Incomplete listing data from OpenSea' },
                { status: 400 }
            );
        }

        /* ------------------------------------------------------------
           2. Call fulfillment_data endpoint
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
                        hash: orderHash,
                        chain: 'ethereum',
                        protocol_address: SEAPORT_ADDRESS,
                    },
                    fulfiller: {
                        address: FULFILLER_ADDRESS,
                    },
                    consideration: {
                        asset_contract_address: considerationreq.token,
                        token_id: considerationreq.identifierOrCriteria,
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
        const inputData = fulfillmentData?.fulfillment_data?.transaction?.input_data;
        /* ------------------------------------------------------------
           3. Return combined response to frontend
        ------------------------------------------------------------- */
        return NextResponse.json({
            price: Number(price),
            advanceOrder: inputData.advancedOrder,
            criteriaResolvers: inputData.criteriaResolvers,
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