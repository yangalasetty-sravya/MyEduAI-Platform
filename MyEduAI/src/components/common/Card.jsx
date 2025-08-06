import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;