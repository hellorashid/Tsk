import { useState, InputHTMLAttributes, ChangeEvent, CSSProperties } from "react";
import { motion } from "motion/react";

const tickVariants = {
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.1,
      delay: 0.01,
    },
  },
  unchecked: {
    pathLength: 0,
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
};

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id' | 'checked' | 'onChange' | 'defaultChecked' | 'style' | 'size'> {
  id: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  accentColor?: string;
  size?: "sm" | "md";
}

export default function Checkbox({
  id,
  checked,
  defaultChecked,
  onChange,
  accentColor = "#DA8DF7", // Default accent color
  size = "sm", // Use size, default to "sm"
  ...restInputProps
}: CheckboxProps) {
  const [internalIsChecked, setInternalIsChecked] = useState(defaultChecked ?? false);

  const isControlled = checked !== undefined;
  const displayChecked = isControlled ? checked : internalIsChecked;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
    if (!isControlled) {
      setInternalIsChecked(event.target.checked);
    }
  };

  const inputStyles: CSSProperties = {};
  if (displayChecked) {
    inputStyles.borderColor = accentColor;
    inputStyles.backgroundColor = accentColor;
  }

  // Determine classes based on size
  const inputSizeClass = size === "md" ? "h-6 w-6" : "h-5 w-5";
  const tickSizeClass = size === "md" ? "h-4.5 w-4.5" : "h-3.5 w-3.5";

  return (
    <button className="relative flex items-center" type="button"> {/* Changed to type="button" for accessibility if it's just a wrapper */}
      <input
        type="checkbox"
        className={`border-blue-gray-200 relative appearance-none rounded-md border transition-all duration-500 ${inputSizeClass} ${restInputProps.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        id={id}
        checked={displayChecked}
        onChange={handleChange}
        style={inputStyles} // Apply dynamic styles
        {...restInputProps}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="3.5"
          stroke="currentColor"
          className={`h-3.5 w-3.5 ${tickSizeClass}`}
          initial={false}
          animate={displayChecked ? "checked" : "unchecked"}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
            variants={tickVariants}
          />
        </motion.svg>
      </div>
    </button>
  );
}