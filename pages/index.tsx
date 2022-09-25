import type { NextPage } from "next";
import Head from "next/head";
import Script from "next/script";
import dynamic from "next/dynamic";

import { Header } from "../components/header";

const EditorWithPreview = dynamic(
  // @ts-ignore
  () =>
    import("../components/editor-with-preview").then(
      (mod) => mod.EditorWithPreview
    ),
  { ssr: false }
);

const Home: NextPage = () => {
  return (
    <div className="h-full flex flex-col">
      <Script
        defer
        data-domain="absurd-django.vercel.app"
        src="https://plausible.io/js/plausible.js"
      ></Script>

      <Head>
        <title>Absurd django 🦄</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <EditorWithPreview />
    </div>
  );
};

export default Home;
