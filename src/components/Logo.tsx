
import React from 'react';

const Logo = ({ className = "", size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) => {
  const logoSizes = {
    small: "h-10 w-10",
    medium: "h-16 w-16",
    large: "h-24 w-24 md:h-32 md:w-32"
  };
  
  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute w-8 h-8 bg-primary/20 rounded-lg animate-float blur-md"></div>
      <img 
        src="/lovable-uploads/c7cd2956-0d3e-4e93-bc72-add1569df112.png" 
        alt="IFDD Logo" 
        className={`${logoSizes[size]} mr-2 object-contain`}
      />
      <div className="relative z-10 text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        ifdd
      </div>
    </div>
  );
};

export default Logo;
