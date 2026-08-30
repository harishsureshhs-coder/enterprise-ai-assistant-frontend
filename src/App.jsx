import {
  useEffect,
  useState,
} from "react";

import "./App.css";

import Layout from "./components/layout/Layout";
import ChatWindow from "./components/chat/ChatWindow";
import ChatInput from "./components/ChatInput";
import SuggestedQuestions from "./components/SuggestedQuestions";

import {
  getCurrentUser,
} from "./services/authService";

import {
  sendMessageStream,
} from "./services/api";

import {
  createConversation,
  getConversations,
  getConversationMessages,
} from "./services/conversationApi";


// =========================================================
// AGENT
// =========================================================

const AGENT_ID =
  "EXECUTIVE";


const ACTIVE_CONVERSATION_KEY =
  "executive-active-conversation";


// =========================================================
// INITIAL MESSAGE
// =========================================================

const initialMessage = {
  id:
    "welcome",

  role:
    "ai",

  engine:
    "CHAT",

  text:
    "Hi! I'm your MA AI Assistant. How can I help you today?",

  source:
    "GPT",

  status:
    "success",

  rows:
    [],

  keyInsights:
    [],

  suggestions:
    [],
};


// =========================================================
// SUGGESTED QUESTIONS
// =========================================================

const suggestedQuestions = [
  "Explain Azure Data Factory",
  "Show total TGS",
  "Show TGS by Distribution Channel",
  "Show top 3 CBF by TGS",
  "Show monthly TGS trend",
];


// =========================================================
// CREATE CONVERSATION TITLE
// =========================================================

function createConversationTitle(
  question
) {

  const maximumLength =
    32;


  if (
    question.length <=
    maximumLength
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


// =========================================================
// NORMALIZE ARRAY
// =========================================================

function normalizeArrayValue(
  value
) {

  if (
    Array.isArray(
      value
    )
  ) {

    return value;
  }


  if (
    typeof value ===
    "string"
  ) {

    try {

      const parsedValue =
        JSON.parse(
          value
        );


      return Array.isArray(
        parsedValue
      )
        ? parsedValue
        : [];


    } catch {

      return [];
    }
  }


  return [];
}


// =========================================================
// NORMALIZE OBJECT
// =========================================================

function normalizeObjectValue(
  value
) {

  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {

    return value;
  }


  if (
    typeof value ===
    "string"
  ) {

    try {

      const parsedValue =
        JSON.parse(
          value
        );


      if (
        parsedValue &&
        typeof parsedValue ===
          "object" &&
        !Array.isArray(
          parsedValue
        )
      ) {

        return parsedValue;
      }


      return null;


    } catch {

      return null;
    }
  }


  return null;
}


// =========================================================
// RESPONSE PAYLOAD
// =========================================================

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


// =========================================================
// ENGINE
// =========================================================

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


  if (
    explicitEngine
  ) {

    return String(
      explicitEngine
    ).toUpperCase();
  }


  const queryType =
    message.QueryType ??
    message.query_type ??
    null;


  if (
    String(
      queryType || ""
    ).toUpperCase() ===
      "CHAT"
  ) {

    return "CHAT";
  }


  if (
    role ===
      "ASSISTANT" &&
    (
      message.GeneratedQuery ||
      message.generated_query
    )
  ) {

    return "SQL";
  }


  if (
    role ===
    "USER"
  ) {

    return null;
  }


  return "CHAT";
}


// =========================================================
// NORMALIZE HISTORY MESSAGE
// =========================================================

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
    responsePayload?.executive_summary ??
    message.MessageText ??
    message.message_text ??
    "";


  return {

    id:
      message.MessageId ??
      message.message_id ??
      crypto.randomUUID(),

    role:
      role ===
        "USER"
        ? "user"
        : "ai",

    engine,

    text:
      answer,

    answer,

    content:
      answer,

    executiveSummary:
      responsePayload?.executive_summary ??
      message.ExecutiveSummary ??
      message.executive_summary ??
      null,

    keyInsights:
      normalizeArrayValue(
        responsePayload?.key_insights ??
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
        responsePayload?.suggestions ??
        responsePayload?.suggested_questions ??
        message.Suggestions ??
        message.suggestions
      ),

    rows,

    generatedQuery:
      responsePayload?.generated_sql ??
      responsePayload?.executed_sql ??
      message.GeneratedQuery ??
      message.generated_query ??
      null,

    executedQuery:
      responsePayload?.executed_sql ??
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
        engine ===
          "CHAT"
          ? "GPT"
          : "Azure SQL"
      ),

    status:
      responsePayload?.status ??
      executionStatus ??
      (
        role ===
          "ASSISTANT"
          ? "success"
          : null
      ),

    executionTime:
      responsePayload?.execution_time_ms ??
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
      responsePayload?.request_plan ??
      null,
  };
}


