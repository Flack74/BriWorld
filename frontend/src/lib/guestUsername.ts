/**
 * Generate a unique guest username with format: Guest{4-digit-number}
 * Example: Guest1234, Guest5678, Guest9012
 */
export const generateGuestUsername = (): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  return `Guest${randomNum}`;
};

/**
 * Get or create a guest username from localStorage
 * If no username exists, generates a new unique guest username
 */
export const getOrCreateGuestUsername = (): string => {
  const stored = localStorage.getItem("username");
  
  // If username exists and is not the old default "Guest", use it
  if (stored && stored !== "Guest") {
    return stored;
  }
  
  // Generate new unique guest username
  const guestName = generateGuestUsername();
  localStorage.setItem("username", guestName);
  return guestName;
};

/**
 * Check if a username is a guest username
 */
export const isGuestUsername = (username: string): boolean => {
  return /^Guest\d{4}$/.test(username);
};
