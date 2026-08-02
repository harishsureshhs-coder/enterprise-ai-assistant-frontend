import {
  useEffect,
  useState,
} from "react";

import "./App.css";

import Layout from "./components/layout/Layout";

import {
  getCurrentUser,
} from "./services/authService";

import ChatWindow from "./components/chat/ChatWindow";
import ChatInput from "./components/ChatInput";
import SuggestedQuestions from "./components/SuggestedQuestions";


import {
  sendMessage,
} from "./services/api";

import {
  createConversation,
  getConversations,
  getConversationMessages,
} from "./services/conversationApi";


const initialMessage = {
  id: "welcome",

  role: "ai",

  engine: "CHAT",

  text:
    "Hi! I'm your MA AI Assistant. How can I help you today?",

  source: "GPT",

  status: "success",

  rows: [],

  keyInsights: [],

  suggestions: [],
};

//---Update Guest user instead of static---//
// const currentUser = {
//   id: "dev-user-001",

//   name: "Suresh",

//   email: "suresh@bosch.com",
// };

const currentUser =
  getCurrentUser();


const suggestedQuestions = [
  "Explain Azure Data Factory",
  "Show total TGS",
  "Show TGS by Distribution Channel",
  "Show top 3 CBF by TGS",
  "Show monthly TGS trend",
];


function createConversationTitle(
  question
) {
  const maximumLength = 32;

  if (
    question.length <= maximumLength
  ) {
    return question;
  }

  return (
    `${question.slice(
      0,
      maximumLength
    )}...`
  );
}


function normalizeArrayValue(
  value
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsedValue =
        JSON.parse(value);

      return Array.isArray(parsedValue)
        ? parsedValue
        : [];
    } catch {
      return [];
    }
  }

  return [];
}


function normalizeObjectValue(
  value
) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsedValue =
        JSON.parse(value);

      return (
        parsedValue &&
        typeof parsedValue === "object" &&
        !Array.isArray(parsedValue)
      )
        ? parsedValue
        : null;
    } catch {
      return null;
    }
  }

  return null;
}


function normalizeResponsePayload(
  message
) {
  const rawPayload =
    message.ResponsePayload ??
    message.response_payload ??
    null;

  return normalizeObjectValue(
    rawPayload
  );
}


function normalizeEngine(
  message,
  responsePayload,
  role
) {
  const explicitEngine =
    responsePayload?.engine ??
    message.Engine ??
    message.engine ??
    null;

  if (explicitEngine) {
    return String(
      explicitEngine
    ).toUpperCase();
  }

  const queryType =
    message.QueryType ??
    message.query_type ??
    null;

  if (
    String(queryType || "")
      .toUpperCase() === "CHAT"
  ) {
    return "CHAT";
  }

  if (
    role === "ASSISTANT" &&
    (
      message.GeneratedQuery ||
      message.generated_query
    )
  ) {
    return "SQL";
  }

  if (role === "USER") {
    return null;
  }

  return "CHAT";
}


