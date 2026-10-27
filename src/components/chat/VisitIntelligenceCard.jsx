import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPreviousCustomerVisits,
  getVisitIntelligenceById,
} from "../../services/visitIntelligenceApi";


function parseVisitDate(
  value
) {
  if (!value) {
    return null;
  }

  const normalized =
    typeof value === "string"
      ? value.replace(
          " ",
          "T"
        )
      : value;

  const date =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}


function formatVisitDate(
  value
) {
  const date =
    parseVisitDate(
      value
    );

  if (!date) {
    return (
      value
        ? String(value)
        : "-"
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
    }
  );
}


function formatVisitDateTime(
  value
) {
  const date =
    parseVisitDate(
      value
    );

  if (!date) {
    return (
      value
        ? String(value)
        : "-"
    );
  }

  return date.toLocaleString(
    "en-IN",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  );
}


function formatDuration(
  startValue,
  endValue
) {
  const start =
    parseVisitDate(
      startValue
    );

  const end =
    parseVisitDate(
      endValue
    );

  if (
    !start ||
    !end
  ) {
    return null;
  }

  const differenceMs =
    end.getTime()
    - start.getTime();

  if (
    differenceMs <= 0
  ) {
    return null;
  }

  const totalMinutes =
    Math.max(
      1,
      Math.round(
        differenceMs /
        60000
      )
    );

  const hours =
    Math.floor(
      totalMinutes /
      60
    );

  const minutes =
    totalMinutes %
    60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return (
    `${hours} hr `
    + `${minutes} min`
  );
}


function InsightSection({
  title,
  items,
}) {
  if (
    !Array.isArray(
      items
    ) ||
    items.length === 0
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 2.25,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          mb: 0.75,
        }}
      >
        {title}
      </Typography>

      <Box
        component="ul"
        sx={{
          m: 0,
          pl: 2.5,
        }}
      >
        {items.map(
          (
            item,
            index
          ) => (
            <Typography
              component="li"
              key={
                `${title}-${index}`
              }
              sx={{
                mb: 0.5,
                lineHeight: 1.6,
              }}
            >
              {String(
                item
              )}
            </Typography>
          )
        )}
      </Box>
    </Box>
  );
}


function MetadataItem({
  label,
  value,
}) {
  if (
    value === null ||
    value === undefined ||
    String(
      value
    ).trim() === ""
  ) {
    return null;
  }

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display:
            "block",
          color:
            "text.secondary",
          mb: 0.25,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontWeight: 600,
          wordBreak:
            "break-word",
        }}
      >
        {String(
          value
        )}
      </Typography>
    </Box>
  );
}


function PreviousVisitRow({
  visit,
  isLoading,
  onOpen,
}) {
  return (
    <Box
      sx={{
        display:
          "grid",

        gridTemplateColumns: {
          xs:
            "1fr",
          md:
            "180px minmax(180px, 1fr) minmax(160px, 1fr) auto",
        },

        gap: 1.5,

        alignItems:
          "center",

        py: 1.5,

        borderBottom:
          "1px solid",

        borderColor:
          "divider",
      }}
    >
      <Box>
        <Typography
          variant="caption"
          sx={{
            color:
              "text.secondary",
          }}
        >
          Visit Date
        </Typography>

        <Typography
          sx={{
            fontWeight: 600,
          }}
        >
          {
            formatVisitDateTime(
              visit.visit_date ||
              visit.visit_started_at
            )
          }
        </Typography>
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{
            color:
              "text.secondary",
          }}
        >
          Visited By
        </Typography>

        <Typography
          sx={{
            fontWeight: 600,
            wordBreak:
              "break-word",
          }}
        >
          {
            visit.visited_by ||
            "-"
          }
        </Typography>
      </Box>

      <Box>
        <Typography
          variant="caption"
          sx={{
            color:
              "text.secondary",
          }}
        >
          Sales Office
        </Typography>

        <Typography
          sx={{
            fontWeight: 600,
          }}
        >
          {
            visit.sales_office_name ||
            visit.sales_office_code ||
            "-"
          }
        </Typography>
      </Box>

      <Button
        size="small"
        variant="outlined"
        disabled={
          isLoading
        }
        onClick={
          () =>
            onOpen(
              visit
            )
        }
      >
        {
          isLoading
            ? "Loading..."
            : "View Visit"
        }
      </Button>
    </Box>
  );
}


