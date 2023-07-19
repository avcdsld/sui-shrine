import Head from 'next/head';
import Image from 'next/image';
import logo from '../public/logo.png';
import { useEffect, useState } from 'react';
import { JsonRpcProvider, TransactionBlock } from '@mysten/sui.js';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';
import styles from '../styles/Home.module.css';

export default function Home() {
  const provider = new JsonRpcProvider();
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();
  const [prayTxHash, setPrayTxHash] = useState('');
  const [prayUSDCTxHash, setPrayUSDCTxHash] = useState('');
  const [receiveAmuletTxHash, setReceiveAmuletTxHash] = useState('');

  const NETWORK = 'devnet';
  const suiShrinePackageID = '0xea944c6ccae373fde0bc515c7df359829ee1bf0b9923a74b26284d338b2a8077';
  const priestID = '0x0815e6e78365d86688d0e26c9c3d5238fbb72d6e9bc65aabd137aee6f6f0b3a6';
  const offeringBoxSUIID = '0xec39d7bc400722bb2918106ad639310ed0ea67ce7c0d75376e5016e0aae567c8';
  const offeringBoxUSDCID = '0xec39d7bc400722bb2918106ad639310ed0ea67ce7c0d75376e5016e0aae567c8';

  const fetchObjects = async () => {
    if (account?.address == null) {
      return;
    }
    // const structType = `${suiShrinePackageID}::sui_shrine::SakutaroPoem`;
    // const objects = await provider.getOwnedObjects({
    //   owner: account?.address,
    //   filter: {
    //     StructType: structType
    //   },
    //   options: {
    //     showType: true,
    //     showContent: true,
    //     showDisplay: true,
    //   }
    // })
    // console.log(objects);
  }

  const pray = async () => {
    try {
      const amount = 100000000; // 0.1 SUI
      const tx = new TransactionBlock();
      const offeringSUI = tx.splitCoins(tx.gas, [tx.pure(amount)])
      tx.moveCall({
        target: `${suiShrinePackageID}::sui_shrine::pray`,
        typeArguments: [
          '0x2::sui::SUI',
        ],
        arguments: [
          tx.pure(priestID),
          tx.pure(offeringBoxSUIID),
          offeringSUI,
          tx.pure("global peace"),
        ]
      });

      const resData = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      console.log('success', resData);
      if (resData && resData.digest && resData.digest) {
        const module = "sui_shrine";
        // const url = `https://explorer.sui.io/txblock/${resData.digest}?module=${module}&network=${NETWORK}`;
        const url = `https://suiscan.xyz/${NETWORK}/tx/${resData.digest}`
        console.log(url);
        setPrayTxHash(resData.digest);
      }
    } catch (e) {
      console.error('failed', e);
    }
  }

  const prayUSDC = async () => {
    try {
      const amount = 100000000; // 0.1 USDC
      const tx = new TransactionBlock();
      const coinObjectId = '0x2a10fa1c744f79fb75bb855b31f557ef78db7a0e294db327ab392f3c8ff5144c';
      const coinInput = tx.object(coinObjectId);
      const offeringUSDC = tx.splitCoins(coinInput, [tx.pure(amount)])
      tx.moveCall({
        target: `${suiShrinePackageID}::sui_shrine::pray`,
        typeArguments: [
          '0x2a10fa1c744f79fb75bb855b31f557ef78db7a0e294db327ab392f3c8ff5144c::usdc::USDC',
        ],
        arguments: [
          tx.pure(priestID),
          tx.pure(offeringBoxUSDCID),
          offeringUSDC,
          tx.pure("global peace"),
        ]
      });

      const resData = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      console.log('success', resData);
      if (resData && resData.digest && resData.digest) {
        const module = "sui_shrine";
        // const url = `https://explorer.sui.io/txblock/${resData.digest}?module=${module}&network=${NETWORK}`;
        const url = `https://suiscan.xyz/${NETWORK}/tx/${resData.digest}`
        console.log(url);
        setPrayUSDCTxHash(resData.digest);
      }
    } catch (e) {
      console.error('failed', e);
    }
  }

  const receiveAmulet = async () => {
    try {
      const amount = 100000000; // 0.1 SUI
      const tx = new TransactionBlock();
      const offeringSUI = tx.splitCoins(tx.gas, [tx.pure(amount)])
      tx.moveCall({
        target: `${suiShrinePackageID}::sui_shrine::receive_amulet`,
        typeArguments: [
          '0x2::sui::SUI',
        ],
        arguments: [
          tx.pure(offeringBoxSUIID),
          offeringSUI,
        ]
      });

      const resData = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      console.log('success', resData);
      if (resData && resData.digest && resData.digest) {
        const module = "sui_shrine";
        // const url = `https://explorer.sui.io/txblock/${resData.digest}?module=${module}&network=${NETWORK}`;
        const url = `https://suiscan.xyz/${NETWORK}/tx/${resData.digest}`
        console.log(url);
        setReceiveAmuletTxHash(resData.digest);
      }
    } catch (e) {
      console.error('failed', e);
    }
  }

  useEffect(() => {
    (async () => {
      if (connected) {
        // fetchObjects();
      }
    })()
  }, [connected]);

  return (
    <div className={styles.container}>
      <Head>
        <title>SUI SHRINE</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>
          SUI SHRINE
        </h1>

        <div className="flex justify-center items-center min-h-screen">
          <Image src={logo} alt="Sui Shrine" width={200} />
        </div>

        <div style={{ marginTop: 28 }}>
          <ConnectButton />
        </div>

        {connected && <div className={styles.buttons}>
          <div style={{ marginTop: 72 }}>
            <button onClick={pray}>⛩️ Pray with 0.1 SUI &nbsp;</button>
          </div>
          {prayTxHash && <div className={styles.buttonLink}>
            <a href={`https://suiscan.xyz/${NETWORK}/tx/${prayTxHash}`} target='_blank'>View Tx Detail ↗︎</a>
          </div>}

          <div style={{ marginTop: 24 }}>
            <button onClick={prayUSDC}>⛩️ Pray with 0.1 USDC</button>
          </div>
          {prayUSDCTxHash && <div className={styles.buttonLink}>
            <a href={`https://suiscan.xyz/${NETWORK}/tx/${prayUSDCTxHash}`} target='_blank'>View Tx Detail ↗︎</a>
          </div>}

          <div style={{ marginTop: 24 }}>
            <button onClick={receiveAmulet}>🔖 Receive Amulet with 0.1 SUI</button>
          </div>
          {receiveAmuletTxHash && <div className={styles.buttonLink}>
            <a href={`https://suiscan.xyz/${NETWORK}/tx/${receiveAmuletTxHash}`} target='_blank'>View Tx Detail ↗︎</a>
          </div>}

          <div style={{ marginTop: 24 }}>
            <button onClick={() => { alert('Coming Soon') }}>🔥 Burn Amulet</button>
          </div>
        </div>}
      </main >

      <footer>
        Created by Ara @arandoros
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          color: black;
          width: 100%;
          height: 100px;
          border-top: 0.5px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div >
  )
}
