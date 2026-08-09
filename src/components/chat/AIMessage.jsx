import {
  Box,
  Paper,
  Typography,
} from "@mui/material";

import AnalyticsResult from "../analytics/AnalyticsResult";

function AIMessage({
  message,
  onSuggestionClick,
}) {
  const engine =
    message.engine ||
    message.queryType ||
    "";

  const isGeneralChat =
    engine === "CHAT";

  const answer =
    message.answer ||
    message.content ||
    message.text ||
    message.summary ||
    "";

  const executiveSummary =
    message.executiveSummary ||
    message.executive_summary ||
    null;

  const keyInsights =
    Array.isArray(message.keyInsights)
      ? message.keyInsights
      : Array.isArray(message.key_insights)
      ? message.key_insights
      : [];

  const visual =
    message.visual || null;

  const rows =
    Array.isArray(message.rows)
      ? message.rows
      : [];

  const suggestions =
    Array.isArray(message.suggestions)
      ? message.suggestions
      : [];

  const generatedQuery =
    message.generatedQuery ||
    message.generated_sql ||
    null;

  const executionTimeMs =
    message.executionTime ??
    message.execution_time_ms ??
    null;

  const hasAnalyticsContent =
    Boolean(executiveSummary) ||
    keyInsights.length > 0 ||
    rows.length > 0 ||
    Boolean(generatedQuery);

  if (isGeneralChat) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          mb: 2.5,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: {
              xs: "100%",
              md: "72%",
            },
            maxWidth: 960,
            px: 3,
            py: 2.25,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            backgroundColor: "background.paper",
          }}
        >
          <Typography
            component="div"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
              fontSize: "0.95rem",
            }}
          >
            {answer ||
              "No response was generated."}
          </Typography>

          {executionTimeMs != null && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1.75,
                color: "text.secondary",
              }}
            >
              Response time:{" "}
              {(
                executionTimeMs /
                1000
              ).toFixed(2)}{" "}
              sec
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
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
          maxWidth: 1180,
          px: {
            xs: 2,
            sm: 3,
          },
          py: 2.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          backgroundColor: "background.paper",
        }}
      >
        {executiveSummary && (
          <Box
            sx={{
              mb: 2.5,
              pb: 2.25,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 0.8,
                fontSize: "0.98rem",
              }}
            >
              Executive Summary
            </Typography>

            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.7,
                color: "text.primary",
              }}
            >
              {executiveSummary}
            </Typography>
          </Box>
        )}

        {keyInsights.length > 0 && (
          <Box
            sx={{
              mb: 2.5,
              pb: 2.25,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: "0.98rem",
              }}
            >
              Key Insights
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.9,
              }}
            >
              {keyInsights.map(
                (
                  insight,
                  index
                ) => (
                  <Typography
                    key={index}
                    sx={{
                      lineHeight: 1.6,
                      fontSize: "0.93rem",
                      color: "text.primary",
                    }}
                  >
                    •{" "}
                    {typeof insight ===
                    "string"
                      ? insight
                      : insight?.text ||
                        insight?.insight ||
                        JSON.stringify(
                          insight
                        )}
                  </Typography>
                )
              )}
            </Box>
          </Box>
        )}

        {!hasAnalyticsContent &&
          answer && (
            <Typography
              sx={{
                mb: 2,
                whiteSpace:
                  "pre-wrap",
                lineHeight: 1.7,
              }}
            >
              {answer}
            </Typography>
          )}

        <AnalyticsResult
          rows={rows}
          visual={visual}
          generatedQuery={
            generatedQuery
          }
          executionTime={
            executionTimeMs
          }
        />

        {suggestions.length >
          0 && (
          <Box
            sx={{
              mt: 2.75,
              pt: 2.25,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1.2,
                fontSize: "0.95rem",
              }}
            >
              Suggested Next Analysis
            </Typography>

            <Box
              sx={{
                display: "flex",
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
                  const suggestionText =
                    typeof suggestion ===
                    "string"
                      ? suggestion
                      : suggestion?.question ||
                        suggestion?.text ||
                        "";

                  if (
                    !suggestionText
                  ) {
                    return null;
                  }

                  return (
                    <Box
                      key={`${suggestionText}-${index}`}
                      component="button"
                      type="button"
                      onClick={() =>
                        onSuggestionClick?.(
                          suggestionText
                        )
                      }
                      sx={{
                        border:
                          "1px solid",
                        borderColor:
                          "divider",
                        borderRadius: 2,
                        backgroundColor:
                          "background.default",
                        px: 1.6,
                        py: 0.9,
                        cursor:
                          "pointer",
                        fontSize:
                          "0.87rem",
                        transition:
                          "all 0.15s ease",

                        "&:hover": {
                          backgroundColor:
                            "action.hover",
                          transform:
                            "translateY(-1px)",
                        },
                      }}
                    >
                      {
                        suggestionText
                      }
                    </Box>
                  );
                }
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default AIMessage;