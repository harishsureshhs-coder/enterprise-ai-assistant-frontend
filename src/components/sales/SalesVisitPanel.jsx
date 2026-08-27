import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import PlayArrowOutlinedIcon
  from "@mui/icons-material/PlayArrowOutlined";


function SalesVisitPanel({
  selectedCustomer,
  activeVisit,
  isStartingVisit,
  startVisitError,
  onStartVisit,
  disabled = false,
}) {

  // =====================================================
  // NO CUSTOMER SELECTED
  //
  // Do not show Start Visit until a primary customer
  // has been selected.
  // =====================================================

  if (
    !selectedCustomer
  ) {

    return null;
  }


  // =====================================================
  // VISIT ALREADY STARTED
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
            ACTIVE VISIT HEADER
            =============================================== */}

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

          {/* =============================================
              SIMPLE CHECK SYMBOL

              We intentionally avoid another MUI icon
              import here.
              ============================================= */}

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

        Start the visit before recording the customer conversation.

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
          START VISIT BUTTON
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