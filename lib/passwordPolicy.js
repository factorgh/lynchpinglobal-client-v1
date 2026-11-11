// Shared by the browser forms and the API so every password route enforces the same rules.
export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One capital (uppercase) letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "One special character (e.g. ! @ # $ % & *)",
    test: (p) => /[^A-Za-z0-9\s]/.test(p),
  },
];

export const getPasswordChecks = (password) => {
  const value = String(password || "");
  return PASSWORD_REQUIREMENTS.map((r) => ({ id: r.id, label: r.label, met: r.test(value) }));
};

export const isPasswordValid = (password) =>
  getPasswordChecks(password).every((c) => c.met);

/** Returns a readable message listing missing requirements, or "" when valid. */
export const getPasswordError = (password) => {
  const missing = getPasswordChecks(password).filter((c) => !c.met);
  if (!missing.length) return "";
  return `Your password is missing: ${missing.map((c) => c.label.toLowerCase()).join(", ")}.`;
};
