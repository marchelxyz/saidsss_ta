type CsvOptions = {
  delimiter?: string;
  headers?: string[];
  includeBom?: boolean;
};

/**
 * Convert rows into CSV text.
 */
export function toCsv(
  rows: Array<Record<string, string | number | null>>,
  options: CsvOptions = {}
) {
  if (!rows.length) return "";
  const delimiter = options.delimiter ?? ",";
  const headers = options.headers ?? Object.keys(rows[0]);
  const escape = (value: string | number | null) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    const shouldQuote = new RegExp(`[\"\\n\\r${delimiter}]`).test(str);
    if (shouldQuote) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(headers.map((key) => escape(row[key] ?? "")).join(delimiter));
  }

  const csvBody = lines.join("\r\n");
  return options.includeBom ? `\uFEFF${csvBody}` : csvBody;
}

export function parseCsv(input: string) {
  const lines = input.trim().split(/\r?\n/);
  if (lines.length === 0) return [] as Array<Record<string, string>>;
  const headers = splitCsvLine(lines[0]);
  const rows: Array<Record<string, string>> = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((value) => value.trim());
}
