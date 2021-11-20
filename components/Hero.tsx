import React from "react";

interface HeroProps {}

const Hero: React.FC<HeroProps> = ({}) => {
  return (
    <div className="flex flex-wrap self-center content-center px-2 lg:px-10 min-h-screen h-full w-full text-white">
      <div className="flex flex-auto w-full justify-center">
        <h1 className="w-10/12 max-w-4xl text-6xl font-medium tracking-wide pb-2 border-b-2 border-white">
          <span className="w-min pr-1 border-r-2">Hi, my name is Cailyn</span>
        </h1>
      </div>
      <div className="flex flex-wrap flex-auto justify-center pb-28 md:pb-48 lg:pb-60">
        <div className="flex flex-wrap items-center w-10/12 max-w-4xl mt-6">
          <h2 className="flex-auto content-center max-w-xl text-md tracking-wide uppercase md:py-2">
            Together we can turn the corner to a more equitable and just future
          </h2>
          {/* <div className="flex-auto w-full md:w-5/12 text-md mt-4 md:mt-0">
            <button
              className="flex content-center align-middle h-10 leading-6 text-md tracking-widest uppercase w-max border-2 border-white p-2 hover:bg-purple-400  hover:bg-opacity-80"
              onClick={() => {}}
            >
              Let&apos;s Go &nbsp;
            </button>
          </div> */}
        </div>
      </div>
      <div className="flex justify-center text-center w-full">
        <div className="w-min">
          <p>\/</p>
          <p>Continue</p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
