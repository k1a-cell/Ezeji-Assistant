export async function fetchAllPages(fetchPage, pageSize = 1000) {
  const rows = [];
  let totalCount = null;

  for (let offset = 0; ; ) {
    const { data, error, count } = await fetchPage(offset, pageSize);
    if (error) throw error;
    if (offset === 0 && Number.isFinite(count)) totalCount = count;

    const page = data || [];
    rows.push(...page);
    if (!page.length || (totalCount === null && page.length < pageSize)) return rows;
    offset += page.length;
    if (totalCount !== null && offset >= totalCount) return rows;
  }
}