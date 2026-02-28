export function sanitizeInput(input: string, maxLength: number = 500): string {
  // Basic sanitization
  let safe = input.trim();
  if (safe.length > maxLength) {
    throw {
      code: "INPUT_TOO_LONG",
      message: `Input exceeds maximum allowed length of ${maxLength} characters.`,
      suggestion: "Shorten your expression."
    };
  }
  return safe;
}
