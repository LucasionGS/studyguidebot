import * as fs from 'fs';
import * as path from 'path';

// Define the path to the single JSON file where all user data will be stored (create new tables in sqlite)
const usersFilePath: string = path.join(__dirname, 'users.json');

// Ensure the users.json file exists (check whether the user exists in the database)
if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify({}, null, 2), 'utf8');
}

/**
 * Load all user data from the database.
 * @returns {Record<string, any>} - The complete user data object.
 */
function loadAllUserData(): Record<string, any> {
  const userData: string = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(userData);
}

/**
 * Save all user data to the database.
 * @param {Record<string, any>} data - The complete user data object to save.
 */
function saveAllUserData(data: Record<string, any>): void {
  fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Check if the user exists in the database. If not, initialize their data.
 * @param {string} userId - The Discord user ID.
 * @returns {Record<string, any>} - The user data.
 */
function checkOrCreateUser(userId: string): Record<string, any> {
  const allUserData = loadAllUserData();

  if (!allUserData[userId]) {
    // Initialize the user data if it doesn't exist
    allUserData[userId] = {
      userId: userId,
      submission: 0,
      level: 1,
      submissionPending: 0,
      roles: "",
      tokens: 0,
      dailyRewardClaimed: "",
      lastClaimed: false
    };
    saveAllUserData(allUserData);
  }

  return allUserData[userId];
}

/**
 * Load specific user data from the database.
 * @param {string} userId - The Discord user ID.
 * @returns {Record<string, any>} - The user data.
 */
function loadUserData(userId: string): Record<string, any> {
  const allUserData = loadAllUserData();
  return allUserData[userId] || checkOrCreateUser(userId);
}

/**
 * Save specific user data to the database.
 * @param {string} userId - The Discord user ID.
 * @param {Record<string, any>} data - The user data to save.
 */
function saveUserData(userId: string, data: Record<string, any>): void {
  const allUserData = loadAllUserData();
  allUserData[userId] = data;
  saveAllUserData(allUserData);
}

// Export the functions
export {
  checkOrCreateUser,
  loadUserData,
  saveUserData
};