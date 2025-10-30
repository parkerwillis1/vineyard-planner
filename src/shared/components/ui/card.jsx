export const Card = ({ children, className = '', onClick, ...props }) => (
  <div
    className={`border rounded-xl shadow-sm bg-white ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);
  export const CardContent = ({ children, className = '', ...props }) => (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );