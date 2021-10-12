import React, { Dispatch, SetStateAction, useState, useEffect } from "react";
import { TezosToolkit  , MichelsonMap} from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { Fa2MultiNftAssetMultiAdminCode } from '@tqtezos/minter-contracts';
import {
  NetworkType,
  BeaconEvent,
  defaultEventCallbacks
} from "@airgap/beacon-sdk";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import { LedgerSigner } from "@taquito/ledger-signer";

type ButtonProps = {
  Tezos: TezosToolkit;
  setContract: Dispatch<SetStateAction<any>>;
  setWallet: Dispatch<SetStateAction<any>>;
  setUserAddress: Dispatch<SetStateAction<string>>;
  setContractAddress: Dispatch<SetStateAction<string>>;
  setUserBalance: Dispatch<SetStateAction<number>>;
  setStorage: Dispatch<SetStateAction<number>>;
  contractAddress: string;
  setBeaconConnection: Dispatch<SetStateAction<boolean>>;
  setPublicToken: Dispatch<SetStateAction<string | null>>;
  wallet: BeaconWallet;
};

const ConnectButton = ({
  Tezos,
  setContract,
  setWallet,
  setUserAddress,
  setContractAddress,
  setUserBalance,
  setStorage,
  contractAddress,
  setBeaconConnection,
  setPublicToken,
  wallet
}: ButtonProps): JSX.Element => {

  const setup = async (contractAddress: string,userAddress: string): Promise<void> => {
    setContractAddress(contractAddress);
    setUserAddress(userAddress);
    
    // updates balance
    const balance = await Tezos.tz.getBalance(userAddress);
    setUserBalance(balance.toNumber());
    // // creates contract instance
    // const contract = await Tezos.wallet.at(contractAddress);
    // const storage: any = await contract.storage();
    // setContract(contract);
    // setStorage(storage.toNumber());
  };

  function toHexString(input: string) {
    return Buffer.from(input).toString('hex');
  }

  const deployContract = async (): Promise<void> => {
    var contractAddress="";
    try {
      await wallet.requestPermissions({
        network: {
          type: NetworkType.GRANADANET,
          rpcUrl: "https://api.tez.ie/rpc/granadanet"
        }
      });
      // gets user's address
      const userAddress = await wallet.getPKH();
      console.log("User Address: "+userAddress)
 
      try {
         const genericMultisigJSONfile = Fa2MultiNftAssetMultiAdminCode.code;
         const metadata = new MichelsonMap<string, string>();
        
         const contents = {
           name: 'AqibTezosMinter',
           description: 'An OpenMinter base collection contract.',
           interfaces: ['TZIP-012', 'TZIP-016', 'TZIP-020'],
           tokenCategory: 'collectibles'
         };
         metadata.set('', toHexString('tezos-storage:contents'));
         metadata.set('contents', toHexString(JSON.stringify(contents)));
         Tezos.wallet
           .originate({
             code: genericMultisigJSONfile,
             storage: {
               assets: {
                 ledger: new MichelsonMap(),
                 next_token_id: 0,
                 operators: new MichelsonMap(),
                 token_metadata: new MichelsonMap()
               },
               admin: {
                 admins: [userAddress],
                 pending_admins: new MichelsonMap(),
                 paused: false
               },
               metadata: metadata
             },
           })
           .send()
           .then((originationOp) => {
             console.log(`Waiting for confirmation of origination...`);
             return originationOp.contract();
           })
           .then((contract) => {
             contractAddress=contract.address;
             console.log(`Origination completed for ${contract.address}.`);
             setup(contractAddress,userAddress);
             // setBeaconConnection(true);
           })
         
         } catch (error) {
           console.log(error);
         
       };
      console.log("the End")
     

    } catch (error) {
      console.log(error);
    }
  };



  useEffect(() => {
    (async () => {
      // creates a wallet instance
      const wallet = new BeaconWallet({
        name: "Taquito Boilerplate",
        preferredNetwork: NetworkType.GRANADANET,
        disableDefaultEvents: true, // Disable all events / UI. This also disables the pairing alert.
        eventHandlers: {
          // To keep the pairing alert, we have to add the following default event handlers back
          [BeaconEvent.PAIR_INIT]: {
            handler: defaultEventCallbacks.PAIR_INIT
          },
          [BeaconEvent.PAIR_SUCCESS]: {
            handler: data => setPublicToken(data.publicKey)
          }
        }
      });
      Tezos.setWalletProvider(wallet);
      setWallet(wallet);
      // checks if wallet was connected before
      // const activeAccount = await wallet.client.getActiveAccount();
      // if (activeAccount) {
      //   const userAddress = await wallet.getPKH();
      //   await setup(userAddress);
      //   setBeaconConnection(true);
      // }
    })();
  }, []);

  return (
    <div className="buttons">
  
      <button className="button" onClick={deployContract}>
        <span>
          <i className="fas fa-paper-plane"></i>&nbsp; Deploy Contract
        </span>
      </button>
  
    </div>
  );
};

export default ConnectButton;
