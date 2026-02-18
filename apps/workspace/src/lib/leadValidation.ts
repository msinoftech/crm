/** Simple email format: local@domain.tld */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Phone: allow digits, optional leading +, spaces/dashes/parentheses; must have at least 10 digits */
export function validatePhone(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "Phone is required.";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a valid phone number (at least 10 digits).";
  return null;
}

/** Email: required and valid format */
export function validateEmail(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
  return null;
}

/** WhatsApp: optional; if provided, must be numeric (digits only, optional +) and at least 10 digits */
export function validateWhatsApp(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return "WhatsApp number must be at least 10 digits.";
  return null;
}
