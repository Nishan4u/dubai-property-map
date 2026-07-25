export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
}: {
  columns: Column<T>[];
  rows: T[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-navy-700">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-navy-700 bg-navy-850 text-xs uppercase tracking-wide text-ink-500">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-navy-800 last:border-0 hover:bg-navy-850/60"
            >
              {columns.map((col, i) => (
                <td key={i} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="p-8 text-center text-sm text-ink-500">
          No records found.
        </div>
      )}
    </div>
  );
}
