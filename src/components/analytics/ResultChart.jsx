import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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


/*
 * =====================================================
 * VISUAL THEME
 * =====================================================
 */

// Normal business metrics use blue.
const PRIMARY_BLUE =
  "#1976D2";


// Multiple lines need distinct colors.
// Red is intentionally avoided as a normal-series color
// because red is usually interpreted as an alert.
const SERIES_COLORS = [
  "#1565C0",
  "#00897B",
  "#5E35B1",
  "#43A047",
  "#F9A825",
  "#00ACC1",
  "#3949AB",
  "#7CB342",
];


// Pie chart requires clearly distinguishable slices.
const PIE_COLORS = [
  "#0D47A1",
  "#1976D2",
  "#42A5F5",
  "#00897B",
  "#5E35B1",
  "#F9A825",
  "#00ACC1",
  "#7CB342",
];


/*
 * =====================================================
 * COLUMN HELPERS
 * =====================================================
 */

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

  return (
    normalized.includes(
      "date"
    ) ||
    normalized.includes(
      "period"
    ) ||
    normalized.includes(
      "week"
    ) ||
    normalized.includes(
      "quarter"
    ) ||
    normalized.includes(
      "monthstart"
    )
  );
}


/*
 * =====================================================
 * PERIOD FORMATTING
 * =====================================================
 */

function formatPeriodLabel(
  year,
  month
) {
  const numericYear =
    Number(year);

  const numericMonth =
    Number(month);

  if (
    !Number.isFinite(
      numericYear
    ) ||
    !Number.isFinite(
      numericMonth
    )
  ) {
    return "";
  }

  return (
    `${Math.trunc(
      numericYear
    )}-${String(
      Math.trunc(
        numericMonth
      )
    ).padStart(
      2,
      "0"
    )}`
  );
}


function formatTooltipPeriod(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const cleanValue =
    String(value).trim();


  /*
   * 2026-07
   * becomes
   * Jul 2026
   */

  const yearMonthMatch =
    cleanValue.match(
      /^(\d{4})-(\d{2})$/
    );

  if (
    yearMonthMatch
  ) {
    const year =
      Number(
        yearMonthMatch[1]
      );

    const month =
      Number(
        yearMonthMatch[2]
      );

    if (
      month >= 1 &&
      month <= 12
    ) {
      const date =
        new Date(
          year,
          month - 1,
          1
        );

      return (
        date.toLocaleDateString(
          "en-GB",
          {
            month:
              "short",

            year:
              "numeric",
          }
        )
      );
    }
  }


  /*
   * 2026-08-06
   * becomes
   * 06 Aug 2026
   */

  const fullDateMatch =
    cleanValue.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (
    fullDateMatch
  ) {
    const year =
      Number(
        fullDateMatch[1]
      );

    const month =
      Number(
        fullDateMatch[2]
      );

    const day =
      Number(
        fullDateMatch[3]
      );

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    return (
      date.toLocaleDateString(
        "en-GB",
        {
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",
        }
      )
    );
  }


  /*
   * If only month number is present,
   * do NOT interpret it as a JavaScript date.
   */

  if (
    /^\d{1,2}$/.test(
      cleanValue
    )
  ) {
    return (
      `Month ${cleanValue}`
    );
  }


  return cleanValue;
}


/*
 * =====================================================
 * INR FORMATTING
 * =====================================================
 */

function formatInrMillions(
  value
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return String(
      value ?? "-"
    );
  }

  const millions =
    numericValue /
    1_000_000;

  return (
    `₹${millions.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    )} Mn`
  );
}


function formatAxisValue(
  value
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return value;
  }

  const millions =
    numericValue /
    1_000_000;

  return (
    `${millions.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          1,
      }
    )}M`
  );
}


function formatDataLabel(
  value
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return "";
  }

  const millions =
    numericValue /
    1_000_000;

  return (
    `₹${millions.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          0,
      }
    )}M`
  );
}


/*
 * =====================================================
 * ENTERPRISE TOOLTIP
 * =====================================================
 */

