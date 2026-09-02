import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import PlayArrowOutlinedIcon
  from "@mui/icons-material/PlayArrowOutlined";

import StopCircleOutlinedIcon
  from "@mui/icons-material/StopCircleOutlined";


function SalesVisitPanel({

  selectedCustomer,

  activeVisit,

  isStartingVisit,

  startVisitError,

  onStartVisit,

  // =====================================================
  // END VISIT / INSIGHTS
  // =====================================================

  onEndVisit,

  isEndingVisit = false,

  endVisitError = null,

  hasRecordedConversation = false,

  disabled = false,

}) {

  // =====================================================
  // NO CUSTOMER
  // =====================================================

  if (
    !selectedCustomer
  ) {

    return null;
  }


  // =====================================================
  // VISIT ACTIVE
  // =====================================================

  if (
    activeVisit?.visit_id
  ) {

    return (

      <Box
        sx={{
          border:
            "1px solid #c8e6c9",

          backgroundColor:
            "#f6fbf6",

          borderRadius:
            2,

          p:
            2,

          mb:
            2,
        }}
      >

        {/* ===============================================
            STATUS
            =============================================== */}

        <Box
          sx={{
            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              2,

            flexWrap:
              "wrap",
          }}
        >

          <Box
            sx={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                1,
            }}
          >

            {/* -------------------------------------------
                ACTIVE CHECK
                ------------------------------------------- */}

            <Box
              sx={{
                width:
                  28,

                height:
                  28,

                borderRadius:
                  "50%",

                backgroundColor:
                  "#2e7d32",

                color:
                  "#ffffff",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                fontWeight:
                  700,

                fontSize:
                  16,

                flexShrink:
                  0,
              }}
            >

              ✓

            </Box>


            <Box>

              <Typography
                sx={{
                  fontWeight:
                    700,

                  color:
                    "#2e7d32",
                }}
              >

                Visit in progress

              </Typography>


              <Typography
                variant="body2"
                sx={{
                  color:
                    "#5f6b66",
                }}
              >

                {
                  activeVisit.bmd_name ||
                  selectedCustomer.bmd_name
                }

              </Typography>

            </Box>

          </Box>


          {/* =============================================
              FINISH VISIT
              ============================================= */}

          <Button

            variant="contained"

            color="error"

            startIcon={

              isEndingVisit
                ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                : (
                    <StopCircleOutlinedIcon />
                  )

            }

            disabled={
              disabled ||
              isEndingVisit ||
              !hasRecordedConversation ||
              !onEndVisit
            }

            onClick={
              onEndVisit
            }

            sx={{
              textTransform:
                "none",

              fontWeight:
                700,
            }}
          >

            {
              isEndingVisit
                ? "Generating Insights..."
                : "Finish Visit & Generate Insights"
            }

          </Button>

        </Box>


        {/* ===============================================
            VISIT ID
            =============================================== */}

        <Typography
          variant="caption"
          sx={{
            display:
              "block",

            mt:
              1,

            color:
              "#667788",
          }}
        >

          Visit ID:{" "}
          {activeVisit.visit_id}

        </Typography>


        {/* ===============================================
            GUIDANCE
            =============================================== */}

        {!hasRecordedConversation && (

          <Typography
            variant="caption"
            sx={{
              display:
                "block",

              mt:
                1,

              color:
                "#667788",
            }}
          >

            Save at least one customer conversation before finishing the visit.

          </Typography>

        )}


        {/* ===============================================
            END VISIT ERROR
            =============================================== */}

        {endVisitError && (

          <Alert
            severity="error"
            sx={{
              mt:
                1.5,
            }}
          >

            {endVisitError}

          </Alert>

        )}

      </Box>
    );
  }


  // =====================================================
  // VISIT NOT STARTED
  // =====================================================

  return (

    <Box
      sx={{
        border:
          "1px solid #d9e2ec",

        borderRadius:
          2,

        backgroundColor:
          "#ffffff",

        p:
          2,

        mb:
          2,
      }}
    >

      {/* ===============================================
          TITLE
          =============================================== */}

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight:
            700,

          color:
            "#0f3557",

          mb:
            0.5,
        }}
      >

        Customer Visit

      </Typography>


      {/* ===============================================
          DESCRIPTION
          =============================================== */}

      <Typography
        variant="body2"
        sx={{
          color:
            "#667788",

          mb:
            1.5,
        }}
      >

        Start the visit after customer consent before recording the conversation.

      </Typography>


      {/* ===============================================
          ERROR
          =============================================== */}

      {startVisitError && (

        <Alert
          severity="error"
          sx={{
            mb:
              1.5,
          }}
        >

          {startVisitError}

        </Alert>

      )}


      {/* ===============================================
          START VISIT
          =============================================== */}

      <Button

        variant="contained"

        startIcon={

          isStartingVisit
            ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              )
            : (
                <PlayArrowOutlinedIcon />
              )

        }

        disabled={
          disabled ||
          isStartingVisit
        }

        onClick={
          onStartVisit
        }

        sx={{
          textTransform:
            "none",

          fontWeight:
            700,
        }}
      >

        {
          isStartingVisit
            ? "Starting Visit..."
            : "Start Visit"
        }

      </Button>

    </Box>
  );
}


export default SalesVisitPanel;