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


  const engine = (
    responsePayload?.engine ??
    message.Engine ??
    message.engine ??
    (
      role === "USER"
        ? null
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
      role === "USER"
        ? "user"
        : "ai",

    engine:
      engine
        ? String(
            engine
          ).toUpperCase()
        : null,

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
      message.ExecutionStatus ??
      message.execution_status ??
      (
        role === "ASSISTANT"
          ? "success"
          : null
      ),

    executionTime:
      responsePayload?.execution_time_ms ??
      message.ExecutionTimeMs ??
      message.execution_time_ms ??
      null,

    rowCount:
      responsePayload?.row_count ??
      message.RowCount ??
      message.row_count ??
      rows.length,
  };
}


// =========================================================
// SALES APP
// =========================================================

function SalesApp() {

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
  // SALES VISIT
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


  // =====================================================
  // RECORDING PROCESSING
  // =====================================================

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


  // =====================================================
  // TRANSCRIPTION
  // =====================================================

  const [
    transcription,
    setTranscription,
  ] = useState(null);


  // =====================================================
  // CONVERSATION HIGHLIGHTS
  // =====================================================

  const [
    conversationHighlights,
    setConversationHighlights,
  ] = useState([]);


  // =====================================================
  // RECORDING ERROR
  // =====================================================

  const [
    recordingProcessingError,
    setRecordingProcessingError,
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
            "Sales authenticated user:",
            authenticatedUser
          );


          setCurrentUser(
            authenticatedUser
          );


        } catch (error) {

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
  // LOAD CONVERSATION HISTORY
  // =====================================================

  useEffect(
    () => {

      if (
        !currentUser?.id
      ) {

        return;
      }


      loadConversationHistory();

    },
    [
      currentUser?.id,
    ]
  );


  // =====================================================
  // LOAD CONVERSATIONS
  // =====================================================

  async function loadConversationHistory() {

    if (
      !currentUser?.id
    ) {

      return;
    }


    try {

      const history =
        await getConversations(
          currentUser.id
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
        "Unable to load Sales conversations:",
        error
      );
    }
  }


  // =====================================================
  // ENSURE NORMAL CHAT CONVERSATION
  //
  // Used when the user sends a normal typed question.
  // =====================================================

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
        "SALES"
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


  // =====================================================
  // GET OR CREATE SALES VISIT CONVERSATION
  //
  // IMPORTANT:
  //
  // Start Visit does NOT create a conversation.
  //
  // Conversation is created only when an actual
  // interaction happens.
  //
  // Example:
  //
  // - recording
  // - typed Sales question
  // =====================================================

  async function getOrCreateSalesConversation() {

    // ===================================================
    // EXISTING CONVERSATION
    // ===================================================

    if (
      activeConversationId
    ) {

      console.log(
        "Reusing existing Sales conversation:",
        activeConversationId
      );


      return activeConversationId;
    }


    // ===================================================
    // AUTH USER
    // ===================================================

    if (
      !currentUser?.id
    ) {

      throw new Error(
        "Authenticated user is not available."
      );
    }


    // ===================================================
    // CUSTOMER REQUIRED
    // ===================================================

    if (
      !selectedCustomer?.bmd_name
    ) {

      throw new Error(
        "Selected customer is not available."
      );
    }


    // ===================================================
    // CREATE CONVERSATION
    // ===================================================

    const conversationTitle =
      `Visit - ${selectedCustomer.bmd_name}`;


    console.log(
      "Creating Sales conversation:",
      conversationTitle
    );


    const newConversation =
      await createConversation(
        currentUser,
        conversationTitle
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


    // ===================================================
    // SET ACTIVE CONVERSATION
    // ===================================================

    setActiveConversationId(
      conversationId
    );


    // ===================================================
    // ADD TO HISTORY
    // ===================================================

    setConversations(
      (previous) => [

        newConversation,

        ...previous.filter(
          (conversation) =>
            conversation.id !==
            conversationId
        ),

      ]
    );


    console.log(
      "Sales conversation created:",
      conversationId
    );


    return conversationId;
  }


  // =====================================================
  // SELECT CUSTOMER
  // =====================================================

  async function handleCustomerSelect(
    customer
  ) {

    console.log(
      "Selected Sales customer:",
      customer
    );


    // ===================================================
    // CUSTOMER
    // ===================================================

    setSelectedCustomer(
      customer
    );


    setCustomerSnapshot(
      null
    );


    setCustomerSnapshotError(
      null
    );


    // ===================================================
    // VISIT
    //
    // Changing customer invalidates previous visit.
    // ===================================================

    setActiveVisit(
      null
    );


    setStartVisitError(
      null
    );


    setIsStartingVisit(
      false
    );


    // ===================================================
    // CLEAR RECORDING CONTEXT
    // ===================================================

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


    // ===================================================
    // CUSTOMER CLEARED
    // ===================================================

    if (
      !customer?.bmd_code
    ) {

      return;
    }


    // ===================================================
    // LOAD SNAPSHOT
    // ===================================================

    try {

      setIsLoadingCustomerSnapshot(
        true
      );


      const snapshot =
        await getSalesCustomerSnapshot({
          bmdCode:
            customer.bmd_code,
        });


      console.log(
        "Sales customer snapshot:",
        snapshot
      );


      setCustomerSnapshot(
        snapshot
      );


    } catch (error) {

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
  // START SALES VISIT
  //
  // SCENARIO 1:
  //
  // Start Visit
  // → no recording/chat
  // → conversation_id remains NULL
  //
  // This is intentional.
  // =====================================================

  async function handleStartVisit() {

    // ===================================================
    // CUSTOMER REQUIRED
    // ===================================================

    if (
      !selectedCustomer?.bmd_code
    ) {

      setStartVisitError(
        "Please select a primary customer first."
      );


      return;
    }


    // ===================================================
    // USER REQUIRED
    //
    // Prefer readable Entra login/email.
    //
    // Example:
    // JUJ2kor@bosch.com
    // ===================================================

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


    // ===================================================
    // ALREADY STARTED
    // ===================================================

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


      console.log(
        "Starting Sales visit:",
        {
          bmdCode:
            selectedCustomer.bmd_code,

          bmdName:
            selectedCustomer.bmd_name,

          userId:
            visitUserId,

          conversationId:
            null,
        }
      );


      // =================================================
      // IMPORTANT:
      //
      // Do NOT create conversation here.
      //
      // conversation_id remains NULL until an actual
      // recording or chat interaction occurs.
      // =================================================

      const visit =
        await startSalesVisit({
          bmdCode:
            selectedCustomer.bmd_code,

          userId:
            currentUser.email,

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


      console.log(
        "Sales visit started:",
        visit
      );


      setActiveVisit(
        visit
      );


    } catch (error) {

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
  // NORMAL SALES QUESTION
  // =====================================================

  async function handleQuestionSubmit(
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


    console.log(
      "Sales response mode:",
      mode
    );
  }


  // =====================================================
  // SEND CHAT
  // =====================================================

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


    // ===================================================
    // CREATE / REUSE CONVERSATION
    //
    // Typed question counts as a real interaction.
    // ===================================================

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
        "Unable to create Sales conversation:",
        error
      );


      alert(
        error instanceof Error
          ? error.message
          : "Unable to create conversation."
      );


      return;
    }


    // ===================================================
    // USER MESSAGE
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

      console.error(
        "Unable to process Sales Agent request:",
        error
      );


      setMessages(
        (previous) =>
          previous.map(
            (message) =>
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

    // ===================================================
    // VISIT MUST EXIST
    // ===================================================

    if (
      audioBlob &&
      !activeVisit?.visit_id
    ) {

      console.error(
        "Recording created without active Sales visit."
      );


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


    // ===================================================
    // NEW RECORDING RESET
    // ===================================================

    if (!audioBlob) {

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


      return;
    }


    console.log(
      "Sales recording ready:",
      {
        size:
          audioBlob.size,

        type:
          audioBlob.type,

        visitId:
          activeVisit?.visit_id,

        bmdCode:
          selectedCustomer?.bmd_code,
      }
    );
  }


  // =====================================================
  // SAVE + TRANSCRIBE + SUMMARIZE
  //
  // SCENARIO 2:
  //
  // Actual recording exists.
  //
  // Only NOW do we create/reuse conversation_id.
  // =====================================================

  async function handleSaveRecording() {

    // ===================================================
    // CUSTOMER
    // ===================================================

    if (
      !selectedCustomer?.bmd_code
    ) {

      alert(
        "Please select a primary customer first."
      );


      return;
    }


    // ===================================================
    // ACTIVE VISIT
    // ===================================================

    if (
      !activeVisit?.visit_id
    ) {

      alert(
        "Please start the customer visit first."
      );


      return;
    }


    // ===================================================
    // RECORDING
    // ===================================================

    if (
      !salesRecording
    ) {

      alert(
        "Please record a customer conversation first."
      );


      return;
    }


    // ===================================================
    // DUPLICATE PROCESSING
    // ===================================================

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
      // STEP 1
      // CREATE / REUSE CONVERSATION
      //
      // Conversation exists only because an actual
      // recording now exists.
      // =================================================

      const conversationId =
        await getOrCreateSalesConversation();


      console.log(
        "Recording conversation context:",
        {
          conversationId,

          visitId:
            activeVisit.visit_id,

          bmdCode:
            selectedCustomer.bmd_code,
        }
      );


      // =================================================
      // STEP 2
      // UPLOAD RECORDING
      //
      // Backend:
      //
      // - updates sales_visit.conversation_id
      // - uploads Blob
      // - creates ai_app.artifact
      // =================================================

      const saved =
        await uploadSalesRecording({
          audioBlob:
            salesRecording,

          conversationId:
            conversationId,

          visitId:
            activeVisit.visit_id,

          bmdCode:
            selectedCustomer.bmd_code,
        });


      console.log(
        "Sales recording saved:",
        saved
      );


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


      // =================================================
      // REFLECT CONVERSATION ON ACTIVE VISIT
      //
      // Backend has now associated conversation with
      // visit during recording persistence.
      // =================================================

      setActiveVisit(
        (previous) => {

          if (!previous) {
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
      // STEP 3
      // TRANSCRIBE
      //
      // Backend creates ai_app.transcript.
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


      console.log(
        "Sales transcription completed:",
        transcribed
      );


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
      // STEP 4
      // GENERATE FOUR HIGHLIGHTS
      // =================================================

      setIsSummarizing(
        true
      );


      const summary =
        await summarizeSalesTranscript({
          transcript:
            transcript,
      });


      console.log(
        "Sales summary completed:",
        summary
      );


      const highlights =
        Array.isArray(
          summary?.highlights
        )
          ? summary.highlights
          : [];


      if (
        highlights.length === 0
      ) {

        throw new Error(
          "Summary completed but no highlights were returned."
        );
      }


      setConversationHighlights(
        highlights
      );


      // =================================================
      // AUDIO ALREADY SAVED
      // =================================================

      setSalesRecording(
        null
      );


    } catch (error) {

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


    // ===================================================
    // CHAT
    // ===================================================

    setActiveConversationId(
      null
    );


    setMessages([
      salesInitialMessage,
    ]);


    setResponseMode(
      "text"
    );


    // ===================================================
    // CUSTOMER
    // ===================================================

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


    // ===================================================
    // VISIT
    // ===================================================

    setActiveVisit(
      null
    );


    setIsStartingVisit(
      false
    );


    setStartVisitError(
      null
    );


    // ===================================================
    // RECORDING
    // ===================================================

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
  // HISTORY
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


      setMessages(
        formattedMessages.length > 0
          ? formattedMessages
          : [
              salesInitialMessage,
            ]
      );


      // =================================================
      // Visit/customer reconstruction from historical
      // conversations will be implemented separately.
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


    } catch (error) {

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

        {/* ===============================================
            CHAT WINDOW
            =============================================== */}

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

          {/* =============================================
              PRIMARY CUSTOMER
              ============================================= */}

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


          {/* =============================================
              BUSINESS SNAPSHOT
              ============================================= */}

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


          {/* =============================================
              SALES VISIT
              ============================================= */}

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


          {/* =============================================
              CUSTOMER REQUIRED
              ============================================= */}

          {!selectedCustomer && (

            <div
              className=
                "sales-processing-status"
            >

              Select a primary customer to begin.

            </div>

          )}


          {/* =============================================
              VISIT REQUIRED
              ============================================= */}

          {selectedCustomer &&
           !activeVisit?.visit_id && (

            <div
              className=
                "sales-processing-status"
            >

              Start the customer visit before recording the conversation.

            </div>

          )}


          {/* =============================================
              RECORDING
              ============================================= */}

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


          {/* =============================================
              PROCESSING STATUS
              ============================================= */}

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


          {/* =============================================
              ERROR
              ============================================= */}

          {recordingProcessingError && (

            <div
              className=
                "sales-recording-error"
            >

              {recordingProcessingError}

            </div>

          )}


          {/* =============================================
              HIGHLIGHTS
              ============================================= */}

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


          {/* =============================================
              TRANSCRIPT
              ============================================= */}

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


          {/* =============================================
              RESPONSE OPTIONS
              ============================================= */}

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


          {/* =============================================
              CHAT INPUT
              ============================================= */}

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