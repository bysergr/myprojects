/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number if needed
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Generate a username from a name (lowercase, separated by hyphens)
 */
export function generateUsernameFromName(name: string): string {
  return generateSlug(name);
}

/**
 * Get a random lowercase letter
 */
function getRandomLetter(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  return letters[Math.floor(Math.random() * letters.length)];
}

/**
 * Generate a unique username by checking against existing usernames
 * If the base username exists, appends random letters until unique
 */
export async function generateUniqueUsername(
  baseUsername: string,
  checkExists: (username: string) => Promise<boolean>
): Promise<string> {
  let username = baseUsername;
  
  // If base username is empty or too short, use a default
  if (!username || username.length < 3) {
    username = 'user';
  }
  
  // Check if username exists, if so append random letters
  while (await checkExists(username)) {
    username = `${username}${getRandomLetter()}`;
  }
  
  return username;
}
