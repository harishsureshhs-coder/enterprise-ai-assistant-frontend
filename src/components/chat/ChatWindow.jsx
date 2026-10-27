import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

import AIMessage from "./AIMessage";
import ThinkingMessage from "./ThinkingMessage";
import UserMessage from "./UserMessage";
import VisitIntelligenceCard from "./VisitIntelligenceCard";


function ChatWindow({
  messages = [],
  onSuggestionClick,
}) {
  const bottomRef =
    useRef(null);


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
        px: {
          xs: 2,
          md: 4,
        },
        py: 2.5,
      }}
    >
      {messages.map(
        (message) => {

          // =================================================
          // USER MESSAGE
          // =================================================

          if (
            message.role === "user"
          ) {
            return (
              <UserMessage
                key={message.id}
                message={message}
              />
            );
          }


          // =================================================
          // LOADING / THINKING MESSAGE
          // =================================================

          if (
            message.isLoading
          ) {
            return (
              <ThinkingMessage
                key={message.id}
                message={message}
              />
            );
          }


          // =================================================
          // NORMALIZE ENGINE
          // =================================================

          const engine =
            String(
              message.engine ||
              message.queryType ||
              ""
            )
              .trim()
              .toUpperCase();


          // =================================================
          // VISIT INTELLIGENCE
          //
          // Visit Intelligence must not use the generic
          // analytics renderer in AIMessage.
          // =================================================

          if (
            engine === "VISIT_INTELLIGENCE"
          ) {

            console.log(
              "VISIT MESSAGE IN CHAT WINDOW:",
              message
            );

            console.log(
              "VISIT CARD DATA:",
              message.visitIntelligence
            );


            // -----------------------------------------------
            // Successful Visit Intelligence payload
            // -----------------------------------------------

            if (
              message.visitIntelligence &&
              typeof message.visitIntelligence ===
                "object" &&
              !Array.isArray(
                message.visitIntelligence
              )
            ) {
              return (
                <VisitIntelligenceCard
                  key={message.id}
                  data={
                    message.visitIntelligence
                  }
                  suggestions={
                    Array.isArray(
                      message.suggestions
                    )
                      ? message.suggestions
                      : []
                  }
                  onSuggestionClick={
                    onSuggestionClick
                  }
                />
              );
            }


            // -----------------------------------------------
            // Fallback:
            // clarification / no completed visit / no payload
            //
            // Render as a normal chat message.
            // -----------------------------------------------

            return (
              <AIMessage
                key={message.id}
                message={{
                  ...message,

                  engine:
                    "CHAT",

                  queryType:
                    "CHAT",

                  executiveSummary:
                    null,

                  keyInsights:
                    [],

                  visual:
                    null,

                  rows:
                    [],

                  rowCount:
                    0,
                }}
                onSuggestionClick={
                  onSuggestionClick
                }
              />
            );
          }


          // =================================================
          // NORMAL CHAT / SQL ANALYTICS
          // =================================================

          return (
            <AIMessage
              key={message.id}
              message={message}
              onSuggestionClick={
                onSuggestionClick
              }
            />
          );
        }
      )}


      <div
        ref={bottomRef}
      />
    </Box>
  );
}


export default ChatWindow;
