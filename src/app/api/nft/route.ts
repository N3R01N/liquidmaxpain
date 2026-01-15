import { NextResponse } from 'next/server';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY!;
const ALCHEMY_NFT_URL = process.env.NEXT_PUBLIC_ALCHEMY_NFT_URL!;
const MAX_PAIN_ADDRESS = process.env.NEXT_PUBLIC_MAX_PAIN_ADDRESS!;
const LIQUID_MAX_PAIN_ADDRESS =
    process.env.NEXT_PUBLIC_LIQUID_MAX_PAIN_ADDRESS!;

async function fetchNFTs(owner: string) {
    const endpoint =
        `${ALCHEMY_NFT_URL}/${ALCHEMY_API_KEY}/getNFTsForOwner` +
        `?owner=${owner}` +
        `&contractAddresses%5B%5D=${MAX_PAIN_ADDRESS}` +
        `&withMetadata=false` +
        `&pageSize=100` +
        `&refreshCache=true`;

    console.log("Fetching NFTs from:", endpoint);

    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) throw new Error('Alchemy error');

    const data = await res.json();

    return {
        balance: data.totalCount || 0,
        ownedNfts:
            data.ownedNfts?.map((nft: any) => ({
                tokenId: nft.tokenId,
                name: `MAX PAIN #${Number(nft.tokenId) % 10 ** 4}/7394`,
            })) || [],
    };
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    try {
        const [user, liquid] = await Promise.all([
            fetchNFTs(address),
            fetchNFTs(LIQUID_MAX_PAIN_ADDRESS),
        ]);

        return NextResponse.json({
            user: user,
            contract: liquid,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'NFT fetch failed' }, { status: 500 });
    }
}
