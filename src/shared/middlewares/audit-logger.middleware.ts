import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * AuditLog Mongoose Schema — stores mutating action records.
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: ['POST', 'PUT', 'PATCH', 'DELETE'],
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Audit logger middleware — logs all mutating HTTP actions to the database.
 */
export const auditLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!mutatingMethods.includes(req.method)) {
    next();
    return;
  }

  // Capture the response status after it's sent
  const originalSend = res.json.bind(res);
  res.json = (body: unknown) => {
    // Fire and forget — don't await to avoid slowing down the response
    const logEntry = new AuditLog({
      userId: req.user?.userId ?? null,
      action: req.method,
      resource: req.baseUrl + req.path,
      resourceId: req.params['id'] ?? null,
      details: {
        body: req.method !== 'DELETE' ? req.body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      },
      ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? null,
      statusCode: res.statusCode,
    });

    logEntry.save().catch((err: Error) => {
      console.error('Audit log save failed:', err.message);
    });

    return originalSend(body);
  };

  next();
};
