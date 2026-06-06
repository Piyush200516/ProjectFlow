

const writeAuditLog = async ({
  actorId = null,
  action,
  entityType,
  entityId = null,
  severity = 'INFO',
  req,
  metadata = {},
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        severity,
        ipAddress: req?.ip || req?.socket?.remoteAddress || null,
        userAgent: req?.headers?.['user-agent'] || null,
        metadata,
      },
    });
  } catch (error) {
    console.error('[AUDIT] write failed:', error.message);
    return null;
  }
};

module.exports = {
  writeAuditLog,
};
