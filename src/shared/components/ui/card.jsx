export const Card = ({ children }) => (
    <div className="border rounded-xl shadow-sm bg-white">{children}</div>
  );
  export const CardContent = ({ children }) => <div className="p-4">{children}</div>;