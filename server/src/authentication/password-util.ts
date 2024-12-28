import bcrypt from 'bcrypt';

/**
 * Hashes a plaintext password using bcrypt.
 *
 * @param {string} password - The plaintext password to hash
 * @param {number} saltRounds - The cost factor for hashing. Defaults to 10.
 * @returns {Promise<string>} A Promise that resolves with the hashed password
 */
export async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  // Generate a salt and hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

/**
 * Checks if a plaintext password matches a stored bcrypt hashed password.
 *
 * @param {string} plaintextPassword - The plaintext password entered by the user
 * @param {string} hashedPassword - The bcrypt hash stored in the database
 * @returns {Promise<boolean>} True if the passwords match, false otherwise
 */
export async function checkPassword(plaintextPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plaintextPassword, hashedPassword);
}