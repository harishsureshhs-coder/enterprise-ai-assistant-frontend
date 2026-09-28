import {
  Box,
  Divider,
  Paper,
  Typography,
} from "@mui/material";


function formatVisitDate(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
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
        }}
      >
        {String(
          value
        )}
      </Typography>
    </Box>
  );
}


function VisitIntelligenceCard({
  data,
  suggestions = [],
  onSuggestionClick,
}) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return null;
  }

  const customerName =
    data.customer_name ||
    data.customer_code ||
    "Customer";

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
          width: {
            xs: "100%",
            md: "88%",
          },

          px: 3,
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
        {/* ================================================
            TITLE
            ================================================ */}

        <Typography
          sx={{
            fontSize:
              "1.05rem",
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          Customer Visit Intelligence
        </Typography>

        <Typography
          sx={{
            fontWeight: 700,
          }}
        >
          {customerName}
        </Typography>

        {data.customer_code && (
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
              data.customer_code
            }
          </Typography>
        )}

        {/* ================================================
            VISIT METADATA
            ================================================ */}

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
                "repeat(4, minmax(0, 1fr))",
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
                data.visit_date ||
                data.visit_started_at
              )
            }
          />

          <MetadataItem
            label="Visited By"
            value={
              data.visited_by
            }
          />

          <MetadataItem
            label="Sales Office"
            value={
              data.sales_office_name ||
              data.sales_office_code
            }
          />

          <MetadataItem
            label="Assigned Sales Employee"
            value={
              data.sales_employee
            }
          />
        </Box>

        <Divider />

        {/* ================================================
            SUMMARY
            ================================================ */}

        {data.visit_summary && (
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
                data.visit_summary
              }
            </Typography>
          </Box>
        )}

        {/* ================================================
            STRUCTURED INSIGHTS
            ================================================ */}

        <InsightSection
          title="Customer Needs"
          items={
            data.customer_needs
          }
        />

        <InsightSection
          title="Opportunities"
          items={
            data.opportunities
          }
        />

        <InsightSection
          title="Product Interests"
          items={
            data.product_interests
          }
        />

        <InsightSection
          title="Commercial Terms"
          items={
            data.commercial_terms
          }
        />

        <InsightSection
          title="Commitments"
          items={
            data.commitments
          }
        />

        <InsightSection
          title="Next Actions"
          items={
            data.next_actions
          }
        />

        <InsightSection
          title="Service Issues"
          items={
            data.service_issues
          }
        />

        <InsightSection
          title="Competitors"
          items={
            data.competitors
          }
        />

        <InsightSection
          title="Risks"
          items={
            data.risks
          }
        />

        {/* ================================================
            FOLLOW-UP QUESTIONS
            ================================================ */}

        {Array.isArray(
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
                      <Box
                        component="button"
                        type="button"
                        key={
                          `${text}-${index}`
                        }
                        onClick={
                          () =>
                            onSuggestionClick?.(
                              text
                            )
                        }
                        sx={{
                          border:
                            "1px solid",
                          borderColor:
                            "divider",
                          borderRadius:
                            2,
                          backgroundColor:
                            "transparent",
                          px: 1.5,
                          py: 1,
                          cursor:
                            "pointer",

                          "&:hover": {
                            backgroundColor:
                              "action.hover",
                          },
                        }}
                      >
                        {text}
                      </Box>
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