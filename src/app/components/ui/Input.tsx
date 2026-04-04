type InputProps = {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

export function Input({ label, name, type = 'text', value, onChange, placeholder, required = false, options }: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-brand-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full border border-brand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full border border-brand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      )}
    </div>
  );
}