function CustomTooltip({
  active,
  payload,
  label,
  showTotal = true,
}) {
  if (
    !active ||
    !Array.isArray(payload) ||
    payload.length === 0
  ) {
    return null;
  }

  const validPayload =
    payload.filter(
      (item) =>
        item?.value !== null &&
        item?.value !== undefined &&
        Number.isFinite(
          Number(
            item.value
          )
        )
    );

  if (
    validPayload.length === 0
  ) {
    return null;
  }

  const total =
    validPayload.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.value
        ),
      0
    );

  return (
    <div
      style={{
        minWidth:
          "220px",

        padding:
          "12px 14px",

        background:
          "#ffffff",

        border:
          "1px solid #dbe5f1",

        borderRadius:
          "10px",

        boxShadow:
          "0 8px 24px rgba(15, 23, 42, 0.14)",

        fontSize:
          "12px",
      }}
    >

      <div
        style={{
          fontWeight:
            700,

          fontSize:
            "13px",

          color:
            "#0f172a",

          paddingBottom:
            "8px",

          marginBottom:
            "8px",

          borderBottom:
            "1px solid #e5e7eb",
        }}
      >
        {formatTooltipPeriod(
          label
        )}
      </div>


      {validPayload.map(
        (
          item,
          index
        ) => {
          const seriesName =
            item?.name ||
            item?.dataKey ||
            "Value";

          return (
            <div
              key={
                `${seriesName}-${index}`
              }
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap:
                  "22px",

                padding:
                  "4px 0",
              }}
            >

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "7px",

                  color:
                    "#475569",
                }}
              >

                <span
                  style={{
                    width:
                      "8px",

                    height:
                      "8px",

                    borderRadius:
                      "50%",

                    background:
                      item?.color ||
                      item?.stroke ||
                      PRIMARY_BLUE,

                    display:
                      "inline-block",
                  }}
                />

                <span>
                  {
                    seriesName
                  }
                </span>

              </div>


              <span
                style={{
                  fontWeight:
                    700,

                  color:
                    "#0f172a",

                  whiteSpace:
                    "nowrap",
                }}
              >
                {formatInrMillions(
                  item.value
                )}
              </span>

            </div>
          );
        }
      )}


      {showTotal &&
        validPayload.length >
          1 && (
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              gap:
                "22px",

              marginTop:
                "8px",

              paddingTop:
                "9px",

              borderTop:
                "1px solid #e5e7eb",
            }}
          >

            <span
              style={{
                fontWeight:
                  700,

                color:
                  "#334155",
              }}
            >
              Total
            </span>


            <span
              style={{
                fontWeight:
                  700,

                color:
                  "#0f172a",

                whiteSpace:
                  "nowrap",
              }}
            >
              {formatInrMillions(
                total
              )}
            </span>

          </div>
        )}

    </div>
  );
}


/*
 * =====================================================
 * CONFIGURATION
 * =====================================================
 */

