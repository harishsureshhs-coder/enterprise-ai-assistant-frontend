const AGENT_ID =
  "EXECUTIVE";

const NEW_CHAT_MARKER =
  "__NEW_CHAT__";


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
  sendMessageStream,
} from "./services/api";


import {
  createConversation,
  getConversations,
  getConversationMessages,
} from "./services/conversationApi";


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
// ACTIVE CONVERSATION STORAGE
//
// sessionStorage survives browser refresh,
// but does not permanently retain state forever.
//
// This gives us:
//
// open conversation
//       ↓
// refresh
//       ↓
// reopen same conversation
//
// New Chat deliberately stores a special marker.
// =========================================================

function getConversationStorageKey(
  userId
) {
  return (
    `enterprise-ai:`
    + `${AGENT_ID}:`
    + `${userId}:`
    + "activeConversation"
  );
}


function rememberActiveConversation(
  userId,
  conversationId
) {
  if (
    !userId ||
    !conversationId
  ) {
    return;
  }


  try {

    sessionStorage.setItem(
      getConversationStorageKey(
        userId
      ),
      conversationId
    );

  } catch (error) {

    console.warn(
      "Unable to persist active conversation:",
      error
    );
  }
}


function rememberNewChat(
  userId
) {
  if (!userId) {
    return;
  }


  try {

    sessionStorage.setItem(
      getConversationStorageKey(
        userId
      ),
      NEW_CHAT_MARKER
    );

  } catch (error) {

    console.warn(
      "Unable to persist New Chat state:",
      error
    );
  }
}


function getRememberedConversation(
  userId
) {
  if (!userId) {
    return null;
  }


  try {

    return sessionStorage.getItem(
      getConversationStorageKey(
        userId
      )
    );

  } catch {

    return null;
  }
}


// =========================================================
// CONVERSATION TITLE
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
// ARRAY NORMALIZER
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
// OBJECT NORMALIZER
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


      return (
        parsedValue &&
        typeof parsedValue ===
          "object" &&
        !Array.isArray(
          parsedValue
        )
      )
        ? parsedValue
        : null;


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
// ENGINE NORMALIZER
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
  const role = String(
    message.MessageRole ??
    message.message_role ??
    ""
  ).toUpperCase();


  const executionStatus =
    message.ExecutionStatus ??
    message.execution_status ??
    null;


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


  // =======================================================
  // STATUS
  //
  // Important:
  //
  // ExecutionStatus can now intentionally be NULL
  // for an Azure OpenAI/runtime failure.
  //
  // The ResponsePayload still contains:
  //
  // status = error
  // message = actual error
  // =======================================================

  const normalizedStatus =
    responsePayload?.status ??
    (
      executionStatus
        ? String(
            executionStatus
          ).toLowerCase()
        : (
            role ===
              "ASSISTANT"
              ? "success"
              : null
          )
    );


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
        responsePayload
          ?.visual ??
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
      responsePayload
        ?.source ??
      message.DataSource ??
      message.data_source ??
      (
        engine ===
          "CHAT"
          ? "GPT"
          : "Azure SQL"
      ),


    status:
      normalizedStatus,


    executionTime:
      responsePayload
        ?.execution_time_ms ??
      message.ExecutionTimeMs ??
      message.execution_time_ms ??
      null,


    timings:
      responsePayload
        ?.timings ??
      null,


    errorMessage:
      responsePayload
        ?.message ??
      message.ErrorMessage ??
      message.error_message ??
      null,


    rowCount:
      responsePayload
        ?.row_count ??
      message.RowCount ??
      message.row_count ??
      rows.length,


    requestPlan:
      responsePayload
        ?.request_plan ??
      null,
  };
}


// =========================================================
// APP
// =========================================================

