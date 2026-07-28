import { Avatar, Box, Paper, Typography } from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

function ThinkingMessage() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          maxWidth: "72%",
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#17558C",
            color: "#FFFFFF",
          }}
        >
          <SmartToyOutlinedIcon sx={{ fontSize: 18 }} />
        </Avatar>

        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.4,
            borderRadius: "16px 16px 16px 4px",
            bgcolor: "#FFFFFF",
            border: "1px solid #DFE7F0",
          }}
        >
          <Typography
            sx={{
              mb: 0.8,
              color: "#354B66",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Thinking
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 0.7,
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((item) => (
              <Box
                key={item}
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: "#3478C8",
                  animation: "thinkingPulse 1.2s infinite ease-in-out",
                  animationDelay: `${item * 0.16}s`,
                  "@keyframes thinkingPulse": {
                    "0%, 80%, 100%": {
                      transform: "translateY(0)",
                      opacity: 0.35,
                    },
                    "40%": {
                      transform: "translateY(-5px)",
                      opacity: 1,
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default ThinkingMessage;