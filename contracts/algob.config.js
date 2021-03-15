// NOTE: below we provide some example accounts.
// DON'T this account in any working environment because everyone can check it and use
// the private keys (this accounts are visible to everyone).

// NOTE: to be able to execute transactions, you need to use an active account with
// a sufficient ALGO balance.

/**
   Check our /docs/algob-config.md documentation (https://github.com/scale-it/algorand-builder/blob/master/docs/algob-config.md) for more configuration options and ways how to
  load a private keys:
  + using mnemonic
  + using binary secret key
  + using KMD daemon
  + loading from a file
  + loading from an environment variable
  + ...
*/

// ## ACCOUNTS USING mnemonic ##
const { mkAccounts, algodCredentialsFromEnv } = require("@algorand-builder/algob");
let accounts = mkAccounts([{
  // This account is created using `make setup-master-account` command from our
  // `/infrastructure` directory. It already has many ALGOs
  name: "master",
  addr: "DXWPYQDURUNRP3CLC7NDEQXEYLZCC5EQ6YWFJ5Q5IKLB5FA35ADB4326TE",
  mnemonic: "adult parent couple era recipe used quarter glance spray convince calm debate settle budget shoulder sheriff segment room divert art boss actor fat able chat"
}]);

// ## ACCOUNTS loaded from a FILE ##
// const { loadAccountsFromFileSync } = require("@algorand-builder/algob");
// const accFromFile = loadAccountsFromFileSync("assets/accounts_generated.yaml");
// accounts = accounts.concat(accFromFile);



/// ## Enabling KMD access
/// Please check https://github.com/scale-it/algorand-builder/blob/master/docs/algob-config.md#credentials for more details and more methods.

// process.env.$KMD_DATA = "/path_to/KMD_DATA";
// let kmdCred = KMDCredentialsFromEnv();



// ## Algod Credentials
// You can set the credentials directly in this file:

let defaultCfg = {
  host: "http://127.0.0.1",
  port: 8777,
  // Below is a token created through our script in `/infrastructure`
  // If you use other setup, update it accordignly (eg content of algorand-node-data/algod.token)
  token: "a136e80ac4e1f54add873633eb786f740f19ba839c6c5a59ee6a36744d191583",
  accounts: accounts,
  // if you want to load accounts from KMD, you need to add the kmdCfg object. Please read
  // algob-config.md documentation for details.
  // kmdCfg: kmdCfg,
};

// You can also use Environment variables to get Algod credentials
// Please check https://github.com/scale-it/algorand-builder/blob/master/docs/algob-config.md#credentials for more details and more methods.
// Method 1
process.env.ALGOD_ADDR = "127.0.0.1:8080";
process.env.ALGOD_TOKEN = "algod_token";
let algodCred = algodCredentialsFromEnv();


let envCfg = {
 host: algodCred.host,
 port: algodCred.port,
 token: algodCred.token,
 accounts: accounts
}


module.exports = {
  networks: {
    default: defaultCfg,
    prod: envCfg
  }
};
