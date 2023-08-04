# Gelato VRF

Gelato VRF is a project that combines [Drand](drand.love) with Gelato Web3 Functions to obtain a randomness providing oracle for EVM-compatible blockchains. 

## Implementation Overview
In this repository you can find two separate (but very similar) web3 functions:

-  A Vanilla Gelato VRF W3F, optimisied to work in a cheap and fast way without additional overhead.
- A Chainlink Compatible VRF that mocks chainlink backend to allow people to easily migrate contracts that were previously deployed for CL VRF.

For the Vanilla VRF to work the `Inbox.sol` contract needs to be deployed on the chain. Just a single instance will let any VRF listen to it and executes callbacks accordingly.

For the Chainlink Compatible VRF the `ADPATER TODO REPLACE.sol` contract has to be deployed. Unfortunately due to the design of the adapter each independent VRF needs to deploy its own instance of the adapter. This can be easily achieved through the `FACTORY TODO REPLACE.sol`.

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

# Web3 Function Details

### User arguments
### Storage
## One VRF per user

