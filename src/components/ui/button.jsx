// src/components/ui/button.jsx
export default function Button({ children, className = '', ...rest }) {
  return (
    <button
      className={
        `px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium
         hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition
         ${className}`
      }
      {...rest}
    >
      {children}
    </button>
  );
}
