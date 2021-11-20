import React from "react";
import Image from "next/image";

interface AboutProps {}

const About: React.FC<AboutProps> = ({}) => {
  return (
    <div className="flex flex-wrap w-full justify-between bg-gray-100">
      <div className="flex-auto w-5/12">
        <Image
          src="/static/about.jpeg"
          alt="Picture of Cailyn smiling in a black suit"
          width="670px"
          height="500px"
          layout="responsive"
        />
        {/* <div className="relative -top-10 text-black text-center h-0 text-2xl">
          About Me
        </div> */}
      </div>
      <div className="flex-auto w-7/12 py-5 px-14">
        <p>
          I&apos;m exploring the intersection of digital humanities,
          transformative justice, and science fiction to understand and
          conceptualize a community-first alternative way of organizing
          ourselves in society
        </p>
        <p>
          You can also find me doing digital consulting for local governments
          and non-profits with River Delta. (https://bytheriverdelta.com)
        </p>
      </div>
    </div>
  );
};

export default About;