// =========================================================
// EXECUTIVE APP
// =========================================================

function App() {

  // =====================================================
  // AUTHENTICATED USER
  // =====================================================

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);


  const [
    userLoading,
    setUserLoading,
  ] = useState(true);


  const [
    userError,
    setUserError,
  ] = useState(null);


  // =====================================================
  // CHAT STATE
  // =====================================================

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


  // =====================================================
  // LOAD AUTHENTICATED USER
  // =====================================================

  useEffect(
    () => {

      async function loadAuthenticatedUser() {

        try {

          setUserLoading(
            true
          );


          setUserError(
            null
          );


          const authenticatedUser =
            await getCurrentUser();


          if (
            !authenticatedUser?.id
          ) {

            throw new Error(
              "Authenticated Entra user could not be loaded."
            );
          }


          console.log(
            "Authenticated Executive user:",
            authenticatedUser
          );


          setCurrentUser(
            authenticatedUser
          );


        } catch (
          error
        ) {

          console.error(
            "Unable to load authenticated user:",
            error
          );


          setUserError(
            error instanceof Error
              ? error.message
              : "Unable to load authenticated user."
          );


        } finally {

          setUserLoading(
            false
          );
        }
      }


      loadAuthenticatedUser();

    },
    []
  );


  // =====================================================
  // LOAD HISTORY AFTER USER AVAILABLE
  // =====================================================

  useEffect(
    () => {

      if (
        !currentUser?.id
      ) {

        return;
      }


      loadConversationHistory(
        true
      );

    },
    [
      currentUser?.id,
    ]
  );


  // =====================================================
  // LOAD EXECUTIVE CONVERSATIONS
  //
  // restoreActive=true:
  // used only during initial page load / refresh.
  //
  // restoreActive=false:
  // only refreshes sidebar after sending a question.
  // =====================================================

  async function loadConversationHistory(
    restoreActive = false
  ) {

    if (
      !currentUser?.id
    ) {

      return;
    }


    try {

      console.log(
        "Loading Executive conversation history:",
        {
          userId:
            currentUser.id,

          agentId:
            AGENT_ID,

          restoreActive,
        }
      );


      const history =
        await getConversations(
          currentUser.id,
          AGENT_ID
        );


      const normalizedHistory =
        Array.isArray(
          history
        )
          ? history
          : [];


      setConversations(
        normalizedHistory
      );


      // =================================================
      // SIDEBAR ONLY REFRESH
      // =================================================

      if (
        !restoreActive
      ) {

        return;
      }


      // =================================================
      // RESTORE ACTIVE CONVERSATION AFTER PAGE REFRESH
      // =================================================

      const storedConversationId =
        sessionStorage.getItem(
          ACTIVE_CONVERSATION_KEY
        );


      if (
        !storedConversationId
      ) {

        return;
      }


      const conversationExists =
        normalizedHistory.some(
          (
            conversation
          ) =>
            conversation.id ===
            storedConversationId
        );


      if (
        !conversationExists
      ) {

        sessionStorage.removeItem(
          ACTIVE_CONVERSATION_KEY
        );


        return;
      }


      const historyMessages =
        await getConversationMessages(
          storedConversationId
        );


      const formattedMessages =
        Array.isArray(
          historyMessages
        )
          ? historyMessages.map(
              normalizeHistoryMessage
            )
          : [];


      setActiveConversationId(
        storedConversationId
      );


      setMessages(
        formattedMessages.length > 0
          ? formattedMessages
          : [
              initialMessage,
            ]
      );


      console.log(
        "Executive conversation restored:",
        storedConversationId
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to load Executive conversation history:",
        error
      );      
    }
  }


  // =====================================================
  // CREATE / REUSE CONVERSATION
  // =====================================================

  async function ensureConversation(
    question
  ) {

    if (
      activeConversationId
    ) {

      sessionStorage.setItem(
        ACTIVE_CONVERSATION_KEY,
        activeConversationId
      );


      return activeConversationId;
    }


    if (
      !currentUser?.id
    ) {

      throw new Error(
        "Authenticated user is not available."
      );
    }


    const title =
      createConversationTitle(
        question
      );


    const newConversation =
      await createConversation(
        currentUser,
        title,
        AGENT_ID
      );


    if (
      !newConversation?.id
    ) {

      throw new Error(
        "The backend did not return a conversation ID."
      );
    }


    setActiveConversationId(
      newConversation.id
    );


    sessionStorage.setItem(
      ACTIVE_CONVERSATION_KEY,
      newConversation.id
    );


    setConversations(
      (
        previous
      ) => [

        newConversation,

        ...previous.filter(
          (
            conversation
          ) =>
            conversation.id !==
            newConversation.id
        ),

      ]
    );


    return newConversation.id;
  }


  // =====================================================
  // SEND QUESTION
  // =====================================================

  async function handleSend(
    question
  ) {

    const cleanQuestion =
      String(
        question || ""
      ).trim();


    if (
      !cleanQuestion ||
      isLoading
    ) {

      return;
    }


    if (
      !currentUser?.id
    ) {

      alert(
        "Unable to identify the authenticated user."
      );


      return;
    }


    setIsLoading(
      true
    );


    // ===================================================
    // SHOW QUESTION IMMEDIATELY
    // ===================================================

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
      (
        previous
      ) => [

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
            "Understanding your question...",

          isLoading:
            true,
        },

      ]
    );


    try {

      // =================================================
      // CREATE / REUSE CONVERSATION
      // =================================================

      const conversationId =
        await ensureConversation(
          cleanQuestion
        );


      // =================================================
      // UPDATE THINKING STATE
      // =================================================

      setMessages(
        (
          previous
        ) =>
          previous.map(
            (
              message
            ) =>
              message.id ===
                loadingId
                ? {
                    ...message,

                    text:
                      "Analyzing the relevant business data...",
                  }
                : message
          )
      );


      // =================================================
      // SSE REQUEST
      // =================================================

      const response =
        await sendMessageStream(
          cleanQuestion,
          conversationId,

          () => {

            setMessages(
              (
                previous
              ) =>
                previous.map(
                  (
                    message
                  ) =>
                    message.id ===
                      loadingId
                      ? {
                          ...message,

                          text:
                            "Preparing the response...",
                        }
                      : message
                )
            );
          }
        );


      // =================================================
      // ROWS
      // =================================================

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


      // =================================================
      // ENGINE
      // =================================================

      const responseEngine =
        String(
          response?.engine ||
          (
            rows.length > 0 ||
            response?.generated_sql ||
            response?.executed_sql
              ? "SQL"
              : "CHAT"
          )
        ).toUpperCase();


      // =================================================
      // ANSWER
      // =================================================

      const answer =
        response?.answer ||
        response?.summary ||
        response?.executive_summary ||
        (
          responseEngine ===
            "CHAT"
            ? "No response was generated."
            : "The query completed successfully."
        );


      // =================================================
      // ASSISTANT MESSAGE
      // =================================================

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
          response?.executive_summary ||
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
                  response?.suggested_questions
                )
                  ? response.suggested_questions
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
            responseEngine ===
              "CHAT"
              ? "GPT"
              : "Azure SQL"
          ),

        rowCount:
          response?.row_count ??
          rows.length,

        executionTime:
          response?.execution_time_ms ??
          response?.timings?.request_total_ms ??
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


      // =================================================
      // REPLACE LOADING MESSAGE
      // =================================================

      setMessages(
        (
          previous
        ) =>
          previous.map(
            (
              message
            ) =>
              message.id ===
                loadingId
                ? assistantMessage
                : message
          )
      );


      // =================================================
      // REFRESH SIDEBAR ONLY
      // =================================================

      await loadConversationHistory(
        false
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to process Executive request:",
        error
      );


      setMessages(
        (
          previous
        ) =>
          previous.map(
            (
              message
            ) =>
              message.id ===
                loadingId
                ? {

                    id:
                      crypto.randomUUID(),

                    role:
                      "ai",

                    engine:
                      "SYSTEM",

                    text:
                      error instanceof Error
                        ? error.message
                        : "Unable to process the request.",

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
                  }
                : message
          )
      );


    } finally {

      setIsLoading(
        false
      );
    }
  }


  // =====================================================
  // NEW CHAT
  // =====================================================

  function handleNewChat() {

    if (
      isLoading
    ) {

      return;
    }


    sessionStorage.removeItem(
      ACTIVE_CONVERSATION_KEY
    );


    setActiveConversationId(
      null
    );


    setMessages([
      initialMessage,
    ]);
  }


  // =====================================================
  // OPEN PREVIOUS CONVERSATION
  // =====================================================

  async function handleHistoryClick(
    conversationId
  ) {

    if (
      isLoading ||
      !conversationId
    ) {

      return;
    }


    setIsLoading(
      true
    );


    try {

      const history =
        await getConversationMessages(
          conversationId
        );


      const formattedMessages =
        Array.isArray(
          history
        )
          ? history.map(
              normalizeHistoryMessage
            )
          : [];


      setActiveConversationId(
        conversationId
      );


      sessionStorage.setItem(
        ACTIVE_CONVERSATION_KEY,
        conversationId
      );


      setMessages(
        formattedMessages.length > 0
          ? formattedMessages
          : [
              initialMessage,
            ]
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to load conversation:",
        error
      );


      alert(
        error instanceof Error
          ? error.message
          : "Unable to load conversation history."
      );


    } finally {

      setIsLoading(
        false
      );
    }
  }


  // =====================================================
  // USER LOADING
  // =====================================================

  if (
    userLoading
  ) {

    return (

      <div
        style={{
          height:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          fontFamily:
            "Arial, sans-serif",

          color:
            "#174779",
        }}
      >

        Loading your profile...

      </div>
    );
  }


  // =====================================================
  // USER ERROR
  // =====================================================

  if (
    userError ||
    !currentUser
  ) {

    return (

      <div
        style={{
          height:
            "100vh",

          display:
            "flex",

          flexDirection:
            "column",

          alignItems:
            "center",

          justifyContent:
            "center",

          gap:
            8,

          fontFamily:
            "Arial, sans-serif",
        }}
      >

        <strong>
          Unable to load your user profile.
        </strong>


        <span>
          {userError}
        </span>

      </div>
    );
  }


  // =====================================================
  // UI
  // =====================================================

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

      <div
        className=
          "chat-container"
      >

        <ChatWindow
          messages={
            messages
          }

          onSuggestionClick={
            handleSend
          }
        />


        <div
          className=
            "composer-section"
        >

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


        <div
          className=
            "chat-footer"
        >

          AI-generated answers and insights may require business validation.

        </div>

      </div>

    </Layout>
  );
}


export default App;