import {
  Box,
  Paper,
  Typography,
} from "@mui/material";

import ResultChart from "./ResultChart";
import ResultTable from "./ResultTable";

import {
  determineVisualization,
} from "../../utils/visualizationDecision";

import {
  formatInrMillions,
  formatNumber,
  isMonetaryColumn,
} from "../../utils/numberFormat";

import "./AnalyticsResult.css";


function formatKpiValue(
  column,
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return String(value);
  }

  if (
    isMonetaryColumn(
      column
    )
  ) {
    return formatInrMillions(
      value
    );
  }

  return formatNumber(
    value
  );
}


function formatKpiTitle(
  column
) {
  return String(
    column || "Value"
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


function KpiResult({
  rows,
  kpiColumn,
}) {
  if (
    !rows?.length ||
    !kpiColumn
  ) {
    return null;
  }

  const value =
    rows[0]?.[
      kpiColumn
    ];

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,

        px: {
          xs: 2.5,
          sm: 3,
        },

        py: 2.5,

        border:
          "1px solid",

        borderColor:
          "divider",

        borderRadius: 3,

        maxWidth: {
          xs: "100%",
          sm: 420,
        },

        backgroundColor:
          "background.default",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color:
            "text.secondary",

          fontWeight: 600,

          mb: 0.75,
        }}
      >
        {formatKpiTitle(
          kpiColumn
        )}
      </Typography>

      <Typography
        sx={{
          fontSize: {
            xs: "1.75rem",
            sm: "2.1rem",
          },

          fontWeight: 700,

          lineHeight: 1.2,

          letterSpacing:
            "-0.02em",
        }}
      >
        {formatKpiValue(
          kpiColumn,
          value
        )}
      </Typography>
    </Paper>
  );
}


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

  const visualization =
    determineVisualization(
      rows,
      visual
    );

  const {
    displayType,
    chartType,
    kpiColumn,
    timeMode,
    yearColumn,
    monthColumn,
    categoryColumn,
    valueColumn,
    seriesColumn,
  } = visualization;


  const resolvedVisual =
  chartType
    ? {
        ...visual,

        type:
          chartType,

        category_column:
          categoryColumn ||
          visual?.category_column ||
          null,

        value_column:
          valueColumn ||
          visual?.value_column ||
          null,

        series_column:
          seriesColumn ||
          visual?.series_column ||
          null,

        time_mode:
          timeMode ||
          null,

        year_column:
          yearColumn ||
          null,

        month_column:
          monthColumn ||
          null,
      }
    : visual;

  const showKpi =
    displayType ===
    "KPI";


  const showChart =
    displayType ===
    "CHART_TABLE";


  const showTable =
    displayType ===
      "TABLE" ||
    displayType ===
      "CHART_TABLE" ||
    displayType ===
      "KPI";


  return (
    <div className="analytics-result">

      {/* ========================================= */}
      {/* KPI */}
      {/* ========================================= */}

      {showKpi && (
        <KpiResult
          rows={rows}
          kpiColumn={
            kpiColumn
          }
        />
      )}


      {/* ========================================= */}
      {/* CHART */}
      {/* ========================================= */}

      {showChart && (
        <ResultChart
          rows={rows}
          visual={
            resolvedVisual
          }
        />
      )}


      {/* ========================================= */}
      {/* RESULT TABLE */}
      {/* ========================================= */}

      {showTable && (
        <>
          <Box
            sx={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              mt:
                showKpi ||
                showChart
                  ? 2
                  : 0,

              mb: 1.25,
            }}
          >
            <Typography
              sx={{
                fontWeight:
                  700,

                fontSize:
                  "0.95rem",
              }}
            >
              Result Data
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color:
                  "text.secondary",
              }}
            >
              {rows.length}{" "}
              {rows.length === 1
                ? "row"
                : "rows"}
            </Typography>
          </Box>

          <ResultTable
            rows={rows}
          />
        </>
      )}


      {/* ========================================= */}
      {/* GENERATED QUERY */}
      {/* ========================================= */}

      {generatedQuery && (
        <details
          className=
            "query-details"
        >
          <summary>
            View generated SQL
          </summary>

          <pre
            className=
              "generated-query"
          >
            {generatedQuery}
          </pre>
        </details>
      )}


      {/* ========================================= */}
      {/* EXECUTION TIME */}
      {/* ========================================= */}

      {executionTime !== null &&
        executionTime !==
          undefined && (
          <div
            className=
              "analytics-execution-time"
          >
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