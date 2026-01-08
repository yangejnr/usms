export function validatePasswordPolicy(password: string) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return {
    valid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
    rules: {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    },
  };
}
