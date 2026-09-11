import {
  useState,
} from "react";

import {
  Box,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";


function SalesContextPanel({
  children,
}) {
  const [
    collapsed,
    setCollapsed,
  ] = useState(false);


  function handleToggle() {
    setCollapsed(
      (previous) => !previous
    );
  }


  return (
    <Box
      component="aside"
      className={
        [
          "sales-context-panel",
          collapsed
            ? "is-collapsed"
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <Box
        className=
          "sales-context-panel-header"
      >
        {!collapsed && (
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                color: "#173A5E",
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              Customer Context
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color: "#718399",
                fontSize: 9.5,
                lineHeight: 1.3,
              }}
            >
              Customer, snapshot and visit details
            </Typography>
          </Box>
        )}


        <Tooltip
          title={
            collapsed
              ? "Expand customer panel"
              : "Collapse customer panel"
          }
          placement="left"
        >
          <IconButton
            size="small"
            onClick={
              handleToggle
            }
            aria-label={
              collapsed
                ? "Expand customer context panel"
                : "Collapse customer context panel"
            }
            sx={{
              ml: collapsed
                ? 0
                : "auto",

              color: "#315E86",

              bgcolor:
                "#EEF4FA",

              border:
                "1px solid #D5E1EC",

              "&:hover": {
                bgcolor:
                  "#E3EEF8",
              },
            }}
          >
            {collapsed ? (
              <ChevronLeftOutlinedIcon
                sx={{
                  fontSize: 19,
                }}
              />
            ) : (
              <ChevronRightOutlinedIcon
                sx={{
                  fontSize: 19,
                }}
              />
            )}
          </IconButton>
        </Tooltip>
      </Box>


      {collapsed ? (
        <Box
          className=
            "sales-context-collapsed-content"
        >
          <PersonOutlineOutlinedIcon
            sx={{
              fontSize: 21,
              color: "#315E86",
            }}
          />

          <Typography
            sx={{
              mt: 1,
              color: "#60758B",
              fontSize: 9,
              fontWeight: 700,
              writingMode:
                "vertical-rl",
              transform:
                "rotate(180deg)",
              letterSpacing:
                0.5,
            }}
          >
            CUSTOMER
          </Typography>
        </Box>
      ) : (
        <Box
          className=
            "sales-context-panel-body"
        >
          {children}
        </Box>
      )}
    </Box>
  );
}


export default SalesContextPanel;
