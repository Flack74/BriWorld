export interface RoundOption {
  value: number;
  label: string;
  icon: string;
  description: string;
}

export interface TimeoutOption {
  value: number;
  label: string;
  icon: string;
  description: string;
}

const ROUND_CONFIG = [
  { value: 5, icon: "⚡", description: "Quick" },
  { value: 10, icon: "🎯", description: "Standard" },
  { value: 15, icon: "🏆", description: "Extended" },
  { value: 20, icon: "🔥", description: "Marathon" },
  { value: 40, icon: "💪", description: "Challenge", requiresLogin: true },
  { value: 60, icon: "🚀", description: "Epic", requiresLogin: true },
  { value: 80, icon: "⭐", description: "Legendary", requiresLogin: true },
  { value: 100, icon: "👑", description: "Ultimate", requiresLogin: true },
];

const TIMEOUT_CONFIG = [
  { value: 10, icon: "⚡", description: "Lightning" },
  { value: 15, icon: "🎯", description: "Standard" },
  { value: 20, icon: "⏱️", description: "Relaxed" },
  { value: 30, icon: "🕒", description: "Casual" },
  { value: 40, icon: "🕓", description: "Easy" },
  { value: 60, icon: "⏰", description: "Chill" },
];

const generateRoundOptions = (config: typeof ROUND_CONFIG, isLoggedIn: boolean): RoundOption[] => {
  return config
    .filter(item => isLoggedIn || !item.requiresLogin)
    .map(({ value, icon, description }) => ({
      value,
      label: `${value} Round${value !== 1 ? 's' : ''}`,
      icon,
      description,
    }));
};

const generateTimeoutOptions = (config: typeof TIMEOUT_CONFIG): TimeoutOption[] => {
  return config.map(({ value, icon, description }) => ({
    value,
    label: `${value}s`,
    icon,
    description,
  }));
};

export const ROUND_OPTIONS = {
  guest: generateRoundOptions(ROUND_CONFIG, false),
  loggedIn: generateRoundOptions(ROUND_CONFIG, true),
};

export const TIMEOUT_OPTIONS = generateTimeoutOptions(TIMEOUT_CONFIG);
