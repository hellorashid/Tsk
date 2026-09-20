import { Switch as BaseSwitch } from '@base-ui/react/switch';

type ThemeSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
};

export function ThemeSwitch({ checked, onCheckedChange, id, className = '' }: ThemeSwitchProps) {
  return (
    <BaseSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-300 transition-colors data-checked:bg-gray-800 dark:bg-white/10 dark:data-checked:bg-white/30 ${className}`}
    >
      <BaseSwitch.Thumb className="pointer-events-none block h-5 w-5 translate-x-0 rounded-full bg-white shadow-lg transition-transform data-checked:translate-x-5" />
    </BaseSwitch.Root>
  );
}
