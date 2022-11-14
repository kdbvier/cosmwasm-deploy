const { calculateFee, GasPrice } = require("@cosmjs/stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const {
  SigningCosmWasmClient,
  CosmWasmClient,
} = require("@cosmjs/cosmwasm-stargate");

const _ = require("fs");
const moment = require("moment");
const btoa = require("btoa");

// const rpcEndpoint = "https://rpc.cliffnet.cosmwasm.com:443";
const rpcEndpoint = "https://rpc-juno.itastakers.com:443";
// const rpcEndpoint = "https://rpc.uni.juno.deuslabs.fi:443";

// Example user from scripts/wasmd/README.md
const admin = {
  mnemonic: "",
  address: "",
};

const uploadContract = async () => {
  const wasmPath = "./nftstaking.wasm";
  const gasPrice = GasPrice.fromString("0.05ujuno");

  console.info("uploading contract");

  // Upload contract
  const adminWallet = await DirectSecp256k1HdWallet.fromMnemonic(
    admin.mnemonic,
    { prefix: "juno" }
  );
  const adminClient = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    adminWallet
  );
  const wasm = await _.readFileSync(wasmPath);
  const uploadFee = await calculateFee(8_000_0000, gasPrice);
  const uploadContract = await adminClient.upload(
    admin.address,
    wasm,
    uploadFee,
    "Upload marketplace contract"
  );
  console.log("Upload succeeded. Receipt:", uploadContract);
  return uploadContract.codeId;
};

const InstantiateContract = async (codeId) => {
  const adminWallet = await DirectSecp256k1HdWallet.fromMnemonic(
    admin.mnemonic,
    { prefix: "juno" }
  );
  const adminClient = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    adminWallet
  );
  const gasPrice = GasPrice.fromString("0.05ujuno");
  const instantiateFee = calculateFee(500_000, gasPrice);
  const msg = {
    collection_address:
      "juno16hjg4c5saxqqa3cwfx7aw9vzapqna7fn2xprttge888lw0zlw5us87nv8x",
    cw20_address:
      "juno1y9rf7ql6ffwkv02hsgd4yruz23pn4w97p75e2slsnkm0mnamhzysvqnxaq",
    daily_reward: "1000",
    interval: 600,
    lock_time: 3600,
  };

  const transaction = await adminClient.instantiate(
    admin.address,
    codeId,
    msg,
    "Staking Contract",
    instantiateFee,
    { memo: "Create an staking instance" }
  );
  console.info(transaction.logs[0].events, transaction.contractAddress);
  transaction.logs[0].events.forEach((element) => {
    console.log(element.type, element.attributes);
  });
  return transaction.contractAddress;
};

async function main() {
  /*------------------- Deploy a contract ----------------------------------------*/
  const codeId = await uploadContract();

  // // // Instatiate the contract
  const contractAddr = await InstantiateContract(codeId);
  console.log("contract address: ", contractAddr);
}

main();
