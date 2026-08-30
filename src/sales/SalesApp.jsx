import {
  useEffect,
  useState,
} from "react";

import "../App.css";

import Layout
  from "../components/layout/Layout";

import ChatWindow
  from "../components/chat/ChatWindow";

import ChatInput
  from "../components/ChatInput";

import SalesResponseOptions
  from "../components/sales/SalesResponseOptions";

import SalesRecordingPanel
  from "../components/sales/SalesRecordingPanel";

import SalesCustomerSelector
  from "../components/sales/SalesCustomerSelector";

import SalesBusinessSnapshot
  from "../components/sales/SalesBusinessSnapshot";

import SalesVisitPanel
  from "../components/sales/SalesVisitPanel";


import {
  getCurrentUser,
} from "../services/authService";


import {
  sendMessageStream,
} from "../services/api";


import {
  createConversation,
  getConversations,
  getConversationMessages,
} from "../services/conversationApi";


import {
  uploadSalesRecording,
  transcribeSalesRecording,
  summarizeSalesTranscript,
} from "../services/salesRecordingApi";


import {
  getSalesCustomerSnapshot,
} from "../services/salesCustomerApi";


import {
  startSalesVisit,
} from "../services/salesVisitApi";


// =========================================================
// AGENT
// =========================================================

const AGENT_ID =
  "SALES";


const ACTIVE_CONVERSATION_KEY =
  "sales-active-conversation";


// =========================================================
// INITIAL SALES MESSAGE
// =========================================================

