import { queryDB } from ".";

// add log entry to the database
export async function logDatabase(username: string, message: string) {
  
  // add log entry to the database
  const result = await queryDB("INSERT INTO logs (username, message) VALUES ($1, $2)", [username, message]);
  return result;
}