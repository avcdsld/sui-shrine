import { WalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import '../styles/globals.css';
import '../styles/suiet-wallet-kit-custom.css';

function App({ Component, pageProps }) {
    return (
        <WalletProvider>
            <Component {...pageProps} />
        </WalletProvider>
    );
}

export default App;