function VisitIntelligenceCard({
  data,
  suggestions = [],
  onSuggestionClick,
}) {
  const latestVisitId =
    data?.visit_id ??
    null;

  const [
    activeData,
    setActiveData,
  ] = useState(
    data
  );

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(
    false
  );

  const [
    historyLoaded,
    setHistoryLoaded,
  ] = useState(
    false
  );

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(
    false
  );

  const [
    previousVisits,
    setPreviousVisits,
  ] = useState(
    []
  );

  const [
    historyError,
    setHistoryError,
  ] = useState(
    null
  );

  const [
    selectedVisitLoadingId,
    setSelectedVisitLoadingId,
  ] = useState(
    null
  );


  useEffect(
    () => {
      setActiveData(
        data
      );

      setHistoryOpen(
        false
      );

      setHistoryLoaded(
        false
      );

      setPreviousVisits(
        []
      );

      setHistoryError(
        null
      );

      setSelectedVisitLoadingId(
        null
      );
    },
    [
      data?.visit_id,
    ]
  );


  const isLatestVisit =
    (
      activeData?.visit_id &&
      latestVisitId &&
      String(
        activeData.visit_id
      ) ===
      String(
        latestVisitId
      )
    );


  const visitDuration =
    useMemo(
      () =>
        formatDuration(
          activeData
            ?.visit_started_at,
          activeData
            ?.visit_completed_at
        ),
      [
        activeData
          ?.visit_started_at,
        activeData
          ?.visit_completed_at,
      ]
    );


  if (
    !activeData ||
    typeof activeData !==
      "object"
  ) {
    return null;
  }


  const customerName =
    activeData.customer_name ||
    activeData.customer_code ||
    "Customer";


  async function loadPreviousVisits() {
    if (
      historyLoaded ||
      historyLoading
    ) {
      return;
    }

    setHistoryLoading(
      true
    );

    setHistoryError(
      null
    );

    try {
      const visits =
        await getPreviousCustomerVisits({
          customerCode:
            data?.customer_code,

          currentVisitId:
            latestVisitId,

          limit:
            5,
        });

      setPreviousVisits(
        visits
      );

      setHistoryLoaded(
        true
      );

    } catch (error) {

      setHistoryError(
        error instanceof Error
          ? error.message
          : "Unable to load previous visits."
      );

    } finally {

      setHistoryLoading(
        false
      );
    }
  }


  async function handleToggleHistory() {
    const nextOpen =
      !historyOpen;

    setHistoryOpen(
      nextOpen
    );

    if (nextOpen) {
      await loadPreviousVisits();
    }
  }


  async function handleOpenPreviousVisit(
    visit
  ) {
    const visitId =
      visit?.visit_id;

    if (!visitId) {
      return;
    }

    setSelectedVisitLoadingId(
      visitId
    );

    setHistoryError(
      null
    );

    try {
      const historicalVisit =
        await getVisitIntelligenceById({
          visitId:
            visitId,

          customerCode:
            data?.customer_code,
        });

      if (!historicalVisit) {
        throw new Error(
          "The selected visit did not return Visit Intelligence."
        );
      }

      setActiveData(
        historicalVisit
      );

      setHistoryOpen(
        false
      );

    } catch (error) {

      setHistoryError(
        error instanceof Error
          ? error.message
          : "Unable to load the selected visit."
      );

    } finally {

      setSelectedVisitLoadingId(
        null
      );
    }
  }


  function handleBackToLatest() {
    setActiveData(
      data
    );
  }


  return (
    <Box
      sx={{
        display:
          "flex",
        justifyContent:
          "flex-start",
        mb: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width:
            "100%",

          px: {
            xs: 2,
            md: 3,
          },

          py: 2.5,

          border:
            "1px solid",

          borderColor:
            "divider",

          borderRadius: 3,

          backgroundColor:
            "background.paper",
        }}
      >
        <Box
          sx={{
            display:
              "flex",
            alignItems:
              "center",
            flexWrap:
              "wrap",
            gap: 1,
            mb: 0.75,
          }}
        >
          <Typography
            sx={{
              fontSize:
                "1.05rem",
              fontWeight: 700,
            }}
          >
            Customer Visit Intelligence
          </Typography>

          <Chip
            label={
              isLatestVisit
                ? "Latest Visit"
                : "Previous Visit"
            }
            size="small"
            variant="outlined"
          />
        </Box>


        <Typography
          sx={{
            fontWeight: 700,
          }}
        >
          {customerName}
        </Typography>


        {activeData.customer_code && (
          <Typography
            variant="body2"
            sx={{
              color:
                "text.secondary",
              mt: 0.25,
            }}
          >
            BMD:{" "}
            {
              activeData.customer_code
            }
          </Typography>
        )}


        <Box
          sx={{
            display:
              "grid",

            gridTemplateColumns: {
              xs:
                "1fr",
              sm:
                "repeat(2, minmax(0, 1fr))",
              md:
                "repeat(5, minmax(0, 1fr))",
            },

            gap: 2,

            mt: 2,
            mb: 2,
          }}
        >
          <MetadataItem
            label="Visit Date"
            value={
              formatVisitDate(
                activeData.visit_date ||
                activeData.visit_started_at
              )
            }
          />

          <MetadataItem
            label="Duration"
            value={
              visitDuration
            }
          />

          <MetadataItem
            label="Visited By"
            value={
              activeData.visited_by
            }
          />

          <MetadataItem
            label="Sales Office"
            value={
              activeData.sales_office_name ||
              activeData.sales_office_code
            }
          />

          <MetadataItem
            label="Assigned Sales Employee"
            value={
              activeData.sales_employee
            }
          />
        </Box>


        <Box
          sx={{
            display:
              "flex",
            flexWrap:
              "wrap",
            gap: 1,
            mb: 2,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={
              handleToggleHistory
            }
            disabled={
              historyLoading
            }
          >
            {
              historyOpen
                ? "Hide Previous Visits"
                : "View Previous Visits"
            }
          </Button>

          {!isLatestVisit && (
            <Button
              size="small"
              variant="text"
              onClick={
                handleBackToLatest
              }
            >
              Back to Latest Visit
            </Button>
          )}
        </Box>


        <Collapse
          in={
            historyOpen
          }
        >
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              border:
                "1px solid",
              borderColor:
                "divider",
              borderRadius: 2,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Previous Visits
            </Typography>

            {historyLoading && (
              <Box
                sx={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 1,
                  py: 2,
                }}
              >
                <CircularProgress
                  size={20}
                />

                <Typography
                  variant="body2"
                >
                  Loading previous visits...
                </Typography>
              </Box>
            )}

            {!historyLoading &&
              historyError && (
                <Typography
                  variant="body2"
                  sx={{
                    py: 1,
                  }}
                >
                  {historyError}
                </Typography>
              )}

            {!historyLoading &&
              !historyError &&
              historyLoaded &&
              previousVisits.length ===
                0 && (
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      "text.secondary",
                    py: 1,
                  }}
                >
                  No earlier completed visits were found.
                </Typography>
              )}

            {!historyLoading &&
              previousVisits.map(
                (
                  visit
                ) => (
                  <PreviousVisitRow
                    key={
                      visit.visit_id
                    }
                    visit={
                      visit
                    }
                    isLoading={
                      selectedVisitLoadingId ===
                      visit.visit_id
                    }
                    onOpen={
                      handleOpenPreviousVisit
                    }
                  />
                )
              )}
          </Box>
        </Collapse>


        <Divider />


        {activeData.visit_summary && (
          <Box
            sx={{
              mt: 2.25,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 0.75,
              }}
            >
              Visit Summary
            </Typography>

            <Typography
              sx={{
                whiteSpace:
                  "pre-wrap",
                lineHeight:
                  1.65,
              }}
            >
              {
                activeData.visit_summary
              }
            </Typography>
          </Box>
        )}


        <InsightSection
          title="Opportunities"
          items={
            activeData.opportunities
          }
        />

        <InsightSection
          title="Commitments"
          items={
            activeData.commitments
          }
        />

        <InsightSection
          title="Next Actions"
          items={
            activeData.next_actions
          }
        />

        <InsightSection
          title="Customer Needs"
          items={
            activeData.customer_needs
          }
        />

        <InsightSection
          title="Risks"
          items={
            activeData.risks
          }
        />

        <InsightSection
          title="Competitors"
          items={
            activeData.competitors
          }
        />

        <InsightSection
          title="Service Issues"
          items={
            activeData.service_issues
          }
        />

        <InsightSection
          title="Product Interests"
          items={
            activeData.product_interests
          }
        />

        <InsightSection
          title="Commercial Terms"
          items={
            activeData.commercial_terms
          }
        />


        {isLatestVisit &&
          Array.isArray(
            suggestions
          ) &&
          suggestions.length >
            0 && (
            <>
              <Divider
                sx={{
                  mt: 2.5,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 700,
                  mt: 2,
                  mb: 1,
                }}
              >
                Ask about this visit
              </Typography>

              <Box
                sx={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: 1,
                }}
              >
                {suggestions.map(
                  (
                    suggestion,
                    index
                  ) => {
                    const text =
                      typeof suggestion ===
                      "string"
                        ? suggestion
                        : (
                            suggestion
                              ?.question ||
                            suggestion
                              ?.text ||
                            ""
                          );

                    if (!text) {
                      return null;
                    }

                    return (
                      <Button
                        key={
                          `${text}-${index}`
                        }
                        size="small"
                        variant="outlined"
                        onClick={
                          () =>
                            onSuggestionClick?.(
                              text
                            )
                        }
                      >
                        {text}
                      </Button>
                    );
                  }
                )}
              </Box>
            </>
          )}
      </Paper>
    </Box>
  );
}


export default VisitIntelligenceCard;
