export const validateEmail = (email) => {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/\d/.test(password)) return "Password must contain at least 1 number";
  return null;
};

export const validateName = (name) => {
  if (!name) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return null;
};

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return "Please confirm your password";
  if (password !== confirm) return "Passwords do not match";
  return null;
};

export const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", percent: 20, color: "bg-destructive" };
  if (score <= 2) return { label: "Fair", percent: 40, color: "bg-warning" };
  if (score <= 3) return { label: "Good", percent: 60, color: "bg-warning" };
  if (score <= 4) return { label: "Strong", percent: 80, color: "bg-success" };
  return { label: "Very Strong", percent: 100, color: "bg-success" };
};