import { NextResponse } from 'next/server';

const OPENSEA_COLLECTION_SLUG = process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_SLUG!;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY!;

export async function GET() {
    try {
        /* ------------------------------------------------------------
           1. Fetch best listing (lowest ask)
        ------------------------------------------------------------- */
        const listingRes = await fetch(
            `https://api.opensea.io/api/v2/listings/collection/${OPENSEA_COLLECTION_SLUG}/best`,
            {
                headers: {
                    'X-API-KEY': OPENSEA_API_KEY,
                    accept: 'application/json',
                },
                cache: 'no-store',
            }
        );

        if (!listingRes.ok) throw new Error('Failed to fetch best listing');

        const listingData = await listingRes.json();
        const bestListing = listingData?.listings?.[0];

        if (!bestListing) {
            return NextResponse.json({ error: 'No listings found' }, { status: 404 });
        }

        /* ------------------------------------------------------------
           2. Extract tokenId from listing
        ------------------------------------------------------------- */
        const offerItem = bestListing?.protocol_data?.parameters?.offer?.[0];
        const tokenId = offerItem?.identifierOrCriteria;

        if (!tokenId) {
            return NextResponse.json(
                { error: 'Unable to extract tokenId from listing' },
                { status: 400 }
            );
        }

        /* ------------------------------------------------------------
           3. Fetch best offer for this NFT (parallel if needed in future)
           Currently we must wait for tokenId from listing
        ------------------------------------------------------------- */
        const offerResPromise = fetch(
            `https://api.opensea.io/api/v2/offers/collection/${OPENSEA_COLLECTION_SLUG}/nfts/${tokenId}/best`,
            {
                headers: {
                    'X-API-KEY': OPENSEA_API_KEY,
                    accept: 'application/json',
                },
                cache: 'no-store',
            }
        );

        // Wait for both listing and offer if more things added in future
        const [offerRes] = await Promise.all([offerResPromise]);

        if (!offerRes.ok) throw new Error('Failed to fetch best offer');

        const offerData = await offerRes.json();

        console.log("price", offerData.price.value);

        /* ------------------------------------------------------------
           4. Normalize & return market data
        ------------------------------------------------------------- */
        return NextResponse.json({
            nft: {
                tokenId,
            },
            listing: {
                priceWei: bestListing.price.current.value,
                currency: bestListing.price.current.currency,
            },
            offer: offerData
                ? {
                    priceWei: offerData.price.value,
                    currency: offerData.price.currency,
                }
                : null,
        });
    } catch (err) {
        console.error('Failed to fetch OpenSea market data:', err);
        return NextResponse.json(
            { error: 'Failed to fetch OpenSea market data' },
            { status: 500 }
        );
    }
}
