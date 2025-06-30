export const Tabs = ({ children }) => <div>{children}</div>;
export const TabsList = ({ children }) => <div className="mb-2 flex gap-2">{children}</div>;
export const TabsTrigger = ({ value, children }) => <button>{children}</button>;
export const TabsContent = ({ children }) => <div>{children}</div>;