function normalizeHistoryMessage(
  message
) {
  const role = (
    message.MessageRole ??
    message.message_role ??
    ""
  ).toUpperCase();

  const executionStatus = (
    message.ExecutionStatus ??
    message.execution_status ??
    ""
  ).toLowerCase();

  const responsePayload =
    normalizeResponsePayload(
      message
    );

  const payloadRows =
    normalizeArrayValue(
      responsePayload?.rows
    );

  const directRows =
    normalizeArrayValue(
      message.Rows ??
      message.rows
    );

  const rows =
    payloadRows.length > 0
      ? payloadRows
      : directRows;

  const engine =
    normalizeEngine(
      message,
      responsePayload,
      role
    );

  const answer =
    responsePayload?.answer ??
    responsePayload?.summary ??
    responsePayload
      ?.executive_summary ??
    message.MessageText ??
    message.message_text ??
    "";

  return {
    id:
      message.MessageId ??
      message.message_id ??
      crypto.randomUUID(),

    role:
      role === "USER"
        ? "user"
        : "ai",

    engine,

    text: answer,

    answer,

    content: answer,

    executiveSummary:
      responsePayload
        ?.executive_summary ??
      message.ExecutiveSummary ??
      message.executive_summary ??
      null,

    keyInsights:
      normalizeArrayValue(
        responsePayload
          ?.key_insights ??
        message.KeyInsights ??
        message.key_insights
      ),

    visual:
      normalizeObjectValue(
        responsePayload?.visual ??
        message.Visual ??
        message.visual
      ),

    suggestions:
      normalizeArrayValue(
        responsePayload
          ?.suggestions ??
        responsePayload
          ?.suggested_questions ??
        message.Suggestions ??
        message.suggestions
      ),

    rows,

    generatedQuery:
      responsePayload
        ?.generated_sql ??
      responsePayload
        ?.executed_sql ??
      message.GeneratedQuery ??
      message.generated_query ??
      null,

    executedQuery:
      responsePayload
        ?.executed_sql ??
      null,

    queryType:
      message.QueryType ??
      message.query_type ??
      engine ??
      null,

    source:
      responsePayload?.source ??
      message.DataSource ??
      message.data_source ??
      (
        engine === "CHAT"
          ? "GPT"
          : "Azure SQL"
      ),

    status:
      responsePayload?.status ??
      executionStatus ??
      (
        role === "ASSISTANT"
          ? "success"
          : null
      ),

    executionTime:
      responsePayload
        ?.execution_time_ms ??
      message.ExecutionTimeMs ??
      message.execution_time_ms ??
      null,

    timings:
      responsePayload?.timings ??
      null,

    errorMessage:
      responsePayload?.message ??
      message.ErrorMessage ??
      message.error_message ??
      null,

    rowCount:
      responsePayload?.row_count ??
      message.RowCount ??
      message.row_count ??
      rows.length,

    requestPlan:
      responsePayload
        ?.request_plan ??
      null,
  };
}


