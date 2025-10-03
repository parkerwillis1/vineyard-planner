export const Input = props => (
    <input {...props} className={`border rounded px-2 py-1 w-full ${props.className||""}`} />
  );