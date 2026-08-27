import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

import AIMessage from "./AIMessage";
import ThinkingMessage from "./ThinkingMessage";
import UserMessage from "./UserMessage";

function ChatWindow({
  messages = [],
  onSuggestionClick,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        px: { xs: 2, md: 4 },
        py: 2.5,
      }}
    >
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <UserMessage
              key={message.id}
              message={message}
            />
          );
        }

        if (message.isLoading) {
          return (
            <ThinkingMessage
              key={message.id}
              message={message}
            />
          );
        }

        return (
          <AIMessage
            key={message.id}
            message={message}
            onSuggestionClick={
              onSuggestionClick
            }
          />
        );
      })}

      <div ref={bottomRef} />
    </Box>
  );
}

export default ChatWindow;