const salesInitialMessage = {

  id:
    "sales-welcome",

  role:
    "ai",

  engine:
    "CHAT",

  text:
    "Hi! I'm your Sales Intelligence Agent. " +
    "How can I assist you today?",

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
// CREATE TITLE
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
// NORMALIZE HISTORY
// =========================================================

function normalizeHistoryMessage(
  message
) {

  const role = (
    message.MessageRole ??
    message.message_role ??
    ""
  ).toUpperCase();


  const responsePayload =
    normalizeObjectValue(
      message.ResponsePayload ??
      message.response_payload ??
      null
    );


  const rows =
    normalizeArrayValue(
      responsePayload?.rows ??
      message.Rows ??
      message.rows
    );


  const generatedQuery =
    responsePayload?.generated_sql ??
    responsePayload?.executed_sql ??
    message.GeneratedQuery ??
    message.generated_query ??
    null;


  const explicitEngine =
    responsePayload?.engine ??
    message.Engine ??
    message.engine ??
    null;


  const engine =
    explicitEngine
      ? String(
          explicitEngine
        ).toUpperCase()
      : (
          role ===
            "USER"
            ? null
            : (
                generatedQuery
                  ? "SQL"
                  : "CHAT"
              )
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

    generatedQuery,

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
      message.ExecutionStatus ??
      message.execution_status ??
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
// SALES APP
// =========================================================

function SalesApp() {

  // =====================================================
  // USER
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
  // CHAT
  // =====================================================

  const [
    messages,
    setMessages,
  ] = useState([
    salesInitialMessage,
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
  // RESPONSE MODE
  // =====================================================

  const [
    responseMode,
    setResponseMode,
  ] = useState(
    "text"
  );


  // =====================================================
  // CUSTOMER
  // =====================================================

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null);


  const [
    customerSnapshot,
    setCustomerSnapshot,
  ] = useState(null);


  const [
    isLoadingCustomerSnapshot,
    setIsLoadingCustomerSnapshot,
  ] = useState(false);


  const [
    customerSnapshotError,
    setCustomerSnapshotError,
  ] = useState(null);


  // =====================================================
  // VISIT
  // =====================================================

  const [
    activeVisit,
    setActiveVisit,
  ] = useState(null);


  const [
    isStartingVisit,
    setIsStartingVisit,
  ] = useState(false);


  const [
    startVisitError,
    setStartVisitError,
  ] = useState(null);


  // =====================================================
  // RECORDING
  // =====================================================

  const [
    salesRecording,
    setSalesRecording,
  ] = useState(null);


  const [
    savedRecording,
    setSavedRecording,
  ] = useState(null);


  const [
    isSavingRecording,
    setIsSavingRecording,
  ] = useState(false);


  const [
    isTranscribing,
    setIsTranscribing,
  ] = useState(false);


  const [
    isSummarizing,
    setIsSummarizing,
  ] = useState(false);


  const [
    transcription,
    setTranscription,
  ] = useState(null);


  const [
    conversationHighlights,
    setConversationHighlights,
  ] = useState([]);


  const [
    recordingProcessingError,
    setRecordingProcessingError,
  ] = useState(null);


  // =====================================================
  // AUTH
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
            "Sales authenticated user:",
            authenticatedUser
          );


          setCurrentUser(
            authenticatedUser
          );


        } catch (
          error
        ) {

          console.error(
            "Unable to load Sales Agent user:",
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
  // LOAD HISTORY AFTER AUTH
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
  // LOAD SALES HISTORY
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


      if (
        !restoreActive
      ) {

        return;
      }


      // =================================================
      // RESTORE CURRENT SALES CONVERSATION
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
              salesInitialMessage,
            ]
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to load Sales conversations:",
        error
      );
    }
  }


  // =====================================================
  // ENSURE NORMAL SALES CHAT
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
        "Backend did not return a conversation ID."
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
  // GET / CREATE SALES VISIT CONVERSATION
  // =====================================================

  async function getOrCreateSalesConversation() {

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


    if (
      !selectedCustomer?.bmd_name
    ) {

      throw new Error(
        "Selected customer is not available."
      );
    }


    const conversationTitle =
      `Visit - ${selectedCustomer.bmd_name}`;


    const newConversation =
      await createConversation(
        currentUser,
        conversationTitle,
        AGENT_ID
      );


    if (
      !newConversation?.id
    ) {

      throw new Error(
        "Unable to create Sales conversation."
      );
    }


    const conversationId =
      newConversation.id;


    setActiveConversationId(
      conversationId
    );


    sessionStorage.setItem(
      ACTIVE_CONVERSATION_KEY,
      conversationId
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
            conversationId
        ),

      ]
    );


    return conversationId;
  }


  // =====================================================
  // SELECT CUSTOMER
  // =====================================================

  async function handleCustomerSelect(
    customer
  ) {

    setSelectedCustomer(
      customer
    );


    setCustomerSnapshot(
      null
    );


    setCustomerSnapshotError(
      null
    );


    setActiveVisit(
      null
    );


    setStartVisitError(
      null
    );


    setIsStartingVisit(
      false
    );


    setSalesRecording(
      null
    );


    setSavedRecording(
      null
    );


    setTranscription(
      null
    );


    setConversationHighlights(
      []
    );


    setRecordingProcessingError(
      null
    );


    if (
      !customer?.bmd_code
    ) {

      return;
    }


    try {

      setIsLoadingCustomerSnapshot(
        true
      );


      const snapshot =
        await getSalesCustomerSnapshot({
          bmdCode:
            customer.bmd_code,
        });


      setCustomerSnapshot(
        snapshot
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to load customer snapshot:",
        error
      );


      setCustomerSnapshotError(
        error instanceof Error
          ? error.message
          : "Unable to load customer business snapshot."
      );


    } finally {

      setIsLoadingCustomerSnapshot(
        false
      );
    }
  }


  // =====================================================
  // START VISIT
  // =====================================================

  async function handleStartVisit() {

    if (
      !selectedCustomer?.bmd_code
    ) {

      setStartVisitError(
        "Please select a primary customer first."
      );


      return;
    }


    const visitUserId =
      currentUser?.email ||
      currentUser?.id;


    if (
      !visitUserId
    ) {

      setStartVisitError(
        "Authenticated user could not be identified."
      );


      return;
    }


    if (
      activeVisit?.visit_id
    ) {

      return;
    }


    try {

      setIsStartingVisit(
        true
      );


      setStartVisitError(
        null
      );


      const visit =
        await startSalesVisit({
          bmdCode:
            selectedCustomer.bmd_code,

          userId:
            visitUserId,

          conversationId:
            null,
        });


      if (
        !visit?.visit_id
      ) {

        throw new Error(
          "Visit was started but visit ID was not returned."
        );
      }


      setActiveVisit(
        visit
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to start Sales visit:",
        error
      );


      setStartVisitError(
        error instanceof Error
          ? error.message
          : "Unable to start customer visit."
      );


    } finally {

      setIsStartingVisit(
        false
      );
    }
  }


  // =====================================================
  // QUESTION
  // =====================================================

  async function handleQuestionSubmit(
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


    setResponseMode(
      "text"
    );


    await handleSend(
      cleanQuestion
    );
  }


  // =====================================================
  // RESPONSE MODE
  // =====================================================

  function handleResponseModeSelect(
    mode
  ) {

    setResponseMode(
      mode
    );
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
    // IMMEDIATE USER FEEDBACK
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

      const conversationId =
        await ensureConversation(
          cleanQuestion
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
                    ...message,

                    text:
                      "Analyzing the relevant sales data...",
                  }
                : message
          )
      );


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
            response?.generated_sql ||
            response?.executed_sql
              ? "SQL"
              : "CHAT"
          )
        ).toUpperCase();


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

        responseMode:
          "text",

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


      await loadConversationHistory(
        false
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to process Sales Agent request:",
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
                        : "Unable to process request.",

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
  // RECORDING READY
  // =====================================================

  function handleRecordingReady(
    audioBlob
  ) {

    if (
      audioBlob &&
      !activeVisit?.visit_id
    ) {

      setSalesRecording(
        null
      );


      setRecordingProcessingError(
        "Start the customer visit before recording."
      );


      return;
    }


    setSalesRecording(
      audioBlob
    );


    if (
      !audioBlob
    ) {

      setSavedRecording(
        null
      );


      setTranscription(
        null
      );


      setConversationHighlights(
        []
      );


      setRecordingProcessingError(
        null
      );
    }
  }


  // =====================================================
  // SAVE + TRANSCRIBE + SUMMARIZE
  // =====================================================

  async function handleSaveRecording() {

    if (
      !selectedCustomer?.bmd_code
    ) {

      alert(
        "Please select a primary customer first."
      );


      return;
    }


    if (
      !activeVisit?.visit_id
    ) {

      alert(
        "Please start the customer visit first."
      );


      return;
    }


    if (
      !salesRecording
    ) {

      alert(
        "Please record a customer conversation first."
      );


      return;
    }


    if (
      isSavingRecording ||
      isTranscribing ||
      isSummarizing
    ) {

      return;
    }


    setRecordingProcessingError(
      null
    );


    setTranscription(
      null
    );


    setConversationHighlights(
      []
    );


    try {

      setIsSavingRecording(
        true
      );


      // =================================================
      // CREATE / REUSE CONVERSATION
      // =================================================

      const conversationId =
        await getOrCreateSalesConversation();


      // =================================================
      // UPLOAD
      // =================================================

      const saved =
        await uploadSalesRecording({
          audioBlob:
            salesRecording,

          conversationId,

          visitId:
            activeVisit.visit_id,

          bmdCode:
            selectedCustomer.bmd_code,
        });


      if (
        !saved?.blob_name
      ) {

        throw new Error(
          "Recording was saved but Blob name was not returned."
        );
      }


      if (
        !saved?.artifact_id
      ) {

        throw new Error(
          "Recording was saved but artifact ID was not returned."
        );
      }


      setSavedRecording(
        saved
      );


      setIsSavingRecording(
        false
      );


      setActiveVisit(
        (
          previous
        ) => {

          if (
            !previous
          ) {

            return previous;
          }


          return {

            ...previous,

            conversation_id:
              conversationId,
          };
        }
      );


      // =================================================
      // TRANSCRIBE
      // =================================================

      setIsTranscribing(
        true
      );


      const transcribed =
        await transcribeSalesRecording({
          blobName:
            saved.blob_name,

          artifactId:
            saved.artifact_id,

          visitId:
            activeVisit.visit_id,

          locale:
            "en-IN",
        });


      setTranscription(
        transcribed
      );


      setIsTranscribing(
        false
      );


      const transcript =
        String(
          transcribed?.transcript ||
          ""
        ).trim();


      if (
        !transcript
      ) {

        throw new Error(
          "Speech transcription completed but no transcript was generated."
        );
      }


      // =================================================
      // SUMMARY
      // =================================================

      setIsSummarizing(
        true
      );


      const summary =
        await summarizeSalesTranscript({
          transcript,
        });


      const highlights =
        Array.isArray(
          summary?.highlights
        )
          ? summary.highlights
          : [];


      if (
        highlights.length ===
        0
      ) {

        throw new Error(
          "Summary completed but no highlights were returned."
        );
      }


      setConversationHighlights(
        highlights
      );


      setSalesRecording(
        null
      );


    } catch (
      error
    ) {

      console.error(
        "Sales recording processing failed:",
        error
      );


      setRecordingProcessingError(
        error instanceof Error
          ? error.message
          : "Unable to process Sales recording."
      );


    } finally {

      setIsSavingRecording(
        false
      );


      setIsTranscribing(
        false
      );


      setIsSummarizing(
        false
      );
    }
  }


  // =====================================================
  // NEW CHAT
  // =====================================================

  function handleNewChat() {

    if (
      isLoading ||
      isStartingVisit ||
      isSavingRecording ||
      isTranscribing ||
      isSummarizing
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
      salesInitialMessage,
    ]);


    setResponseMode(
      "text"
    );


    setSelectedCustomer(
      null
    );


    setCustomerSnapshot(
      null
    );


    setCustomerSnapshotError(
      null
    );


    setIsLoadingCustomerSnapshot(
      false
    );


    setActiveVisit(
      null
    );


    setIsStartingVisit(
      false
    );


    setStartVisitError(
      null
    );


    setSalesRecording(
      null
    );


    setSavedRecording(
      null
    );


    setTranscription(
      null
    );


    setConversationHighlights(
      []
    );


    setRecordingProcessingError(
      null
    );
  }


  // =====================================================
  // OPEN HISTORY
  // =====================================================

  async function handleHistoryClick(
    conversationId
  ) {

    if (
      isLoading ||
      isStartingVisit ||
      isSavingRecording ||
      isTranscribing ||
      isSummarizing ||
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
              salesInitialMessage,
            ]
      );


      // =================================================
      // Sales customer/visit reconstruction can be
      // added later from conversation metadata.
      // =================================================

      setSelectedCustomer(
        null
      );


      setCustomerSnapshot(
        null
      );


      setActiveVisit(
        null
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to load Sales conversation:",
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
        className=
          "sales-page-status"
      >

        Loading your Sales Intelligence Agent...

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
        className=
          "sales-page-status"
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

      headerSubtitle=
        "Sales Intelligence Agent"
    >

      <div
        className=
          "chat-container sales-chat-container"
      >

        <ChatWindow
          messages={
            messages
          }

          onSuggestionClick={
            handleQuestionSubmit
          }
        />


        <div
          className=
            "composer-section"
        >

          <SalesCustomerSelector
            selectedCustomer={
              selectedCustomer
            }

            onCustomerSelect={
              handleCustomerSelect
            }

            disabled={
              isLoading ||
              isStartingVisit ||
              isSavingRecording ||
              isTranscribing ||
              isSummarizing
            }
          />


          <SalesBusinessSnapshot
            snapshot={
              customerSnapshot
            }

            loading={
              isLoadingCustomerSnapshot
            }

            error={
              customerSnapshotError
            }
          />


          <SalesVisitPanel
            selectedCustomer={
              selectedCustomer
            }

            activeVisit={
              activeVisit
            }

            isStartingVisit={
              isStartingVisit
            }

            startVisitError={
              startVisitError
            }

            onStartVisit={
              handleStartVisit
            }

            disabled={
              isLoadingCustomerSnapshot ||
              isLoading ||
              isSavingRecording ||
              isTranscribing ||
              isSummarizing
            }
          />


          {!selectedCustomer && (

            <div
              className=
                "sales-processing-status"
            >

              Select a primary customer to begin.

            </div>

          )}


          {selectedCustomer &&
           !activeVisit?.visit_id && (

            <div
              className=
                "sales-processing-status"
            >

              Start the customer visit before recording the conversation.

            </div>

          )}


          <SalesRecordingPanel
            disabled={
              !selectedCustomer ||
              !activeVisit?.visit_id ||
              isLoading ||
              isLoadingCustomerSnapshot ||
              isStartingVisit ||
              isSavingRecording ||
              isTranscribing ||
              isSummarizing
            }

            onRecordingReady={
              handleRecordingReady
            }

            onSaveRecording={
              handleSaveRecording
            }

            isSaving={
              isSavingRecording
            }

            isSaved={
              Boolean(
                savedRecording
              )
            }
          />


          {isSavingRecording && (

            <div
              className=
                "sales-processing-status"
            >

              Saving recording...

            </div>

          )}


          {isTranscribing && (

            <div
              className=
                "sales-processing-status"
            >

              Transcribing conversation...

            </div>

          )}


          {isSummarizing && (

            <div
              className=
                "sales-processing-status"
            >

              Generating conversation highlights...

            </div>

          )}


          {recordingProcessingError && (

            <div
              className=
                "sales-recording-error"
            >

              {recordingProcessingError}

            </div>

          )}


          {conversationHighlights.length >
            0 && (

            <div
              className=
                "sales-conversation-summary"
            >

              <div
                className=
                  "sales-conversation-summary-header"
              >

                <strong>
                  Conversation Highlights
                </strong>

              </div>


              <ul>

                {conversationHighlights.map(
                  (
                    highlight,
                    index
                  ) => (

                    <li
                      key={
                        `${index}-${highlight}`
                      }
                    >

                      {highlight}

                    </li>

                  )
                )}

              </ul>

            </div>

          )}


          {transcription?.transcript && (

            <details
              className=
                "sales-transcript-panel"
            >

              <summary>
                View Transcript
              </summary>


              <p>
                {transcription.transcript}
              </p>

            </details>

          )}


          <SalesResponseOptions
            selectedMode={
              responseMode
            }

            onSelect={
              handleResponseModeSelect
            }

            disabled={
              isLoading ||
              isStartingVisit ||
              isSavingRecording ||
              isTranscribing ||
              isSummarizing
            }
          />


          <ChatInput
            onSend={
              handleQuestionSubmit
            }

            disabled={
              isLoading
            }

            placeholder=
              "Ask about a customer, sales trend or customer visit..."
          />

        </div>


        <div
          className=
            "chat-footer"
        >

          AI-generated sales insights may require business validation.

        </div>

      </div>

    </Layout>
  );
}


export default SalesApp;