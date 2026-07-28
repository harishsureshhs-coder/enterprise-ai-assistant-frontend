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

  // -----------------------------------------
  // General GPT response
  // -----------------------------------------

  if (isGeneralChat) {
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
              md: "75%",
            },
            px: 3,
            py: 2.5,
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
                mt: 2,
                color: "text.secondary",
              }}
            >
              Time:{" "}
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

  // -----------------------------------------
  // SQL analytics response
  // -----------------------------------------

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
            md: "85%",
          },
          px: 3,
          py: 2.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          backgroundColor: "background.paper",
        }}
      >
        {executiveSummary && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Executive Summary
            </Typography>

            <Typography
              sx={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.65,
              }}
            >
              {executiveSummary}
            </Typography>
          </Box>
        )}

        {keyInsights.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Key Insights
            </Typography>

            {keyInsights.map(
              (
                insight,
                index
              ) => (
                <Typography
                  key={index}
                  sx={{
                    mb: 0.75,
                    lineHeight: 1.6,
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
        )}

        {/* -------- FALLBACK -------- */}

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
          <Box sx={{ mt: 2.5 }}>
            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
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