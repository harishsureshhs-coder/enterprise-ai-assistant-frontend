function normalizeColumnName(
  columnName
) {
  return String(
    columnName || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]/g,
      ""
    );
}


function isNumericValue(
  value
) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}


function isYearColumn(
  columnName
) {
  const normalized =
    normalizeColumnName(
      columnName
    );

  return [
    "year",
    "fiscalyear",
    "calendaryear",
  ].includes(
    normalized
  );
}


function isMonthColumn(
  columnName
) {
  const normalized =
    normalizeColumnName(
      columnName
    );

  return [
    "month",
    "monthnumber",
    "monthno",
    "monthnum",
    "fiscalmonth",
    "calendarmonth",
  ].includes(
    normalized
  );
}


function isDateLikeColumn(
  columnName
) {
  const normalized =
    normalizeColumnName(
      columnName
    );

  const keywords = [
    "date",
    "monthstart",
    "reportingdate",
    "postingdate",
    "period",
    "week",
    "quarter",
  ];

  return keywords.some(
    (keyword) =>
      normalized.includes(
        keyword
      )
  );
}


function getColumnInformation(
  rows
) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return {
      columns: [],
      numericColumns: [],
      textColumns: [],
      yearColumn: null,
      monthColumn: null,
      dateColumns: [],
    };
  }

  const columns =
    Object.keys(
      rows[0]
    );

  const numericColumns =
    columns.filter(
      (column) =>
        rows.some(
          (row) =>
            isNumericValue(
              row[column]
            )
        )
    );

  const textColumns =
    columns.filter(
      (column) =>
        rows.some((row) => {
          const value =
            row[column];

          return (
            typeof value === "string" ||
            value instanceof String
          );
        })
    );

  const yearColumn =
    columns.find(
      isYearColumn
    ) || null;

  const monthColumn =
    columns.find(
      isMonthColumn
    ) || null;

  const dateColumns =
    columns.filter(
      isDateLikeColumn
    );

  return {
    columns,
    numericColumns,
    textColumns,
    yearColumn,
    monthColumn,
    dateColumns,
  };
}


function getMeasureColumns(
  numericColumns,
  yearColumn,
  monthColumn
) {
  return numericColumns.filter(
    (column) =>
      column !== yearColumn &&
      column !== monthColumn
  );
}


function getSeriesCandidate(
  textColumns,
  categoryColumn
) {
  return (
    textColumns.find(
      (column) =>
        column !== categoryColumn
    ) || null
  );
}


export function determineVisualization(
  rows,
  visual
) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return {
      displayType: "NONE",
      chartType: null,
    };
  }

  const {
    columns,
    numericColumns,
    textColumns,
    yearColumn,
    monthColumn,
    dateColumns,
  } = getColumnInformation(
    rows
  );

  const measureColumns =
    getMeasureColumns(
      numericColumns,
      yearColumn,
      monthColumn
    );

  const requestedType =
    String(
      visual?.type || ""
    ).toLowerCase();

  const requestedCategory =
    visual?.category_column ||
    null;

  const requestedValue =
    visual?.value_column ||
    null;

  const requestedSeries =
    visual?.series_column ||
    null;


  // -----------------------------------------
  // KPI
  // -----------------------------------------

  if (
    rows.length === 1 &&
    columns.length === 1 &&
    numericColumns.length === 1
  ) {
    return {
      displayType: "KPI",
      chartType: null,
      kpiColumn:
        numericColumns[0],
    };
  }


  // -----------------------------------------
  // YEAR + MONTH trend
  // -----------------------------------------

  if (
    yearColumn &&
    monthColumn &&
    measureColumns.length > 0 &&
    rows.length > 1
  ) {
    const seriesColumn =
      requestedSeries ||
      getSeriesCandidate(
        textColumns,
        null
      );

    return {
      displayType:
        "CHART_TABLE",

      chartType:
        "line",

      timeMode:
        "YEAR_MONTH",

      yearColumn,
      monthColumn,

      categoryColumn:
        "__period_label",

      valueColumn:
        requestedValue &&
        measureColumns.includes(
          requestedValue
        )
          ? requestedValue
          : measureColumns[0],

      seriesColumn,
    };
  }


  // -----------------------------------------
  // Date-based trend
  // -----------------------------------------

  if (
    dateColumns.length > 0 &&
    measureColumns.length > 0 &&
    rows.length > 1
  ) {
    const categoryColumn =
      requestedCategory &&
      columns.includes(
        requestedCategory
      )
        ? requestedCategory
        : dateColumns[0];

    const seriesColumn =
      requestedSeries ||
      getSeriesCandidate(
        textColumns,
        categoryColumn
      );

    return {
      displayType:
        "CHART_TABLE",

      chartType:
        "line",

      categoryColumn,

      valueColumn:
        requestedValue &&
        measureColumns.includes(
          requestedValue
        )
          ? requestedValue
          : measureColumns[0],

      seriesColumn,
    };
  }


  // -----------------------------------------
  // Explicit table
  // -----------------------------------------

  if (
    requestedType === "table"
  ) {
    return {
      displayType: "TABLE",
      chartType: null,
    };
  }


  // -----------------------------------------
  // Detailed records
  // -----------------------------------------

  if (
    columns.length >= 5 &&
    textColumns.length >= 2
  ) {
    return {
      displayType: "TABLE",
      chartType: null,
    };
  }


  // -----------------------------------------
  // Explicit supported chart
  // -----------------------------------------

  const supportedCharts =
    new Set([
      "bar",
      "line",
      "pie",
      "scatter",
    ]);

  if (
    supportedCharts.has(
      requestedType
    ) &&
    rows.length > 1
  ) {
    const categoryColumn =
      requestedCategory ||
      textColumns[0] ||
      null;

    return {
      displayType:
        "CHART_TABLE",

      chartType:
        requestedType,

      categoryColumn,

      valueColumn:
        requestedValue ||
        measureColumns[0] ||
        numericColumns[0] ||
        null,

      seriesColumn:
        requestedSeries ||
        (
          requestedType === "line"
            ? getSeriesCandidate(
                textColumns,
                categoryColumn
              )
            : null
        ),
    };
  }


  // -----------------------------------------
  // Default category comparison
  // -----------------------------------------

  if (
    textColumns.length > 0 &&
    measureColumns.length > 0 &&
    rows.length > 1
  ) {
    return {
      displayType:
        "CHART_TABLE",

      chartType:
        "bar",

      categoryColumn:
        textColumns[0],

      valueColumn:
        measureColumns[0],

      seriesColumn:
        null,
    };
  }


  return {
    displayType: "TABLE",
    chartType: null,
  };
}