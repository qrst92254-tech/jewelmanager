const claimedThisSession = new Set();

/**
 * Supabase stores data in the cloud with user_id isolation from the start.
 * No legacy orphan data exists — this is a no-op for Supabase.
 */
function claimOrphanDataForUser(userId) {
  if (!userId || claimedThisSession.has(userId)) return;
  claimedThisSession.add(userId);
}

module.exports = { claimOrphanDataForUser };
