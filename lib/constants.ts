// Free message limit for unauthenticated users
export const FREE_MESSAGE_LIMIT = 5;

// Abuse escalation settings
export const ABUSE_THRESHOLD = Number(process.env.ABUSE_THRESHOLD ?? 5);
export const ABUSE_WINDOW_SECONDS = Number(process.env.ABUSE_WINDOW_SECONDS ?? 600);   // 10 minutes
export const TEMP_BLOCK_SECONDS = Number(process.env.ABUSE_TEMP_BLOCK_SECONDS ?? 3600);    // 1 hour