import {
    HttpChainClient,
    HttpCachingChain,
    G2ChainedBeacon,
    ChainInfo,
    isChainedBeacon,
    isUnchainedBeacon,
    RandomnessBeacon,
    G2UnchainedBeacon,
    isG1G2SwappedBeacon,
    G1UnchainedBeacon,
} from "drand-client"

import { Buffer } from "buffer/index.js" // this is necessary in Deno

import * as bls from '@noble/bls12-381'
import { PointG1, PointG2, Fp12, pairing } from '@noble/bls12-381'

export { HttpChainClient, HttpCachingChain }

// All code below comes from drand-client

export async function fetchBeacon(client: HttpChainClient): Promise<RandomnessBeacon> {
    const beacon = await client.latest()
    return validatedBeacon(client, beacon)
}

// drand-client/lib/beacon-verification.ts
async function validatedBeacon(client: HttpChainClient, beacon: RandomnessBeacon): Promise<RandomnessBeacon> {
    if (client.options.disableBeaconVerification) {
        return beacon
    }
    const info = await client.chain().info()
    if (!await verifyBeacon(info, beacon)) {
        throw Error('The beacon retrieved was not valid!')
    }

    return beacon
}

async function verifyBeacon(chainInfo: ChainInfo, beacon: RandomnessBeacon): Promise<boolean> {
    const publicKey = chainInfo.public_key

    if (!await randomnessIsValid(beacon)) {
        return false
    }

    if (isChainedBeacon(beacon, chainInfo)) {
        return bls.verify(beacon.signature, await chainedBeaconMessage(beacon), publicKey)
    }

    if (isUnchainedBeacon(beacon, chainInfo)) {
        return bls.verify(beacon.signature, await unchainedBeaconMessage(beacon), publicKey)
    }

    if (isG1G2SwappedBeacon(beacon, chainInfo)) {
        return verifySigOnG1(beacon.signature, await unchainedBeaconMessage(beacon), publicKey)
    }

    console.error(`Beacon type ${chainInfo.schemeID} was not supported`)
    return false

}

// @noble/bls12-381 does everything on G2, so we've implemented a manual verification for beacons on G1
type G1Hex = Uint8Array | string | PointG1;
type G2Hex = Uint8Array | string | PointG2;

function normP1(point: G1Hex): PointG1 {
    return point instanceof PointG1 ? point : PointG1.fromHex(point);
}

function normP2(point: G2Hex): PointG2 {
    return point instanceof PointG2 ? point : PointG2.fromHex(point);
}

async function normP1Hash(point: G1Hex): Promise<PointG1> {
    return point instanceof PointG1 ? point : PointG1.hashToCurve(point);
}

export async function verifySigOnG1(signature: G1Hex, message: G1Hex, publicKey: G2Hex): Promise<boolean> {
    const P = normP2(publicKey);
    const Hm = await normP1Hash(message);
    const G = PointG2.BASE;
    const S = normP1(signature);
    const ePHm = pairing(Hm, P.negate(), false);
    const eGS = pairing(S, G, false);
    const exp = eGS.multiply(ePHm).finalExponentiate();
    return exp.equals(Fp12.ONE);
}

async function chainedBeaconMessage(beacon: G2ChainedBeacon): Promise<Uint8Array> {
    const message = Buffer.concat([
        signatureBuffer(beacon.previous_signature),
        roundBuffer(beacon.round)
    ])

    return bls.utils.sha256(message)
}

async function unchainedBeaconMessage(beacon: G2UnchainedBeacon | G1UnchainedBeacon): Promise<Uint8Array> {
    return bls.utils.sha256(roundBuffer(beacon.round))
}

function signatureBuffer(sig: string) {
    return Buffer.from(sig, 'hex')
}

function roundBuffer(round: number) {
    // It seems like Buffer.writeBigUint64BE is not available
    const arr = new Uint8Array(8)
    for (let i = 0; i < 8; i++) {
	    arr[7-i] = Number(BigInt.asIntN(8, BigInt(round) >> BigInt(8*i)))
    }
    console.log(arr)
    return Buffer.from(arr)
}

async function randomnessIsValid(beacon: RandomnessBeacon): Promise<boolean> {
    const expectedRandomness = await bls.utils.sha256(Buffer.from(beacon.signature, 'hex'))
    return Buffer.from(beacon.randomness, 'hex').compare(expectedRandomness) == 0
}

