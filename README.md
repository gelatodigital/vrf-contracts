# Gelato VRF

Gelato VRF is a project that combines [Drand](drand.love) with Gelato Web3 Functions to obtain a randomness providing oracle for EVM-compatible blockchains. 

## Implementation Overview
In this repository you can find a Gelato Web3 Function that acts as the oracle for the smart contracts requesting randomness on-chain. The W3F is designed to listen for the `RequestedRandomness` event and fullfill it accordingly.

### Contracts
In the repositories the smart contracts are designed to cover two main use-cases:

1. Gelato VRF is offered through the `Inbox.sol` contracts that collects requests that are then dispatched by the W3F.
2. Handle CL VRF compliant requests through the `VRFCoordinatorV2Adapter.sol` contract that are treated like a normal request with additional data that is then used on the smart contract level.

The same W3F script powers both use cases. Only the smart contracts are different.

Some small differences lie in the setup required to make the VRF work depending on which use-case is being targeted.

1. For the Gelato VRF to work, the `Inbox.sol` contract needs to be deployed on the targeted chain. Ideally once someone from Gelato deploys the inbox the chain will be fully supported (assuming full EVM-compatibility).

2. For the Chainlink Compatible VRF the `VRFCoordinatorV2Adapter.sol` contract has to be deployed. Each user has to deploy its own instance of the adapter. This can be easily achieved through the `VRFCoordinatorV2AdapterFactory.sol` factory contract.

## Web3 Function Details

Similar to any other W3F, this VRF also leverages some special parameters

### User arguments
- `allowedSenders: string[]` is the array of addresses that are allowed to spend the user's balance when requesting a random number. Since the access to the VRF is not gated on-chain anyone is able to call it. This allows both EOAs and SC to request on-chain randomness and trigger callbacks.
- `inbox: string`: This parameter varies depending on the use-case picked by the user:
    - For the Gelato VRF this is the address of the inbox that the VRF will listen to. This parameter **SHOULD NOT** be customized by the user (and it is infact added by the frontend once the network is chosen).
    - For the CL compatible VRF this is the address of the user-deployed adapter. This parameter is returned by the factory once it deploys an adapter.

### Storage

Since event-driven W3Fs are not available at the time of development, each VRF tracks events independently as shown in [this example](https://github.com/gelatodigital/web3-functions-template/tree/3c1e859c8fe2e3dd4ba79525138adc667a23482f/web3-functions/event-listener) by keeping the latest checked block in the storage. This behavior will most likely change for a leaner approach once the events can be used as a trigger for automation. 

## Development Setup

1. Install project dependencies

```bash
yarn install
```

2. Configure your local environment:

- Copy `.env.example` to init your own `.env` file

```bash
cp .env.example .env
```

3. Complete your `.env` file with your private settings
