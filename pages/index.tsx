import type {
  GetStaticPropsResult,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import Image from "next/image";
import React from "react";
import About from "../components/About";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
const styles: any = {};

const Home: NextPage = ({}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
      <Head>
        <title>Cailyn Hansen | Be Bold, Take Risks, Make Change</title>
        <meta name="description" content="Cailyn Hansen personal website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col w-full flex-1">
        <div className="bg-hero bg-gray-900 bg-opacity-30 bg-blend-color-dodge bg-cover bg-no-repeat w-full h-full bg-center">
          <Header
            title="Cailyn Hansen"
            subtitle="Be Bold, Take Risks, Make Change"
            links={[
              {
                label: "About",
                href: "#about",
              },
              {
                label: "Resume",
                href: "/resume",
              },
              {
                label: "Writings",
                href: "#writings",
              },
              {
                label: "Projects",
                href: "#projects",
              },
              {
                label: "Contact",
                href: "#contact",
              },
            ]}
          />

          <Hero />
        </div>

        <About />

        <div className="flex text-center">
          <div className="flex-1">
            <h3>Resume</h3>
          </div>
          <div className="flex-1">
            <h3>Projects</h3>
          </div>
        </div>

        <Contact />
      </main>

      <Footer socialLinks={[]} />
    </div>
  );
};

interface HomeProps {}

export async function getStaticProps(): Promise<
  GetStaticPropsResult<HomeProps>
> {
  return {
    props: {},
  };
}

export default Home;
