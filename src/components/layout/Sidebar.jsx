import {
  useMemo,
  useState,
} from "react";

import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";


const SIDEBAR_WIDTH = 210;
const COLLAPSED_SIDEBAR_WIDTH = 64;


function Sidebar({
  chatHistory = [],
  activeConversationId,
  onHistoryClick,
  onNewChat,
  onDeleteConversation,
  collapsible = false,
}) {
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    menuAnchor,
    setMenuAnchor,
  ] = useState(null);

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState(null);

  const [
    isCollapsed,
    setIsCollapsed,
  ] = useState(false);


  const collapsed =
    collapsible &&
    isCollapsed;


  const filteredHistory = useMemo(() => {
    const searchValue = searchText
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return chatHistory;
    }

    return chatHistory.filter(
      (conversation) =>
        conversation.title
          ?.toLowerCase()
          .includes(searchValue)
    );
  }, [
    chatHistory,
    searchText,
  ]);


  const groupedHistory = useMemo(
    () =>
      groupHistory(
        filteredHistory
      ),
    [filteredHistory]
  );


  const hasSearchResults =
    filteredHistory.length > 0;

  const isSearching =
    searchText.trim().length > 0;

  const isMenuOpen =
    Boolean(menuAnchor);


  function handleClearSearch() {
    setSearchText("");
  }


  function handleToggleCollapse() {
    setIsCollapsed(
      (previous) => !previous
    );

    setSearchText("");
    handleCloseMenu();
  }


  function handleOpenMenu(
    event,
    conversation
  ) {
    event.stopPropagation();

    setMenuAnchor(
      event.currentTarget
    );

    setSelectedConversation(
      conversation
    );
  }


  function handleCloseMenu() {
    setMenuAnchor(null);
    setSelectedConversation(null);
  }


  function handleDeleteClick() {
    const conversationId =
      selectedConversation?.id;

    handleCloseMenu();

    if (!conversationId) {
      return;
    }

    onDeleteConversation?.(
      conversationId
    );
  }


  return (
    <Box
      component="aside"
      sx={{
        width: collapsed
          ? COLLAPSED_SIDEBAR_WIDTH
          : SIDEBAR_WIDTH,

        minWidth: collapsed
          ? COLLAPSED_SIDEBAR_WIDTH
          : SIDEBAR_WIDTH,

        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#102B49",
        color: "#FFFFFF",
        borderRight:
          "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",

        transition:
          "width 0.22s ease, min-width 0.22s ease",
      }}
    >
      {collapsible && (
        <Box
          sx={{
            display: "flex",
            justifyContent: collapsed
              ? "center"
              : "flex-end",
            px: collapsed
              ? 0.75
              : 1,
            pt: 0.75,
            pb: 0.25,
          }}
        >
          <Tooltip
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            placement="right"
          >
            <IconButton
              size="small"
              onClick={
                handleToggleCollapse
              }
              aria-label={
                collapsed
                  ? "Expand conversation sidebar"
                  : "Collapse conversation sidebar"
              }
              sx={{
                color: "#DCE7F4",
                bgcolor:
                  "rgba(255,255,255,0.05)",

                "&:hover": {
                  bgcolor:
                    "rgba(255,255,255,0.11)",
                },
              }}
            >
              {collapsed ? (
                <ChevronRightOutlinedIcon
                  sx={{
                    fontSize: 19,
                  }}
                />
              ) : (
                <ChevronLeftOutlinedIcon
                  sx={{
                    fontSize: 19,
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}


      <Box
        sx={{
          p: collapsed
            ? 0.75
            : 1.5,
          pb: 1,
        }}
      >
        {collapsed ? (
          <Tooltip
            title="New Chat"
            placement="right"
          >
            <IconButton
              onClick={onNewChat}
              aria-label="New Chat"
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#2F74BC",
                color: "#FFFFFF",
                borderRadius: 2,

                "&:hover": {
                  bgcolor: "#3B82C7",
                },
              }}
            >
              <AddCommentOutlinedIcon
                sx={{
                  fontSize: 20,
                }}
              />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={
              <AddCommentOutlinedIcon />
            }
            onClick={onNewChat}
            sx={{
              minHeight: 42,
              bgcolor: "#2F74BC",
              borderRadius: 2,
              fontWeight: 700,
              boxShadow: "none",
              textTransform: "none",

              "&:hover": {
                bgcolor: "#3B82C7",
                boxShadow: "none",
              },
            }}
          >
            New Chat
          </Button>
        )}
      </Box>


      {!collapsed && (
        <Box
          sx={{
            px: 1.5,
            pb: 1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="Search chats"
            aria-label="Search conversations"
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                >
                  <SearchOutlinedIcon
                    sx={{
                      color: "#AFC2D9",
                      fontSize: 18,
                    }}
                  />
                </InputAdornment>
              ),

              endAdornment:
                searchText ? (
                  <InputAdornment
                    position="end"
                  >
                    <IconButton
                      size="small"
                      onClick={
                        handleClearSearch
                      }
                      aria-label="Clear conversation search"
                      sx={{
                        color: "#AFC2D9",
                        p: 0.25,

                        "&:hover": {
                          bgcolor:
                            "rgba(255,255,255,0.08)",
                        },
                      }}
                    >
                      <CloseOutlinedIcon
                        sx={{
                          fontSize: 16,
                        }}
                      />
                    </IconButton>
                  </InputAdornment>
                ) : null,
            }}
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  height: 38,
                  color: "#FFFFFF",
                  bgcolor:
                    "rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  fontSize: 11,

                  "& fieldset": {
                    borderColor:
                      "rgba(255,255,255,0.12)",
                  },

                  "&:hover fieldset": {
                    borderColor:
                      "rgba(255,255,255,0.24)",
                  },

                  "&.Mui-focused fieldset":
                    {
                      borderColor:
                        "#5B9BD5",
                    },
                },

              "& input::placeholder":
                {
                  color: "#AFC2D9",
                  opacity: 1,
                },
            }}
          />
        </Box>
      )}


      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: collapsed
            ? 0.75
            : 1,
          pb: 1,
        }}
      >
        {!collapsed &&
        isSearching &&
        !hasSearchResults ? (
          <Box
            sx={{
              px: 1.25,
              py: 3,
              textAlign: "center",
            }}
          >
            <SearchOutlinedIcon
              sx={{
                mb: 0.75,
                color: "#829AB5",
                fontSize: 25,
              }}
            />

            <Typography
              sx={{
                color: "#C5D4E5",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              No conversations found
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: "#829AB5",
                fontSize: 9.5,
              }}
            >
              Try a different search term
            </Typography>
          </Box>
        ) : (
          <>
            <HistorySection
              title="Today"
              items={
                groupedHistory.today
              }
              activeConversationId={
                activeConversationId
              }
              onHistoryClick={
                onHistoryClick
              }
              onOpenMenu={
                handleOpenMenu
              }
              collapsed={
                collapsed
              }
            />

            <HistorySection
              title="Yesterday"
              items={
                groupedHistory.yesterday
              }
              activeConversationId={
                activeConversationId
              }
              onHistoryClick={
                onHistoryClick
              }
              onOpenMenu={
                handleOpenMenu
              }
              collapsed={
                collapsed
              }
            />

            <HistorySection
              title="Older"
              items={
                groupedHistory.older
              }
              activeConversationId={
                activeConversationId
              }
              onHistoryClick={
                onHistoryClick
              }
              onOpenMenu={
                handleOpenMenu
              }
              collapsed={
                collapsed
              }
            />
          </>
        )}
      </Box>


      <Menu
        anchorEl={menuAnchor}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            minWidth: 130,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            color: "error.main",
            fontSize: 13,
            gap: 1,
          }}
        >
          <DeleteOutlineOutlinedIcon
            fontSize="small"
          />

          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}


