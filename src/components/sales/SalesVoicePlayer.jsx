import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import VolumeUpOutlinedIcon
  from "@mui/icons-material/VolumeUpOutlined";


// =========================================================
// SALES VOICE PLAYER
//
// Sales-only component.
//
// Does not change shared ChatWindow.
// Does not affect Executive.
// =========================================================

function SalesVoicePlayer({
  audioUrl,
  loading = false,
  error = null,
}) {

  if (
    !audioUrl &&
    !loading &&
    !error
  ) {

    return null;
  }


  return (

    <Paper
      variant="outlined"

      sx={{
        mx:
          1.5,

        mb:
          1.5,

        p:
          1.5,

        borderRadius:
          2,

        backgroundColor:
          "#f8fbff",
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

          mb:
            audioUrl ||
            loading
              ? 1
              : 0,
        }}
      >

        <VolumeUpOutlinedIcon
          sx={{
            color:
              "#1769aa",
          }}
        />


        <Typography
          variant="subtitle2"

          sx={{
            fontWeight:
              700,

            color:
              "#0f3557",
          }}
        >

          Voice Summary

        </Typography>


        {loading && (

          <CircularProgress
            size={16}
          />

        )}

      </Box>


      {loading && (

        <Typography
          variant="body2"

          sx={{
            color:
              "#667788",
          }}
        >

          Generating voice summary...

        </Typography>

      )}


      {error && (

        <Alert
          severity="error"
        >

          {error}

        </Alert>

      )}


      {audioUrl && (

        <Box
          component="audio"

          controls

          src={
            audioUrl
          }

          sx={{
            display:
              "block",

            width:
              "100%",

            height:
              40,
          }}
        />

      )}

    </Paper>
  );
}


export default SalesVoicePlayer;