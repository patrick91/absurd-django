import type { NextPage } from "next";
import Head from "next/head";
import Script from "next/script";
import React from "react";
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
    <div>
      <Script
        defer
        data-domain="diagrams-web.vercel.app"
        src="https://plausible.io/js/plausible.js"
      ></Script>

      <Head>
        <title>Diagrams</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <EditorWithPreview />
    </div>
  );
};

export default Home;
