import { Avatar, Box, Paper, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

function UserMessage({ message }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
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
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.4,
            borderRadius: "16px 16px 4px 16px",
            bgcolor: "#EAF3FF",
            border: "1px solid #C8DCFD",
            color: "#20344F",
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}
          >
            {message?.text || ""}
          </Typography>
        </Paper>

        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#D8E9FB",
            color: "#17558C",
          }}
        >
          <PersonIcon sx={{ fontSize: 18 }} />
        </Avatar>
      </Box>
    </Box>
  );
}

export default UserMessage;