import React, { useState } from "react";

interface ContactProps {}

const Contact: React.FC<ContactProps> = ({}) => {
  const [isEmailHidden, setIsEmailHidden] = useState(true);

  const showEmail = () => {
    setIsEmailHidden(false);
  };

  return (
    <div onFocus={showEmail} onMouseEnter={showEmail}>
      Send me an email at{" "}
      <span>{isEmailHidden ? "" : "cailyn.e.hansen@gmail.com"}</span>
    </div>
  );
};

export default Contact;
