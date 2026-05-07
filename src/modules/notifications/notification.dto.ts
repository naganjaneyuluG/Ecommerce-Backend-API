import { z } from 'zod';

export const notificationIdParamsDto = z.object({
  id: z.string().min(1),
});

export const listNotificationsQueryDto = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().positive().optional()),
  limit: z.string().optional().transform(Number).pipe(z.number().positive().max(100).optional()),
  isRead: z.string().optional(),
});
