type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

export function showPickerOrClick(input: HTMLInputElement | null) {
  if (!input) {
    return;
  }

  const pickerInput = input as PickerInput;

  if (typeof pickerInput.showPicker === "function") {
    try {
      pickerInput.showPicker();
      return;
    } catch {
      // Fall back to click when the native picker is unavailable.
    }
  }

  input.click();
}
