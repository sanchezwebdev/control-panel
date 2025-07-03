import { SelectionProvider } from "../context/SelectionContext";
import Head from "next/head";
import Script from "next/script";
import "../styles/globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';


function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Web site created using Next.js" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="stylesheet" href="/richtexteditor/rte_theme_default.css" />
        <title>Knowledge Of The West</title>
      </Head>
      <Script src="/richtexteditor/rte.js" strategy="beforeInteractive" />
      <Script src="/richtexteditor/plugins/all_plugins.js" strategy="beforeInteractive" />

      <SelectionProvider>
        <Component {...pageProps} />
      </SelectionProvider>
    </>
  );
}

export default MyApp;
