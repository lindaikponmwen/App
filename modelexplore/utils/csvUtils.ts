/**
 * Converts an array of objects into a CSV string.
 * @param data Array of objects to convert
 * @returns CSV formatted string
 */
export function arrayToCsv(data: any[]): string {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      cell = cell.toString().replace(/"/g, '""');
      if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a browser download for a given string as a file.
 * @param content The string content of the file
 * @param fileName The desired file name
 * @param mimeType The MIME type of the file (defaults to text/csv)
 */
export function downloadFile(content: string, fileName: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
