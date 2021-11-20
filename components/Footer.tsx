import React from "react";

interface SocialLink {}

interface FooterProps {
  socialLinks: SocialLink[];
}

const Footer: React.FC<FooterProps> = ({}) => {
  return (
    <footer className="flex flex-wrap pt-3 justify-center text-center w-full bg-gray-800 text-gray-100">
      <div className="flex-auto w-full">Social Links</div>
      <div className="flex flex-auto w-full h-10 justify-center items-center italic">
        <p>
          Imagining an anti-capitalist, anti-racist, gender-euphoric,
          post-nation-state world
        </p>
      </div>
    </footer>
  );
};

export default Footer;