function HistorySection({
  title,
  items,
  activeConversationId,
  onHistoryClick,
  onOpenMenu,
  collapsed = false,
}) {
  if (!items.length) {
    return null;
  }

  return (
    <Box
      sx={{
        mb: collapsed
          ? 0.75
          : 1.5,
      }}
    >
      {!collapsed && (
        <Typography
          sx={{
            px: 1,
            py: 0.75,
            color: "#AFC2D9",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.7,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>
      )}

      <List disablePadding>
        {items.map((item) => {
          const isActive =
            item.id ===
            activeConversationId;

          const historyButton = (
            <ListItemButton
              key={item.id}
              selected={isActive}
              onClick={() =>
                onHistoryClick?.(
                  item.id
                )
              }
              sx={{
                minHeight: 38,
                px: collapsed
                  ? 0
                  : 1,
                mb: 0.25,
                borderRadius: 2,
                color: "#E4EDF7",
                display: "flex",
                justifyContent:
                  collapsed
                    ? "center"
                    : "flex-start",
                alignItems: "center",

                "&:hover": {
                  bgcolor:
                    "rgba(255,255,255,0.08)",
                },

                "&.Mui-selected":
                  {
                    bgcolor:
                      "rgba(91,155,213,0.24)",
                    color:
                      "#FFFFFF",
                  },

                "&.Mui-selected:hover":
                  {
                    bgcolor:
                      "rgba(91,155,213,0.31)",
                  },

                "& .conversation-menu-button":
                  {
                    opacity: 0,
                  },

                "&:hover .conversation-menu-button":
                  {
                    opacity: collapsed
                      ? 0
                      : 1,
                  },

                "&.Mui-selected .conversation-menu-button":
                  {
                    opacity: collapsed
                      ? 0
                      : 1,
                  },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed
                    ? 0
                    : 31,
                  justifyContent:
                    "center",
                  color: isActive
                    ? "#FFFFFF"
                    : "#C9D7E7",
                }}
              >
                <ChatBubbleOutlineOutlinedIcon
                  sx={{
                    fontSize: 16,
                  }}
                />
              </ListItemIcon>

              {!collapsed && (
                <>
                  <Tooltip
                    title={item.title}
                    placement="right"
                  >
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        noWrap: true,
                        fontSize: 11,
                        fontWeight:
                          isActive
                            ? 600
                            : 400,
                      }}
                      sx={{
                        minWidth: 0,
                        mr: 0.25,
                      }}
                    />
                  </Tooltip>

                  <IconButton
                    className="conversation-menu-button"
                    size="small"
                    aria-label={`Open options for ${item.title}`}
                    onClick={(event) =>
                      onOpenMenu?.(
                        event,
                        item
                      )
                    }
                    sx={{
                      ml: "auto",
                      p: 0.35,
                      color: "#DCE7F4",
                      transition:
                        "opacity 0.15s ease",

                      "&:hover": {
                        bgcolor:
                          "rgba(255,255,255,0.10)",
                      },
                    }}
                  >
                    <MoreVertOutlinedIcon
                      sx={{
                        fontSize: 17,
                      }}
                    />
                  </IconButton>
                </>
              )}
            </ListItemButton>
          );

          if (!collapsed) {
            return historyButton;
          }

          return (
            <Tooltip
              key={item.id}
              title={item.title}
              placement="right"
            >
              {historyButton}
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );
}


function groupHistory(
  chatHistory
) {
  const now =
    new Date();

  const startOfToday =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const startOfYesterday =
    new Date(
      startOfToday
    );

  startOfYesterday.setDate(
    startOfYesterday.getDate() - 1
  );

  return chatHistory.reduce(
    (
      groups,
      conversation
    ) => {
      if (
        !conversation?.id ||
        !conversation?.title
      ) {
        return groups;
      }

      const updatedAt =
        conversation.updatedAt
          ? new Date(
              conversation.updatedAt
            )
          : new Date();

      if (
        updatedAt >=
        startOfToday
      ) {
        groups.today.push(
          conversation
        );
      } else if (
        updatedAt >=
        startOfYesterday
      ) {
        groups.yesterday.push(
          conversation
        );
      } else {
        groups.older.push(
          conversation
        );
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      older: [],
    }
  );
}


export default Sidebar;
