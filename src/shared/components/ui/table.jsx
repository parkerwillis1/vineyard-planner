export const Table      = ({ children }) => <table className="w-full">{children}</table>;
export const TableHeader= ({ children }) => <thead className="bg-gray-100">{children}</thead>;
export const TableBody  = ({ children }) => <tbody>{children}</tbody>;
export const TableRow   = ({ children }) => <tr>{children}</tr>;
export const TableHead  = ({ children }) => <th className="px-2 py-1 text-left">{children}</th>;
export const TableCell  = ({ children }) => <td className="px-2 py-1">{children}</td>;