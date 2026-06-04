/** @returns {string} Supabase auth user UUID from req.user */
function tenantId(req) {
  const id = req.user?.id;
  if (!id) {
    throw new Error('Tenant context missing');
  }
  return id;
}

module.exports = { tenantId };