function getChartConfiguration(
  rows,
  visual
) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return null;
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
            typeof row[column] ===
              "number" &&
            Number.isFinite(
              row[column]
            )
        )
    );

  const textColumns =
    columns.filter(
      (column) =>
        rows.some(
          (row) =>
            typeof row[column] ===
            "string"
        )
    );

  const yearColumn =
    visual?.year_column ||
    columns.find(
      isYearColumn
    ) ||
    null;

  const monthColumn =
    visual?.month_column ||
    columns.find(
      isMonthColumn
    ) ||
    null;

  const dateColumn =
    columns.find(
      isDateLikeColumn
    ) ||
    null;

  const measureColumns =
    numericColumns.filter(
      (column) =>
        column !==
          yearColumn &&
        column !==
          monthColumn
    );

  const hasYearMonth =
    Boolean(
      yearColumn &&
      monthColumn
    );

  const timeMode =
    hasYearMonth
      ? "YEAR_MONTH"
      : visual?.time_mode ||
        null;


  let categoryColumn =
    null;

  if (
    timeMode ===
    "YEAR_MONTH"
  ) {
    categoryColumn =
      "__period_label";

  } else if (
    visual?.category_column &&
    columns.includes(
      visual.category_column
    )
  ) {
    categoryColumn =
      visual.category_column;

  } else if (
    dateColumn
  ) {
    categoryColumn =
      dateColumn;

  } else {
    categoryColumn =
      textColumns[0] ||
      columns[0] ||
      null;
  }


  const valueColumn =
    (
      visual?.value_column &&
      columns.includes(
        visual.value_column
      )
    )
      ? visual.value_column
      : measureColumns[0] ||
        numericColumns[0] ||
        null;


  let seriesColumn =
    null;

  if (
    visual?.series_column &&
    columns.includes(
      visual.series_column
    )
  ) {
    seriesColumn =
      visual.series_column;

  } else {
    seriesColumn =
      textColumns.find(
        (column) =>
          column !==
          categoryColumn
      ) ||
      null;
  }


  if (
    !categoryColumn ||
    !valueColumn
  ) {
    return null;
  }


  let chartType =
    String(
      visual?.type ||
      ""
    ).toLowerCase();


  /*
   * Time based data should use
   * a line chart.
   */

  if (
    timeMode ===
      "YEAR_MONTH" ||
    dateColumn
  ) {
    chartType =
      "line";
  }


  const supportedTypes =
    new Set([
      "bar",
      "line",
      "pie",
      "scatter",
    ]);


  if (
    !supportedTypes.has(
      chartType
    )
  ) {
    chartType =
      "bar";
  }


  return {
    type:
      chartType,

    title:
      visual?.title ||
      (
        seriesColumn
          ? `${valueColumn} by ${seriesColumn}`
          : `${valueColumn} Analysis`
      ),

    categoryColumn,

    valueColumn,

    seriesColumn,

    timeMode,

    yearColumn,

    monthColumn,
  };
}


/*
 * =====================================================
 * SORTING
 * =====================================================
 */

function toSortableValue(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return (
      Number
        .POSITIVE_INFINITY
    );
  }


  if (
    typeof value ===
    "number"
  ) {
    return value;
  }


  const text =
    String(
      value
    ).trim();


  const yearMonth =
    text.match(
      /^(\d{4})-(\d{2})$/
    );


  if (
    yearMonth
  ) {
    return (
      Number(
        yearMonth[1]
      ) *
        100 +
      Number(
        yearMonth[2]
      )
    );
  }


  const parsedDate =
    Date.parse(
      text
    );


  if (
    !Number.isNaN(
      parsedDate
    )
  ) {
    return parsedDate;
  }


  return text;
}


function sortRowsByCategory(
  rows,
  categoryColumn
) {
  return [
    ...rows,
  ].sort(
    (
      first,
      second
    ) => {
      const firstValue =
        toSortableValue(
          first[
            categoryColumn
          ]
        );

      const secondValue =
        toSortableValue(
          second[
            categoryColumn
          ]
        );


      if (
        typeof firstValue ===
          "number" &&
        typeof secondValue ===
          "number"
      ) {
        return (
          firstValue -
          secondValue
        );
      }


      return String(
        firstValue
      ).localeCompare(
        String(
          secondValue
        ),
        undefined,
        {
          numeric:
            true,
        }
      );
    }
  );
}


/*
 * =====================================================
 * BASE DATA
 * =====================================================
 */

function buildBaseChartRows(
  rows,
  configuration
) {
  const {
    categoryColumn,
    valueColumn,
    timeMode,
    yearColumn,
    monthColumn,
  } = configuration;


  return rows
    .map(
      (row) => {
        let categoryValue =
          row[
            categoryColumn
          ];


        if (
          timeMode ===
            "YEAR_MONTH" &&
          yearColumn &&
          monthColumn
        ) {
          categoryValue =
            formatPeriodLabel(
              row[
                yearColumn
              ],
              row[
                monthColumn
              ]
            );
        }


        return {
          ...row,

          [categoryColumn]:
            String(
              categoryValue ??
              ""
            ),

          [valueColumn]:
            Number(
              row[
                valueColumn
              ]
            ),
        };
      }
    )

    .filter(
      (row) =>
        row[
          categoryColumn
        ] !== "" &&
        Number.isFinite(
          row[
            valueColumn
          ]
        )
    );
}


/*
 * =====================================================
 * MULTI-SERIES
 * =====================================================
 */

