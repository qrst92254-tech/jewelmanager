function tenantId(req) {
  const id = req.session?.userId || req.user?.id;
  if (!id) {
    throw new Error('Tenant context missing');
  }
  return id;
}

module.exports = { tenantId };