function App() {
  const [
    messages,
    setMessages,
  ] = useState([
    initialMessage,
  ]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState(null);


  // -------------------------------------------------
  // Load conversations when the app starts
  // -------------------------------------------------

  useEffect(() => {
    loadConversationHistory();
  }, []);


  async function loadConversationHistory() {
    try {
      const history =
        await getConversations(
          currentUser.id
        );

      setConversations(
        Array.isArray(history)
          ? history
          : []
      );

    } catch (error) {
      console.error(
        "Unable to load conversations:",
        error
      );
    }
  }


  // -------------------------------------------------
  // Create a conversation for the first question
  // -------------------------------------------------

  async function ensureConversation(
    question
  ) {
    if (
      activeConversationId
    ) {
      return activeConversationId;
    }

    const title =
      createConversationTitle(
        question
      );

    const newConversation =
      await createConversation(
        currentUser,
        title
      );

    if (!newConversation?.id) {
      throw new Error(
        "The backend did not return a conversation ID."
      );
    }

    setActiveConversationId(
      newConversation.id
    );

    setConversations(
      (previous) => [
        newConversation,
        ...previous.filter(
          (conversation) =>
            conversation.id !==
            newConversation.id
        ),
      ]
    );

    return newConversation.id;
  }


  // -------------------------------------------------
  // Send a user question
  // -------------------------------------------------

  async function handleSend(
    question
  ) {
    const cleanQuestion =
      question?.trim();

    if (
      !cleanQuestion ||
      isLoading
    ) {
      return;
    }

    setIsLoading(true);

    let conversationId = null;

    try {
      conversationId =
        await ensureConversation(
          cleanQuestion
        );

    } catch (error) {
      setIsLoading(false);

      console.error(
        "Unable to create conversation:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to create conversation."
      );

      return;
    }


    const userMessage = {
      id:
        crypto.randomUUID(),

      role:
        "user",

      text:
        cleanQuestion,
    };


    const loadingId =
      crypto.randomUUID();


    setMessages(
      (previous) => [
        ...previous,

        userMessage,

        {
          id:
            loadingId,

          role:
            "ai",

          engine:
            "PLANNER",

          text:
            "Understanding your request and preparing the response...",

          isLoading:
            true,
        },
      ]
    );


    try {
      const response =
        await sendMessage(
          cleanQuestion,
          conversationId
        );


      const rows =
        Array.isArray(
          response?.rows
        )
          ? response.rows
          : (
              Array.isArray(
                response?.table
              )
                ? response.table
                : []
            );


      const responseEngine =
        String(
          response?.engine ||
          (
            rows.length > 0 ||
            response?.generated_sql
              ? "SQL"
              : "CHAT"
          )
        ).toUpperCase();


      const answer =
        response?.answer ||
        response?.summary ||
        response
          ?.executive_summary ||
        (
          responseEngine === "CHAT"
            ? "No response was generated."
            : "The query completed successfully."
        );


      const assistantMessage = {
        id:
          crypto.randomUUID(),

        role:
          "ai",

        engine:
          responseEngine,

        text:
          answer,

        answer,

        content:
          answer,

        executiveSummary:
          response
            ?.executive_summary ||
          null,

        keyInsights:
          Array.isArray(
            response?.key_insights
          )
            ? response.key_insights
            : [],

        visual:
          (
            response?.visual &&
            typeof response.visual ===
              "object"
          )
            ? response.visual
            : null,

        suggestions:
          Array.isArray(
            response?.suggestions
          )
            ? response.suggestions
            : (
                Array.isArray(
                  response
                    ?.suggested_questions
                )
                  ? response
                      .suggested_questions
                  : []
              ),

        rows,

        generatedQuery:
          response?.generated_sql ||
          response?.executed_sql ||
          null,

        executedQuery:
          response?.executed_sql ||
          null,

        queryType:
          responseEngine,

        source:
          response?.source ||
          (
            responseEngine === "CHAT"
              ? "GPT"
              : "Azure SQL"
          ),

        rowCount:
          response?.row_count ??
          rows.length,

        executionTime:
          response
            ?.execution_time_ms ??
          response
            ?.timings
            ?.request_total_ms ??
          null,

        timings:
          response?.timings ||
          null,

        status:
          response?.status ||
          "success",

        errorMessage:
          response?.message ||
          null,

        requestPlan:
          response?.request_plan ||
          null,
      };


      setMessages(
        (previous) =>
          previous.map(
            (message) =>
              message.id ===
              loadingId
                ? assistantMessage
                : message
          )
      );


      await loadConversationHistory();


    } catch (error) {
      const errorMessage = {
        id:
          crypto.randomUUID(),

        role:
          "ai",

        engine:
          "SYSTEM",

        text:
          error instanceof Error
            ? error.message
            : (
                "Unable to process the " +
                "request. Please try again."
              ),

        status:
          "error",

        source:
          "System",

        rows:
          [],

        keyInsights:
          [],

        suggestions:
          [],

        visual:
          null,
      };


      setMessages(
        (previous) =>
          previous.map(
            (message) =>
              message.id ===
              loadingId
                ? errorMessage
                : message
          )
      );


    } finally {
      setIsLoading(false);
    }
  }


  // -------------------------------------------------
  // Start a new conversation
  // -------------------------------------------------

  function handleNewChat() {
    if (
      isLoading
    ) {
      return;
    }

    setActiveConversationId(
      null
    );

    setMessages([
      initialMessage,
    ]);
  }


  // -------------------------------------------------
  // Open a previous conversation
  // -------------------------------------------------

  async function handleHistoryClick(
    conversationId
  ) {
    if (
      isLoading ||
      !conversationId
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const history =
        await getConversationMessages(
          conversationId
        );


      const formattedMessages =
        Array.isArray(history)
          ? history.map(
              normalizeHistoryMessage
            )
          : [];


      setActiveConversationId(
        conversationId
      );


      if (
        formattedMessages.length > 0
      ) {
        setMessages(
          formattedMessages
        );
      } else {
        setMessages([
          initialMessage,
        ]);
      }


    } catch (error) {
      console.error(
        "Unable to load conversation:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : (
              "Unable to load " +
              "conversation history."
            )
      );


    } finally {
      setIsLoading(false);
    }
  }


  return (
    <Layout
      user={
        currentUser
      }

      chatHistory={
        conversations
      }

      activeConversationId={
        activeConversationId
      }

      onHistoryClick={
        handleHistoryClick
      }

      onNewChat={
        handleNewChat
      }
    >
      <div className="chat-container">

        <ChatWindow
          messages={
            messages
          }

          onSuggestionClick={
            handleSend
          }
        />


        <div className="composer-section">

          <SuggestedQuestions
            questions={
              suggestedQuestions
            }

            onSelect={
              handleSend
            }

            disabled={
              isLoading
            }
          />


          <ChatInput
            onSend={
              handleSend
            }

            disabled={
              isLoading
            }

            placeholder=
              "Ask a general question or analyze your business data..."
          />

        </div>


        <div className="chat-footer">
          AI-generated answers and insights
          may require business validation.
        </div>

      </div>
    </Layout>
  );
}


export default App;