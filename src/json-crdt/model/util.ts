const MAX_INT = 9007199254740991;
const RESERVED = 0xFFFF;
const DIFF = MAX_INT - RESERVED;

/**
 * Generates a random session ID up to 53 bits in size, skips first 0xFFFF
 * values, keeping them reserved for future extensions.
 * 
 * @returns Random session ID.
 */
export const randomSessionId = () => Math.floor((DIFF * Math.random()) + RESERVED);
