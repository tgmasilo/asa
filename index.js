const algosdk = require("algosdk");

const token = "";
const server = "http://localhost";
const port = 4001;

const acc1 = algosdk.generateAccount().addr;
const acc2 = algosdk.generateAccount().addr;
const acc3 = algosdk.generateAccount().addr;

console.log(`Account 1 is ${acc1}`);
console.log(`Account 2 is ${acc2}`);
console.log(`Account 3 is ${acc3}`);

let algodclient = new algosdk.Algodv2(token, server, port);

const waitForComfirmation = async function (algodclient, txId) {
  let res = await algodclient.status().do();
  let lastround = res["last-round"];
  while (true) {
    const pendingInfo = await algodclient
      .pendingTransactionInformation(txId)
      .do();
    if (
      pendingInfo["confirmed-round"] !== null &&
      pendingInfo["confirmed-round"] > 0
    ) {
      console.log(
        `Transaction ${txId} confirmed in round ${pendingInfo["confirmed-round"]}`
      );
      break;
    }
    lastround++;
    await algodclient.statusAfterBlock().do();
  }
};

const printCreatedAsset = async function (client, account, assetid) {
  let accInfo = await client.accountAssetInformation(account).do();
  for (let i = 0; i < accInfo["created-assets"].length; i++) {
    let asset = accInfo["created-asstes"][i];
    if (asset[i] == assetid) {
      console.log(`AssetID = ${asset[i]}`);
      let myparams = JSON.stringify(asset["params"], undefined, 2);
      console.log(`params = ${myparams}`);
      break;
    }
  }
}

(async () => {
  let params = await algodclient.getTransactionParams().do();
  params.fee = 100;
  params.flatFee = true;
  console.log(params);
  let data = algosdk.encodeObj("showing prefix");
  let addr = acc1;
  let defaultFrozen = false;
  let decimals = 0;
  let totalBalance = 10000;
  let symbol = "KOTA";
  let assetName = "kotas";
  let manager = acc2;
  let reserve = acc2;
  let freeze = acc2;
  let clawback = acc2;

  let tx = algosdk.makeAssetCreateTxnWithSuggestedParams(
    addr,
    data,
    totalBalance,
    decimals,
    defaultFrozen,
    manager,
    reserve,
    freeze,
    clawback,
    symbol,
    assetName
  );

  let rawSignedTx = tx.signTxn(acc1);

  let txn = await algodclient.sendRawTransaction(rawSignedTx).do();
  console.log(`Asset Creation Transaction ${txn.txId}`);

  await waitForComfirmation(algodclient, txn.txId);
  let ptx = await algodclient.pendingTransactionInformation(txn.txId);
  let assetID = ptx["asset-index"];

  await printCreatedAsset(algodclient, acc1, assetID);
});