function buildMultiSeriesRows(
  rows,
  categoryColumn,
  valueColumn,
  seriesColumn
) {
  const grouped =
    new Map();

  const seriesSet =
    new Set();


  for (
    const row
    of rows
  ) {
    const category =
      row[
        categoryColumn
      ];

    const series =
      row[
        seriesColumn
      ];

    const value =
      Number(
        row[
          valueColumn
        ]
      );


    if (
      category === null ||
      category === undefined ||
      series === null ||
      series === undefined ||
      !Number.isFinite(
        value
      )
    ) {
      continue;
    }


    const categoryKey =
      String(
        category
      );

    const seriesKey =
      String(
        series
      );


    seriesSet.add(
      seriesKey
    );


    if (
      !grouped.has(
        categoryKey
      )
    ) {
      grouped.set(
        categoryKey,
        {
          [categoryColumn]:
            categoryKey,
        }
      );
    }


    const groupedRow =
      grouped.get(
        categoryKey
      );


    groupedRow[
      seriesKey
    ] =
      (
        groupedRow[
          seriesKey
        ] || 0
      ) +
      value;
  }


  return {
    chartRows:
      sortRowsByCategory(
        Array.from(
          grouped.values()
        ),
        categoryColumn
      ),

    seriesValues:
      Array.from(
        seriesSet
      ).sort(
        (
          first,
          second
        ) =>
          String(
            first
          ).localeCompare(
            String(
              second
            ),
            undefined,
            {
              numeric:
                true,
            }
          )
      ),
  };
}


/*
 * =====================================================
 * LINE
 * =====================================================
 */

function LineVisualization({
  chartRows,
  categoryColumn,
  valueColumn,
  seriesValues = [],
}) {
  const multiSeries =
    seriesValues.length >
    0;

  const showLabels =
    chartRows.length <=
      12 &&
    (
      !multiSeries ||
      seriesValues.length <=
        4
    );


  return (
    <ResponsiveContainer
      width="100%"
      height={420}
    >

      <LineChart
        data={
          chartRows
        }
        margin={{
          top:
            35,
          right:
            35,
          left:
            30,
          bottom:
            60,
        }}
      >

        <CartesianGrid
          strokeDasharray=
            "2 4"
          stroke=
            "#E5E7EB"
          opacity={
            0.7
          }
          vertical={
            false
          }
        />


        <XAxis
          dataKey={
            categoryColumn
          }
          interval=
            "preserveStartEnd"
          angle={
            -20
          }
          textAnchor=
            "end"
          height={
            70
          }
        />


        <YAxis
          tickFormatter={
            formatAxisValue
          }
        />


        <Tooltip
          content={
            <CustomTooltip />
          }
        />


        <Legend
          verticalAlign=
            "bottom"
          height={
            36
          }
        />


        {multiSeries
          ? seriesValues.map(
              (
                seriesName,
                index
              ) => {
                const color =
                  SERIES_COLORS[
                    index %
                      SERIES_COLORS.length
                  ];


                return (
                  <Line
                    key={
                      seriesName
                    }
                    type=
                      "monotone"
                    dataKey={
                      seriesName
                    }
                    name={
                      seriesName
                    }
                    stroke={
                      color
                    }
                    strokeWidth={
                      2.5
                    }
                    connectNulls
                    dot={{
                      r:
                        3.5,

                      fill:
                        "#ffffff",

                      stroke:
                        color,

                      strokeWidth:
                        2,
                    }}
                    activeDot={{
                      r:
                        5.5,
                    }}
                  >

                    {showLabels && (
                      <LabelList
                        dataKey={
                          seriesName
                        }
                        position={
                          index %
                            2 ===
                          0
                            ? "top"
                            : "bottom"
                        }
                        offset={
                          8
                        }
                        formatter={
                          formatDataLabel
                        }
                        style={{
                          fontSize:
                            "10px",

                          fontWeight:
                            600,

                          fill:
                            color,
                        }}
                      />
                    )}

                  </Line>
                );
              }
            )

          : (
              <Line
                type=
                  "monotone"
                dataKey={
                  valueColumn
                }
                name={
                  valueColumn
                }
                stroke={
                  PRIMARY_BLUE
                }
                strokeWidth={
                  2.5
                }
                connectNulls
                dot={{
                  r:
                    3.5,

                  fill:
                    "#ffffff",

                  stroke:
                    PRIMARY_BLUE,

                  strokeWidth:
                    2,
                }}
                activeDot={{
                  r:
                    5.5,
                }}
              >

                {showLabels && (
                  <LabelList
                    dataKey={
                      valueColumn
                    }
                    position=
                      "top"
                    offset={
                      8
                    }
                    formatter={
                      formatDataLabel
                    }
                    style={{
                      fontSize:
                        "10px",

                      fontWeight:
                        600,

                      fill:
                        PRIMARY_BLUE,
                    }}
                  />
                )}

              </Line>
            )}

      </LineChart>

    </ResponsiveContainer>
  );
}


