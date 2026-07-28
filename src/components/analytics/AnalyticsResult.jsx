import ResultChart from "./ResultChart";
import ResultTable from "./ResultTable";

import "./AnalyticsResult.css";


function AnalyticsResult({
  rows,
  generatedQuery,
  executionTime,
  visual,
}) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return null;
  }

  return (
    <div className="analytics-result">
      <ResultChart
        rows={rows}
        visual={visual}
      />

      <div className="analytics-section-title">
        Result Data
      </div>

      <ResultTable
        rows={rows}
      />

      {generatedQuery && (
        <details className="query-details">
          <summary>
            View generated SQL
          </summary>

          <pre className="generated-query">
            {generatedQuery}
          </pre>
        </details>
      )}

      {executionTime !== null &&
        executionTime !== undefined && (
          <div className="analytics-execution-time">
            Execution time:{" "}
            {(
              executionTime /
              1000
            ).toFixed(2)}{" "}
            seconds
          </div>
        )}
    </div>
  );
}


export default AnalyticsResult;