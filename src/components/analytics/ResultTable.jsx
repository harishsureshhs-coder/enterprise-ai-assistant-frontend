import "./AnalyticsResult.css";

import {
  formatInrMillions,
  formatNumber,
  isMonetaryColumn,
} from "../../utils/numberFormat";

function formatValue(
  column,
  value
) {
  if (
    typeof value === "number" &&
    isMonetaryColumn(column)
  ) {
    return formatInrMillions(value);
  }

  if (
    typeof value === "number"
  ) {
    return formatNumber(value);
  }

  return value ?? "-";
}

function ResultTable({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="result-table-container">
      <table className="result-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
              {columns.map((column) => (
                <td key={`${rowIndex}-${column}`}>
  {formatValue(
    column,
    row[column]
  )}
</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultTable;