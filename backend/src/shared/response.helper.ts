export function ok<T>(data: T, message = 'Success') {
  return { success: true, message, data }
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    success: true,
    message: 'Success',
    data: {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}
