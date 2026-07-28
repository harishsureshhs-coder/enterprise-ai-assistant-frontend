import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./AnalyticsResult.css";

import {
  formatInrMillions,
  formatNumber,
  isMonetaryColumn,
} from "../../utils/numberFormat";


function findChartColumns(rows) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return null;
  }

  const columns =
    Object.keys(rows[0]);

  const categoryColumn =
    columns.find((column) =>
      rows.some((row) => {
        const value = row[column];

        return (
          typeof value === "string" ||
          value instanceof String
        );
      })
    );

  const numericColumns =
    columns.filter((column) =>
      rows.some((row) => {
        const value = row[column];

        return (
          typeof value === "number" &&
          Number.isFinite(value)
        );
      })
    );

  if (
    !categoryColumn ||
    numericColumns.length === 0
  ) {
    return null;
  }

  return {
    categoryColumn,
    valueColumn: numericColumns[0],
    secondValueColumn:
      numericColumns.length > 1
        ? numericColumns[1]
        : null,
  };
}


function getChartConfiguration(
  rows,
  visual
) {
  const fallback =
    findChartColumns(rows);

  if (!fallback) {
    return null;
  }

  const availableColumns =
    Object.keys(rows[0]);

  const requestedCategory =
    visual?.category_column;

  const requestedValue =
    visual?.value_column;

  const categoryColumn =
    availableColumns.includes(
      requestedCategory
    )
      ? requestedCategory
      : fallback.categoryColumn;

  const valueColumn =
    availableColumns.includes(
      requestedValue
    )
      ? requestedValue
      : fallback.valueColumn;

  const chartType =
    visual?.type || "bar";

  const allowedChartTypes =
    new Set([
      "bar",
      "line",
      "pie",
      "scatter",
      "kpi",
      "table",
    ]);

  return {
    type:
      allowedChartTypes.has(
        chartType
      )
        ? chartType
        : "bar",

    title:
      visual?.title ||
      `${valueColumn} by ${categoryColumn}`,

    categoryColumn,

    valueColumn,

    secondValueColumn:
      fallback.secondValueColumn,
  };
}


function formatAxisValue(value) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return value;
  }

  const absoluteValue =
    Math.abs(value);

  if (
    absoluteValue >=
    1_000_000_000
  ) {
    return `${(
      value /
      1_000_000_000
    ).toFixed(1)}B`;
  }

  if (
    absoluteValue >=
    1_000_000
  ) {
    return `${(
      value /
      1_000_000
    ).toFixed(1)}M`;
  }

  if (
    absoluteValue >=
    1_000
  ) {
    return `${(
      value /
      1_000
    ).toFixed(1)}K`;
  }

  return Number(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}


function formatTooltipValue(
  value
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return value;
  }

  return Number(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}


function buildChartRows(
  rows,
  categoryColumn,
  valueColumn,
  secondValueColumn
) {
  return rows
    .filter((row) => {
      const categoryValue =
        row[categoryColumn];

      const measureValue =
        row[valueColumn];

      return (
        categoryValue !== null &&
        categoryValue !== undefined &&
        typeof measureValue ===
          "number" &&
        Number.isFinite(
          measureValue
        )
      );
    })
    .map((row) => ({
      ...row,

      [categoryColumn]:
        String(
          row[categoryColumn]
        ),

      [valueColumn]:
        Number(
          row[valueColumn]
        ),

      ...(secondValueColumn &&
      typeof row[
        secondValueColumn
      ] === "number"
        ? {
            [secondValueColumn]:
              Number(
                row[
                  secondValueColumn
                ]
              ),
          }
        : {}),
    }));
}


