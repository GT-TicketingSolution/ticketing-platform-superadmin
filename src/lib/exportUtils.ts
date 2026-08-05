/**
 * Utility to export tabular data to XLS / CSV files in browser
 */
export function exportToXLS<T extends Record<string, unknown>>(
  filename: string,
  data: T[],
  columns?: { key: keyof T; header: string }[]
) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Generate headers
  const headers = columns
    ? columns.map((col) => col.header)
    : Object.keys(data[0]);

  // Generate rows
  const rows = data.map((item) => {
    if (columns) {
      return columns.map((col) => {
        const val = item[col.key];
        if (Array.isArray(val)) return `"${val.join("; ")}"`;
        if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
        return `"${val ?? ""}"`;
      });
    } else {
      return Object.values(item).map((val) => {
        if (Array.isArray(val)) return `"${val.join("; ")}"`;
        if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
        return `"${val ?? ""}"`;
      });
    }
  });

  // Construct CSV string with UTF-8 BOM for Excel compatibility
  const csvContent =
    "\uFEFF" +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
