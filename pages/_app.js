import '../styles/globals.css';
import initAuth from '../utils/firebase/auth/initAuth';

// Inicializa o Firebase
initAuth();

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;