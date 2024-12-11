/**
 * Custom error class for errors relating to DBObjects
 */
export class DBError extends Error {}

/**
 * Error for when a DBObject is not found in the database
 */
export class DBObjectNotFoundError extends DBError {}

/**
 * Error for when a DBObject already exists in the database
 */
export class DBObjectAlreadyExistsError extends DBError {}


/**
 * Error for when altering a DBObject fails
 */
export class DBObjectAlterError extends DBError {}
