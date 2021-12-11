import ReactDOM from 'react-dom';
// import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { setupAppContext } from "./appcontext"
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';

export const NetworkToUse = WalletAdapterNetwork.Mainnet;

setupAppContext(NetworkToUse, 5,
  new PublicKey("EYoekbd3vKY8Afwv35MAB9Ry2d1WkjkZSonZFx5TgTvL"), // escrow program
  new PublicKey("6AYxFyEXNuVFobYtRcQbsmE1ASX9Mcbk88VddJ5TU8cp"), // escrow treasury
  100, // escrow fee basis points
)

// export const NetworkToUse = WalletAdapterNetwork.Devnet;

// setupAppContext(NetworkToUse, 4,
//   new PublicKey("5fNArXNkGPQyW9NpGxNSUR9R2of8ebRgNf31Fc5YVe2U"), // escrow program
//   new PublicKey("4QxzifhBBqcQrEUDnxHck4Ez85YFcbiWJrZY4VD16SBP"), // escrow treasury
//   100, // escrow fee basis points
// )

if (process.env.NODE_ENV != "development") {
  console.log = function () { };
}

ReactDOM.render(<App />,
  document.getElementById('root')
);

reportWebVitals();
