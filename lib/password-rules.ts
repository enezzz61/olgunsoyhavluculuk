export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIRE_UPPERCASE = /[A-Z]/;
export const PASSWORD_REQUIRE_LOWERCASE = /[a-z]/;
export const PASSWORD_REQUIRE_NUMBER = /\d/;

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`);
  }

  if (!PASSWORD_REQUIRE_UPPERCASE.test(password)) {
    errors.push("Şifre en az bir büyük harf içermeli.");
  }

  if (!PASSWORD_REQUIRE_LOWERCASE.test(password)) {
    errors.push("Şifre en az bir küçük harf içermeli.");
  }

  if (!PASSWORD_REQUIRE_NUMBER.test(password)) {
    errors.push("Şifre en az bir rakam içermeli.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
