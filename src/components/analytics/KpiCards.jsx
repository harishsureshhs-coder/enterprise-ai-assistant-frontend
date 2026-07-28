import "./AnalyticsResult.css";

import {
  formatInrMillions,
  formatNumber,
  isMonetaryColumn,
} from "../../utils/numberFormat";

function findNumericColumn(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return Object.keys(rows[0]).find((column) =>
    rows.some(
      (row) =>
        typeof row[column] === "number" &&
        Number.isFinite(row[column])
    )
  );
}

function findCategoryColumn(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return Object.keys(rows[0]).find((column) =>
    rows.some((row) => typeof row[column] === "string")
  );
}

function formatCompactValue(value) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (absoluteValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatKpiValue(
  column,
  value
) {
  if (
    isMonetaryColumn(column)
  ) {
    return formatInrMillions(value);
  }

  return formatNumber(value);
}

function KpiCards({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const numericColumn = findNumericColumn(rows);
  const categoryColumn = findCategoryColumn(rows);

  if (!numericColumn) {
    return null;
  }

  const validRows = rows.filter(
    (row) =>
      typeof row[numericColumn] === "number" &&
      Number.isFinite(row[numericColumn])
  );

  if (validRows.length === 0) {
    return null;
  }

  const total = validRows.reduce(
    (sum, row) => sum + row[numericColumn],
    0
  );

  const topRow = validRows.reduce((currentTop, row) =>
    row[numericColumn] > currentTop[numericColumn]
      ? row
      : currentTop
  );

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <span className="kpi-label">Total {numericColumn}</span>
        <strong className="kpi-value">
  {formatKpiValue(
    numericColumn,
    total
  )}
</strong>
      </div>

      <div className="kpi-card">
        <span className="kpi-label">Rows</span>
        <strong className="kpi-value">{rows.length}</strong>
      </div>

      {categoryColumn && (
        <div className="kpi-card">
          <span className="kpi-label">Top {categoryColumn}</span>
          <strong className="kpi-value">
            {topRow[categoryColumn]}
          </strong>

          <span className="kpi-subvalue">
  {formatKpiValue(
    numericColumn,
    topRow[numericColumn]
  )}
</span>
        </div>
      )}
    </div>
  );
}

export default KpiCards;