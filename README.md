To deploy contracts on local testnet:
1. First we download the dependecies
```bash
forge install
```
2. Run a local instance of anvil
```bash
anvil
```
3. Then deploy the contracts on anvil
```bash
forge script script/DeployMock.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```
4. Then *from the w3f repository* just call the web3 function on the `--network anvil`

