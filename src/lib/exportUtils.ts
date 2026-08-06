/**
 * Utility to export tabular data to XLS / CSV files in browser,
 * with optional summary statistics header block.
 */
export interface ExportStat {
  label: string;
  value: string | number;
}

export function exportToXLS<T extends Record<string, unknown>>(
  filename: string,
  data: T[],
  columns?: { key: keyof T; header: string }[],
  stats?: ExportStat[] | Record<string, string | number>
) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Build Stats Section if provided
  let statsLines: string[] = [];
  if (stats) {
    statsLines.push(`"SUMMARY STATISTICS"`);
    statsLines.push(`"Metric","Value"`);

    if (Array.isArray(stats)) {
      stats.forEach((item) => {
        const valStr = typeof item.value === "string" ? item.value.replace(/"/g, '""') : item.value;
        statsLines.push(`"${item.label}","${valStr}"`);
      });
    } else {
      Object.entries(stats).forEach(([key, value]) => {
        const valStr = typeof value === "string" ? value.replace(/"/g, '""') : value;
        statsLines.push(`"${key}","${valStr}"`);
      });
    }
    statsLines.push(`""`); // Blank separator line
    statsLines.push(`"DETAILED DATA TABLE"`);
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
  const tableContent = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  const fullContent = statsLines.length > 0
    ? statsLines.join("\r\n") + "\r\n" + tableContent
    : tableContent;

  const csvContent = "\uFEFF" + fullContent;

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

/**
 * Utility to export multiple data sections into a single structured XLS/CSV report.
 */
export interface XLSSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export function exportMultiSectionXLS(
  filename: string,
  sections: XLSSection[]
) {
  if (!sections || sections.length === 0) {
    alert("No data available to export.");
    return;
  }

  let lines: string[] = [];

  sections.forEach((section, idx) => {
    lines.push(`"=== ${section.title.toUpperCase()} ==="`);
    lines.push(section.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));
    section.rows.forEach((row) => {
      lines.push(
        row
          .map((val) => {
            if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
            return `"${val ?? ""}"`;
          })
          .join(",")
      );
    });
    if (idx < sections.length - 1) {
      lines.push(`""`); // Blank line separator between sections
      lines.push(`""`);
    }
  });

  const fullContent = lines.join("\r\n");
  const csvContent = "\uFEFF" + fullContent;

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
