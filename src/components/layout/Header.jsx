import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

function Header({ user }) {
  const userName =
    user?.name || "User";

  const userEmail =
    user?.email || "";

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();

  return (
    <>
      {/* Bosch color strip */}
      <Box
        sx={{
          height: 7,
          flexShrink: 0,
          background:
            "linear-gradient(90deg," +
            "#d5001c 0%, #d5001c 14.28%," +
            "#b00055 14.28%, #b00055 28.56%," +
            "#008ecf 28.56%, #008ecf 42.84%," +
            "#00a58e 42.84%, #00a58e 57.12%," +
            "#8e245d 57.12%, #8e245d 71.4%," +
            "#f4c400 71.4%, #f4c400 85.68%," +
            "#e20015 85.68%, #e20015 100%)",
        }}
      />

      <AppBar
        position="static"
        elevation={0}
        sx={{
          flexShrink: 0,
          background:
            "linear-gradient(120deg, #0e3259 0%, #17558c 100%)",
          borderBottom:
            "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: "58px !important",
            px: {
              xs: 1.5,
              md: 2.5,
            },
            display: "flex",
            justifyContent:
              "space-between",
            gap: 2,
          }}
        >
          {/* Application title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                backgroundColor:
                  "rgba(255,255,255,0.10)",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                fontSize: 21,
                flexShrink: 0,
              }}
            >
              🤖
            </Box>

            <Box
              sx={{
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  color: "#ffffff",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  fontSize: {
                    xs: 15,
                    md: 18,
                  },
                  whiteSpace: "nowrap",
                }}
              >
                MA AI Assistant
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color: "#dceafa",
                  fontSize: 10.5,
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
              >
                Enterprise Analytics
              </Typography>
            </Box>
          </Box>

          {/* User and Bosch branding */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: {
                xs: 0.75,
                sm: 1.25,
              },
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/bosch-logo.png"
              alt="Bosch"
            sx={{
                height: {
                  xs: 60,
                  sm: 68,
                },
                width: "auto",
                maxWidth: 250,
                objectFit: "contain",
              }}
            />

            <Box
              sx={{
                width: "1px",
                height: 30,
                backgroundColor:
                  "rgba(255,255,255,0.20)",
                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            />

            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: "#ffffff",
                color: "#174779",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {userInitial}
            </Avatar>

            <Box
              sx={{
                display: {
                  xs: "none",
                  sm: "flex",
                },
                flexDirection: "column",
                minWidth: 90,
                maxWidth: 160,
              }}
            >
              <Typography
                noWrap
                sx={{
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {userName}
              </Typography>

              {userEmail && (
                <Typography
                  noWrap
                  sx={{
                    mt: 0.15,
                    color: "#d7e6f6",
                    fontSize: 9.5,
                    lineHeight: 1.2,
                  }}
                >
                  {userEmail}
                </Typography>
              )}
            </Box>

            <IconButton
              size="small"
              aria-label="Open profile menu"
              sx={{
                color: "#ffffff",
                p: 0.5,

                "&:hover": {
                  backgroundColor:
                    "rgba(255,255,255,0.10)",
                },
              }}
            >
              <KeyboardArrowDownIcon
                fontSize="small"
              />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}

export default Header;