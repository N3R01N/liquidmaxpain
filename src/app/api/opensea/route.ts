import { NextResponse } from 'next/server';

const OPENSEA_COLLECTION_SLUG = 'max-pain-and-frens-by-xcopy';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY!;

// ⚠️ Must be the address that will actually call Seaport on-chain for testing liquidmaxpain.brn.eth
const FULFILLER_ADDRESS = '0x6f2844f39ee8a109f73373b18027db8c4a278f06';

// Seaport v1.5 (Ethereum mainnet)
const SEAPORT_ADDRESS = '0x0000000000000068f116a894984e2db1123eb395';

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
        const consideration = inputData.advancedOrder.parameters.consideration[0];
        /*
                const orderData = {
                    considerationToken: consideration.token,
                    considerationIdentifier: consideration.identifierOrCriteria,
                    considerationAmount: consideration.startAmount,
                    offerer: inputData.advancedOrder.parameters.offerer,
                    zone: inputData.advancedOrder.parameters.zone,
                    offerToken: consideration.token,
                    offerIdentifier:
                        offerAmount:
                    basicOrderType:
                        startTime:
                    endTime:
                        zoneHash:
                    salt:
                        offererConduitKey:
                    fulfillerConduitKey:
                        totalOriginalAdditionalRecipients:
                    additionalRecipients:
                        signature:
                }
        */
        /* ------------------------------------------------------------
           3. Return combined response to frontend
        ------------------------------------------------------------- */
        return NextResponse.json({
            price: Number(price),
            orderHash,
            inputData: fulfillmentData.fulfillment_data.transaction.input_data,
        });
    } catch (err) {
        console.error('OpenSea pipeline failed:', err);
        return NextResponse.json(
            { error: 'Failed to fetch OpenSea fulfillment data' },
            { status: 500 }
        );
    }
}

