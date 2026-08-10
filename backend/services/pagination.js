// PoleSafe — Pagination Utility
// Standard pagination for all list endpoints

/**
 * Parse pagination params from query string
 * @param {Object} query - req.query object
 * @param {Object} defaults - { defaultLimit, maxLimit }
 * @returns {{ limit: number, skip: number, page: number }}
 */
function parsePagination(query, defaults = {}) {
  const defaultLimit = defaults.defaultLimit || 20;
  const maxLimit = defaults.maxLimit || 100;

  let page = parseInt(query.page, 10) || 1;
  if (page < 1) page = 1;

  let limit = parseInt(query.limit, 10) || defaultLimit;
  if (limit < 1) limit = 1;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { limit, skip, page };
}

/**
 * Format paginated response
 * @param {Array} data - Result array
 * @param {number} total - Total matching documents
 * @param {number} limit - Items per page
 * @param {number} skip - Items to skip
 * @param {number} page - Current page
 * @returns {Object}
 */
function formatPaginatedResponse(data, total, { limit, skip, page }) {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  };
}

module.exports = { parsePagination, formatPaginatedResponse };