function BarVisualization({
  chartRows,
  categoryColumn,
  valueColumn,
}) {
  const useHorizontalLayout =
    chartRows.length >= 6;

  if (useHorizontalLayout) {
    return (
      <ResponsiveContainer
        width="100%"
        height={Math.max(
          360,
          chartRows.length * 34
        )}
      >
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{
            top: 10,
            right: 30,
            left: 80,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            type="number"
            tickFormatter={
              formatAxisValue
            }
          />

          <YAxis
            type="category"
            dataKey={
              categoryColumn
            }
            width={120}
            interval={0}
          />

          <Tooltip
            formatter={
              formatTooltipValue
            }
          />

         <Bar
  dataKey={valueColumn}
  name={valueColumn}
  fill="#3F7FC4"
  barSize={16}
  radius={[0, 5, 5, 0]}
/>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={340}
    >
      <BarChart
        data={chartRows}
        margin={{
          top: 10,
          right: 20,
          left: 20,
          bottom: 70,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey={
            categoryColumn
          }
          angle={-35}
          textAnchor="end"
          interval={0}
          height={90}
        />

        <YAxis
          tickFormatter={
            formatAxisValue
          }
        />

        <Tooltip
          formatter={
            formatTooltipValue
          }
        />

        <Bar
  dataKey={valueColumn}
  name={valueColumn}
  fill="#3F7FC4"
  barSize={22}
  radius={[5, 5, 0, 0]}
/>
      </BarChart>
    </ResponsiveContainer>
  );
}


function LineVisualization({
  chartRows,
  categoryColumn,
  valueColumn,
}) {
  return (
    <ResponsiveContainer
      width="100%"
      height={340}
    >
      <LineChart
        data={chartRows}
        margin={{
          top: 10,
          right: 20,
          left: 20,
          bottom: 45,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey={
            categoryColumn
          }
          interval={0}
          angle={-25}
          textAnchor="end"
          height={70}
        />

        <YAxis
          tickFormatter={
            formatAxisValue
          }
        />

        <Tooltip
          formatter={
            formatTooltipValue
          }
        />

        <Legend />

        <Line
          type="monotone"
          dataKey={
            valueColumn
          }
          name={
            valueColumn
          }
          strokeWidth={2}
          dot={{
            r: 3,
          }}
          activeDot={{
            r: 5,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}


function PieVisualization({
  chartRows,
  categoryColumn,
  valueColumn,
}) {
  const pieRows =
    chartRows.slice(0, 6);

  return (
    <ResponsiveContainer
      width="100%"
      height={340}
    >
      <PieChart>
        <Tooltip
          formatter={
            formatTooltipValue
          }
        />

        <Legend />

        <Pie
          data={pieRows}
          dataKey={
            valueColumn
          }
          nameKey={
            categoryColumn
          }
          cx="50%"
          cy="50%"
          outerRadius={110}
          label
        />
      </PieChart>
    </ResponsiveContainer>
  );
}


function ScatterVisualization({
  chartRows,
  categoryColumn,
  valueColumn,
  secondValueColumn,
}) {
  if (
    !secondValueColumn
  ) {
    return null;
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={340}
    >
      <ScatterChart
        margin={{
          top: 10,
          right: 20,
          left: 20,
          bottom: 25,
        }}
      >
        <CartesianGrid />

        <XAxis
          type="number"
          dataKey={
            valueColumn
          }
          name={
            valueColumn
          }
          tickFormatter={
            formatAxisValue
          }
        />

        <YAxis
          type="number"
          dataKey={
            secondValueColumn
          }
          name={
            secondValueColumn
          }
          tickFormatter={
            formatAxisValue
          }
        />

        <Tooltip
          formatter={
            formatTooltipValue
          }
          cursor={{
            strokeDasharray:
              "3 3",
          }}
        />

        <Scatter
          name={
            categoryColumn
          }
          data={
            chartRows
          }
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}


function ResultChart({
  rows,
  visual,
}) {
  const chartConfiguration =
    getChartConfiguration(
      rows,
      visual
    );

  if (
    !chartConfiguration
  ) {
    return null;
  }

  const {
    type,
    title,
    categoryColumn,
    valueColumn,
    secondValueColumn,
  } = chartConfiguration;

  if (
    type === "table" ||
    type === "kpi"
  ) {
    return null;
  }

  const chartRows =
    buildChartRows(
      rows,
      categoryColumn,
      valueColumn,
      secondValueColumn
    ).slice(0, 20);

  if (
    chartRows.length < 2
  ) {
    return null;
  }

  return (
    <div className="result-chart">

      <div className="analytics-section-title">
        {title}
      </div>

      {type === "bar" && (
        <BarVisualization
          chartRows={
            chartRows
          }
          categoryColumn={
            categoryColumn
          }
          valueColumn={
            valueColumn
          }
        />
      )}

      {type === "line" && (
        <LineVisualization
          chartRows={
            chartRows
          }
          categoryColumn={
            categoryColumn
          }
          valueColumn={
            valueColumn
          }
        />
      )}

      {type === "pie" && (
        <PieVisualization
          chartRows={
            chartRows
          }
          categoryColumn={
            categoryColumn
          }
          valueColumn={
            valueColumn
          }
        />
      )}

      {type === "scatter" && (
        <ScatterVisualization
          chartRows={
            chartRows
          }
          categoryColumn={
            categoryColumn
          }
          valueColumn={
            valueColumn
          }
          secondValueColumn={
            secondValueColumn
          }
        />
      )}

    </div>
  );
}


export default ResultChart;