function App() {

  // =======================================================
  // AUTHENTICATED USER
  // =======================================================

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState(
      null
    );


  const [
    userLoading,
    setUserLoading,
  ] =
    useState(
      true
    );


  const [
    userError,
    setUserError,
  ] =
    useState(
      null
    );


  // =======================================================
  // CHAT STATE
  // =======================================================

  const [
    messages,
    setMessages,
  ] =
    useState([
      initialMessage,
    ]);


  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false
    );


  const [
    conversations,
    setConversations,
  ] =
    useState(
      []
    );


  const [
    activeConversationId,
    setActiveConversationId,
  ] =
    useState(
      null
    );


  // =======================================================
  // LOAD ENTRA USER
  // =======================================================

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


        } catch (error) {

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


  // =======================================================
  // INITIALIZE CONVERSATION HISTORY
  //
  // This is the important refresh fix.
  //
  // Previous code:
  //
  // GET /conversations
  // → sidebar only
  //
  // New code:
  //
  // GET /conversations
  // → find previously active conversation
  // → GET /conversations/{id}/messages
  // → restore messages
  // =======================================================

  useEffect(
    () => {

      if (
        !currentUser?.id
      ) {

        return;
      }


      initializeConversationHistory();

    },
    [
      currentUser?.id,
    ]
  );


  // =======================================================
  // INITIAL HISTORY LOAD + RESTORE
  // =======================================================

  async function initializeConversationHistory() {

    if (
      !currentUser?.id
    ) {

      return;
    }


    setIsLoading(
      true
    );


    try {

      console.log(
        "Initializing Executive conversations:",
        currentUser.id
      );


      // ===================================================
      // LOAD SIDEBAR
      // ===================================================

      const history =
        await getConversations(
          currentUser.id,
          AGENT_ID
        );


      const conversationList =
        Array.isArray(
          history
        )
          ? history
          : [];


      setConversations(
        conversationList
      );


      console.log(
        "Executive conversations loaded:",
        conversationList.length
      );


      // ===================================================
      // READ LAST ACTIVE CONVERSATION
      // ===================================================

      const rememberedConversationId =
        getRememberedConversation(
          currentUser.id
        );


      console.log(
        "Remembered Executive conversation:",
        rememberedConversationId
      );


      // ===================================================
      // USER EXPLICITLY SELECTED NEW CHAT
      //
      // Do not automatically reopen old conversation.
      // ===================================================

      if (
        rememberedConversationId ===
        NEW_CHAT_MARKER
      ) {

        setActiveConversationId(
          null
        );


        setMessages([
          initialMessage,
        ]);


        return;
      }


      // ===================================================
      // DETERMINE CONVERSATION TO RESTORE
      //
      // 1. Previously active conversation
      // 2. Most recent conversation as fallback
      // ===================================================

      let conversationToRestore =
        null;


      if (
        rememberedConversationId
      ) {

        const exists =
          conversationList.some(
            (conversation) =>
              conversation.id ===
              rememberedConversationId
          );


        if (exists) {

          conversationToRestore =
            rememberedConversationId;
        }
      }


      // ---------------------------------------------------
      // No remembered ID yet.
      //
      // This handles the first refresh immediately after
      // deploying this change.
      // ---------------------------------------------------

      if (
        !conversationToRestore &&
        conversationList.length > 0
      ) {

        conversationToRestore =
          conversationList[0].id;
      }


      // ===================================================
      // NO CONVERSATIONS
      // ===================================================

      if (
        !conversationToRestore
      ) {

        setActiveConversationId(
          null
        );


        setMessages([
          initialMessage,
        ]);


        return;
      }


      // ===================================================
      // LOAD MESSAGES
      // ===================================================

      console.log(
        "Restoring Executive conversation:",
        conversationToRestore
      );


      const messageHistory =
        await getConversationMessages(
          conversationToRestore
        );


      console.log(
        "Restored Executive messages:",
        messageHistory
      );


      const formattedMessages =
        Array.isArray(
          messageHistory
        )
          ? messageHistory.map(
              normalizeHistoryMessage
            )
          : [];


      setActiveConversationId(
        conversationToRestore
      );


      rememberActiveConversation(
        currentUser.id,
        conversationToRestore
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
        "Unable to initialize Executive history:",
        error
      );


      setMessages([
        initialMessage,
      ]);


    } finally {

      setIsLoading(
        false
      );
    }
  }


  // =======================================================
  // REFRESH SIDEBAR ONLY
  //
  // Important:
  //
  // This function is used after a message is sent.
  // It does NOT reload all messages unnecessarily.
  // =======================================================

  async function loadConversationHistory() {

    if (
      !currentUser?.id
    ) {

      return;
    }


    try {

      const history =
        await getConversations(
          currentUser.id,
          AGENT_ID
        );


      setConversations(
        Array.isArray(
          history
        )
          ? history
          : []
      );


    } catch (error) {

      console.error(
        "Unable to refresh Executive conversation history:",
        error
      );
    }
  }


  // =======================================================
  // ENSURE CONVERSATION
  // =======================================================

  async function ensureConversation(
    question
  ) {

    if (
      activeConversationId
    ) {

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


    // -----------------------------------------------------
    // Remember immediately.
    //
    // Refresh during/after processing still restores
    // this conversation.
    // -----------------------------------------------------

    rememberActiveConversation(
      currentUser.id,
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


  // =======================================================
  // SEND QUESTION
  // =======================================================

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


    let conversationId =
      null;


    // =====================================================
    // ENSURE CONVERSATION
    // =====================================================

    try {

      conversationId =
        await ensureConversation(
          cleanQuestion
        );


    } catch (error) {

      setIsLoading(
        false
      );


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


    // =====================================================
    // USER MESSAGE
    // =====================================================

    const userMessage = {

      id:
        crypto.randomUUID(),

      role:
        "user",

      text:
        cleanQuestion,
    };


    // =====================================================
    // TEMPORARY LOADING MESSAGE
    // =====================================================

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
            "Processing your request...",

          isLoading:
            true,
        },

      ]
    );


    try {

      // ===================================================
      // SSE REQUEST
      // ===================================================

      const response =
        await sendMessageStream(

          cleanQuestion,

          conversationId,

          () => {

            setMessages(
              (previous) =>
                previous.map(
                  (message) =>
                    message.id ===
                    loadingId
                      ? {
                          ...message,

                          text:
                            "Processing your request...",
                        }
                      : message
                )
            );
          }
        );


      // ===================================================
      // ROWS
      // ===================================================

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


      // ===================================================
      // ENGINE
      // ===================================================

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


      // ===================================================
      // ANSWER
      // ===================================================

      const answer =
        response?.answer ||
        response?.summary ||
        response
          ?.executive_summary ||
        (
          responseEngine ===
            "CHAT"
            ? "No response was generated."
            : "The query completed successfully."
        );


      // ===================================================
      // ASSISTANT MESSAGE
      // ===================================================

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
            ?.executive_summary ??
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
            responseEngine ===
              "CHAT"
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
          response?.timings ??
          null,


        status:
          response?.status ??
          "success",


        errorMessage:
          response?.message ??
          null,


        requestPlan:
          response?.request_plan ??
          null,
      };


      // ===================================================
      // REPLACE LOADING MESSAGE
      // ===================================================

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


      // ===================================================
      // KEEP CURRENT CONVERSATION FOR REFRESH
      // ===================================================

      rememberActiveConversation(
        currentUser.id,
        conversationId
      );


      // ===================================================
      // REFRESH SIDEBAR
      // ===================================================

      await loadConversationHistory();


    } catch (error) {

      console.error(
        "Unable to process chat request:",
        error
      );


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
                "Unable to process the "
                + "request. Please try again."
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


      // ---------------------------------------------------
      // Conversation itself still exists.
      // Remember it so refresh restores persisted messages.
      // ---------------------------------------------------

      if (
        conversationId
      ) {

        rememberActiveConversation(
          currentUser.id,
          conversationId
        );
      }


    } finally {

      setIsLoading(
        false
      );
    }
  }


  // =======================================================
  // NEW CHAT
  // =======================================================

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


    // -----------------------------------------------------
    // Important:
    //
    // If user clicks New Chat and refreshes before asking
    // anything, don't automatically reopen an old chat.
    // -----------------------------------------------------

    rememberNewChat(
      currentUser?.id
    );
  }


  // =======================================================
  // HISTORY CLICK
  // =======================================================

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

      console.log(
        "Loading Executive messages:",
        conversationId
      );


      const history =
        await getConversationMessages(
          conversationId
        );


      console.log(
        "Executive messages loaded:",
        history
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


      rememberActiveConversation(
        currentUser.id,
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
              "Unable to load "
              + "conversation history."
            )
      );


    } finally {

      setIsLoading(
        false
      );
    }
  }


  // =======================================================
  // USER LOADING
  // =======================================================

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


  // =======================================================
  // USER ERROR
  // =======================================================

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


  // =======================================================
  // APPLICATION
  // =======================================================

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
          AI-generated answers and insights
          may require business validation.
        </div>

      </div>

    </Layout>
  );
}


export default App;