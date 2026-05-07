import { FilterQuery, Model, Document } from 'mongoose';

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const paginate = async <T extends Document>(
  model: Model<T>,
  query: FilterQuery<T>,
  options: PaginationOptions,
  populateFields?: string | string[]
): Promise<PaginationResult<T>> => {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 10));
  const sortBy = options.sortBy ?? 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    model.countDocuments(query),
    (() => {
      let queryBuilder = model
        .find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

      if (populateFields) {
        const fields = Array.isArray(populateFields) ? populateFields : [populateFields];
        for (const field of fields) {
          queryBuilder = queryBuilder.populate(field);
        }
      }

      return queryBuilder.lean().exec();
    })(),
  ]);

  return {
    data: data as T[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

interface CursorPaginationOptions {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export const cursorPaginate = async <T extends Document>(
  model: Model<T>,
  query: FilterQuery<T>,
  options: CursorPaginationOptions,
  populateFields?: string | string[]
): Promise<CursorPaginationResult<T>> => {
  const limit = Math.min(100, Math.max(1, options.limit ?? 10));
  const sortBy = options.sortBy ?? '_id';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

  const cursorQuery = { ...query };
  if (options.cursor) {
    const operator = sortOrder === 1 ? '$gt' : '$lt';
    (cursorQuery as Record<string, unknown>)[sortBy] = { [operator]: options.cursor };
  }

  let queryBuilder = model
    .find(cursorQuery)
    .sort({ [sortBy]: sortOrder })
    .limit(limit + 1);

  if (populateFields) {
    const fields = Array.isArray(populateFields) ? populateFields : [populateFields];
    for (const field of fields) {
      queryBuilder = queryBuilder.populate(field);
    }
  }

  const results = await queryBuilder.lean().exec();
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  const lastItem = data[data.length - 1];
  const nextCursor = hasMore && lastItem
    ? String((lastItem as Record<string, unknown>)[sortBy])
    : null;

  return {
    data: data as T[],
    pagination: {
      limit,
      nextCursor,
      hasMore,
    },
  };
};
