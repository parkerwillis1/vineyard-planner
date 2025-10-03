export const Checkbox = ({ checked, onCheckedChange }) => (
    <input type="checkbox" className="h-4 w-4" checked={checked}
           onChange={e => onCheckedChange(e.target.checked)} />
  );