/*
 * =====================================================
 * BAR / COLUMN
 * =====================================================
 */

function BarVisualization({
  chartRows,
  categoryColumn,
  valueColumn,
}) {
  const horizontal =
    chartRows.length >=
    6;


  if (
    horizontal
  ) {
    return (
      <ResponsiveContainer
        width="100%"
        height={Math.max(
          350,
          chartRows.length *
            34
        )}
      >

        <BarChart
          data={
            chartRows
          }
          layout=
            "vertical"
          margin={{
            top:
              10,
            right:
              60,
            left:
              80,
            bottom:
              10,
          }}
        >

          <CartesianGrid
            strokeDasharray=
              "2 4"
            stroke=
              "#E5E7EB"
            opacity={
              0.7
            }
            horizontal={
              false
            }
          />


          <XAxis
            type=
              "number"
            tickFormatter={
              formatAxisValue
            }
          />


          <YAxis
            type=
              "category"
            dataKey={
              categoryColumn
            }
            width={
              120
            }
            interval={
              0
            }
          />


          <Tooltip
            content={
              <CustomTooltip
                showTotal={
                  false
                }
              />
            }
          />


          <Bar
            dataKey={
              valueColumn
            }
            name={
              valueColumn
            }
            fill={
              PRIMARY_BLUE
            }
            barSize={
              18
            }
            radius={[
              0,
              5,
              5,
              0,
            ]}
          >

            {chartRows.length <=
              12 && (
              <LabelList
                dataKey={
                  valueColumn
                }
                position=
                  "right"
                formatter={
                  formatDataLabel
                }
                style={{
                  fontSize:
                    "10px",

                  fontWeight:
                    600,

                  fill:
                    "#334155",
                }}
              />
            )}

          </Bar>

        </BarChart>

      </ResponsiveContainer>
    );
  }


  return (
    <ResponsiveContainer
      width="100%"
      height={370}
    >

      <BarChart
        data={
          chartRows
        }
        margin={{
          top:
            35,
          right:
            20,
          left:
            25,
          bottom:
            65,
        }}
      >

        <CartesianGrid
          strokeDasharray=
            "2 4"
          stroke=
            "#E5E7EB"
          opacity={
            0.7
          }
          vertical={
            false
          }
        />


        <XAxis
          dataKey={
            categoryColumn
          }
          interval={
            0
          }
          angle={
            -25
          }
          textAnchor=
            "end"
          height={
            75
          }
        />


        <YAxis
          tickFormatter={
            formatAxisValue
          }
        />


        <Tooltip
          content={
            <CustomTooltip
              showTotal={
                false
              }
            />
          }
        />


        <Bar
          dataKey={
            valueColumn
          }
          name={
            valueColumn
          }
          fill={
            PRIMARY_BLUE
          }
          barSize={
            24
          }
          radius={[
            5,
            5,
            0,
            0,
          ]}
        >

          {chartRows.length <=
            12 && (
            <LabelList
              dataKey={
                valueColumn
              }
              position=
                "top"
              formatter={
                formatDataLabel
              }
              style={{
                fontSize:
                  "10px",

                fontWeight:
                  600,

                fill:
                  "#334155",
              }}
            />
          )}

        </Bar>

      </BarChart>

    </ResponsiveContainer>
  );
}


/*
 * =====================================================
 * PIE
 * =====================================================
 */

