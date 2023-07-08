To deploy contracts on local testnet:
1. First download the dependecies
```bash
forge install
```
2. Run a local instance of anvil
```bash
anvil
```
3. Add the first private key given by anvil to `.env` as `ANVIL_KEY`
4. Then deploy the contracts on anvil
```bash
forge script script/DeployMock.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```
5. Then *from the w3f repository* just call the web3 function on the `--network anvil`

