import React from 'react';

const Card = React.forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <div ref={ref} className={`bg-[#181D24] border border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
export { Card, CardContent }; 