function PieVisualization({
  chartRows,
  categoryColumn,
  valueColumn,
}) {
  const pieRows =
    chartRows.slice(
      0,
      8
    );


  return (
    <ResponsiveContainer
      width="100%"
      height={390}
    >

      <PieChart>

        <Tooltip
          content={
            <CustomTooltip
              showTotal={
                false
              }
            />
          }
        />


        <Legend
          verticalAlign=
            "bottom"
          height={
            40
          }
        />


        <Pie
          data={
            pieRows
          }
          dataKey={
            valueColumn
          }
          nameKey={
            categoryColumn
          }
          cx=
            "50%"
          cy=
            "48%"
          innerRadius={
            55
          }
          outerRadius={
            115
          }
          paddingAngle={
            2
          }
          label={({
            name,
            percent,
          }) =>
            (
              `${name} ${(
                (
                  percent ||
                  0
                ) *
                100
              ).toFixed(
                1
              )}%`
            )
          }
          labelLine={
            true
          }
        >

          {pieRows.map(
            (
              row,
              index
            ) => (
              <Cell
                key={
                  `${row[
                    categoryColumn
                  ]}-${index}`
                }
                fill={
                  PIE_COLORS[
                    index %
                      PIE_COLORS.length
                  ]
                }
              />
            )
          )}

        </Pie>

      </PieChart>

    </ResponsiveContainer>
  );
}


/*
 * =====================================================
 * SCATTER
 * =====================================================
 */

function ScatterVisualization({
  chartRows,
  valueColumn,
}) {
  const numericColumns =
    Object.keys(
      chartRows[0] ||
      {}
    ).filter(
      (column) =>
        chartRows.some(
          (row) =>
            typeof row[column] ===
            "number"
        )
    );


  const secondValueColumn =
    numericColumns.find(
      (column) =>
        column !==
        valueColumn
    );


  if (
    !secondValueColumn
  ) {
    return null;
  }


  return (
    <ResponsiveContainer
      width="100%"
      height={370}
    >

      <ScatterChart>

        <CartesianGrid
          strokeDasharray=
            "2 4"
          stroke=
            "#E5E7EB"
        />


        <XAxis
          type=
            "number"
          dataKey={
            valueColumn
          }
          tickFormatter={
            formatAxisValue
          }
        />


        <YAxis
          type=
            "number"
          dataKey={
            secondValueColumn
          }
          tickFormatter={
            formatAxisValue
          }
        />


        <Tooltip
          content={
            <CustomTooltip
              showTotal={
                false
              }
            />
          }
        />


        <Scatter
          data={
            chartRows
          }
          fill={
            PRIMARY_BLUE
          }
        />

      </ScatterChart>

    </ResponsiveContainer>
  );
}


/*
 * =====================================================
 * MAIN COMPONENT
 * =====================================================
 */

function ResultChart({
  rows,
  visual,
}) {
  const configuration =
    getChartConfiguration(
      rows,
      visual
    );


  if (
    !configuration
  ) {
    return null;
  }


  const {
    type,
    title,
    categoryColumn,
    valueColumn,
    seriesColumn,
  } = configuration;


  const baseRows =
    buildBaseChartRows(
      rows,
      configuration
    );


  if (
    baseRows.length <
    2
  ) {
    return null;
  }


  let chartRows =
    sortRowsByCategory(
      baseRows,
      categoryColumn
    );


  let seriesValues =
    [];


  if (
    type === "line" &&
    seriesColumn
  ) {
    const multiSeries =
      buildMultiSeriesRows(
        baseRows,
        categoryColumn,
        valueColumn,
        seriesColumn
      );


    chartRows =
      multiSeries
        .chartRows;


    seriesValues =
      multiSeries
        .seriesValues;
  }


  return (
    <div
      className=
        "result-chart"
    >

      <div
        className=
          "analytics-section-title"
      >
        {title}
      </div>


      {type ===
        "line" && (
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
          seriesValues={
            seriesValues
          }
        />
      )}


      {type ===
        "bar" && (
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


      {type ===
        "pie" && (
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


      {type ===
        "scatter" && (
        <ScatterVisualization
          chartRows={
            chartRows
          }
          valueColumn={
            valueColumn
          }
        />
      )}

    </div>
  );
}


export default ResultChart;