let keyboardNavigation = false;

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', () => { keyboardNavigation = true; }, true);
  window.addEventListener('pointerdown', () => { keyboardNavigation = false; }, true);
}

// Programmatic focus after a tap or click draws a focus ring nobody asked for,
// so focus is only moved for keyboard users.
export function isKeyboardNavigation() {
  return keyboardNavigation;
}
