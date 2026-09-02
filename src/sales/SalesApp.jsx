import {
  useEffect,
  useState,
} from "react";

import "../components/styles/SalesApp.css";

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
  sendSalesMessageStream,
} from "../services/salesChatApi";


import {
  createConversation,
  getConversations,
  getConversationMessages,
} from "../services/conversationApi";


import {
  uploadSalesRecording,
  transcribeSalesRecording,
} from "../services/salesRecordingApi";


import {
  getSalesCustomerSnapshot,
} from "../services/salesCustomerApi";


import {
  startSalesVisit,
  completeSalesVisit,
} from "../services/salesVisitApi";


// =========================================================
// SALES AGENT CONSTANTS
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
    "Select a customer for a business snapshot, " +
    "or ask me a customer-specific sales question.",

  source:
    "GPT",

  status:
    "success",

  responseMode:
    "text",

  rows:
    [],

  keyInsights:
    [],

  suggestions:
    [],

  resolvedCustomer:
    null,
};


// =========================================================
// CREATE CONVERSATION TITLE
// =========================================================

function createConversationTitle(
  question,
  customer = null
) {

  const maximumLength =
    40;


  const cleanQuestion =
    String(
      question || ""
    ).trim();


  const customerName =
    String(
      customer?.bmd_name || ""
    ).trim();


  const sourceTitle =
    customerName
      ? `${customerName} - ${cleanQuestion}`
      : cleanQuestion;


  if (
    sourceTitle.length <=
    maximumLength
  ) {

    return sourceTitle;
  }


  return (
    `${sourceTitle.slice(
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
// NORMALIZE CUSTOMER
// =========================================================

function normalizeCustomer(
  customer
) {

  if (
    !customer ||
    typeof customer !==
      "object"
  ) {

    return null;
  }


  const bmdCode =
    String(
      customer.bmd_code ??
      customer.BMDCode ??
      ""
    ).trim();


  const bmdName =
    String(
      customer.bmd_name ??
      customer.BMDName ??
      ""
    ).trim();


  if (
    !bmdCode
  ) {

    return null;
  }


  return {
    bmd_code:
      bmdCode,

    bmd_name:
      bmdName,
  };
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
          role === "USER"
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


  const resolvedCustomer =
    normalizeCustomer(
      responsePayload?.resolved_customer ??
      responsePayload?.resolvedCustomer ??
      null
    );


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

    text:
      answer,

    answer,

    content:
      answer,

    responseMode:
      responsePayload?.response_mode ??
      responsePayload?.responseMode ??
      "text",

    resolvedCustomer,

    customerContextSource:
      responsePayload?.customer_context_source ??
      null,

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
      responsePayload
        ?.execution_time_ms ??
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
// FIND LAST RESOLVED CUSTOMER IN CHAT HISTORY
// =========================================================

function findLastResolvedCustomer(
  messages
) {

  if (
    !Array.isArray(
      messages
    )
  ) {

    return null;
  }


  for (
    let index =
      messages.length - 1;

    index >= 0;

    index -= 1
  ) {

    const customer =
      normalizeCustomer(
        messages[index]
          ?.resolvedCustomer
      );


    if (
      customer
    ) {

      return customer;
    }
  }


  return null;
}


// =========================================================
// SALES INSIGHT SECTION
// =========================================================

function SalesInsightSection({
  title,
  items,
}) {

  if (
    !Array.isArray(
      items
    ) ||
    items.length === 0
  ) {

    return null;
  }


  return (

    <div
      className=
        "sales-insight-section"
    >

      <strong>
        {title}
      </strong>


      <ul>

        {items.map(
          (
            item,
            index
          ) => (

            <li
              key={
                `${title}-${index}-${item}`
              }
            >

              {item}

            </li>

          )
        )}

      </ul>

    </div>
  );
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
  // ACTIVE VISIT
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
  // COMPLETE VISIT
  // =====================================================

  const [
    isEndingVisit,
    setIsEndingVisit,
  ] = useState(false);


  const [
    endVisitError,
    setEndVisitError,
  ] = useState(null);


  const [
    completedVisit,
    setCompletedVisit,
  ] = useState(null);


  // =====================================================
  // VISIT INSIGHTS
  // =====================================================

  const [
    visitInsights,
    setVisitInsights,
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
    completedRecordingCount,
    setCompletedRecordingCount,
  ] = useState(0);


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
  // LOAD CUSTOMER SNAPSHOT
  // =====================================================

  async function loadCustomerSnapshot(
    customer
  ) {

    const normalizedCustomer =
      normalizeCustomer(
        customer
      );


    if (
      !normalizedCustomer?.bmd_code
    ) {

      setCustomerSnapshot(
        null
      );


      return;
    }


    try {

      setIsLoadingCustomerSnapshot(
        true
      );


      setCustomerSnapshotError(
        null
      );


      const snapshot =
        await getSalesCustomerSnapshot({
          bmdCode:
            normalizedCustomer.bmd_code,
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


      setCustomerSnapshot(
        null
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
  // APPLY CUSTOMER RESOLVED BY CHAT
  //
  // IMPORTANT:
  //
  // We DO NOT create a new conversation here.
  //
  // Example:
  //
  // User:
  // "Show July TGS for BHAVANI DISTRIBUTORS"
  //
  // Backend resolves BHAVANI.
  //
  // Frontend stores BHAVANI so the next question:
  //
  // "What about August?"
  //
  // still sends BHAVANI BMDCode.
  // =====================================================

  async function applyResolvedCustomerFromChat(
    customer
  ) {

    const resolvedCustomer =
      normalizeCustomer(
        customer
      );


    if (
      !resolvedCustomer
    ) {

      return;
    }


    const existingBmdCode =
      String(
        selectedCustomer?.bmd_code ||
        ""
      ).trim();


    if (
      existingBmdCode ===
      resolvedCustomer.bmd_code
    ) {

      return;
    }


    setSelectedCustomer(
      resolvedCustomer
    );


    // A customer change invalidates active visit UI.
    // It does NOT reset the current Sales conversation.

    setActiveVisit(
      null
    );


    setCompletedVisit(
      null
    );


    setVisitInsights(
      null
    );


    setStartVisitError(
      null
    );


    setEndVisitError(
      null
    );


    setSalesRecording(
      null
    );


    setSavedRecording(
      null
    );


    setCompletedRecordingCount(
      0
    );


    setRecordingProcessingError(
      null
    );


    await loadCustomerSnapshot(
      resolvedCustomer
    );
  }


  // =====================================================
  // RESTORE CUSTOMER FROM HISTORY
  // =====================================================

  async function restoreCustomerFromMessages(
    formattedMessages
  ) {

    const customer =
      findLastResolvedCustomer(
        formattedMessages
      );


    if (
      !customer
    ) {

      setSelectedCustomer(
        null
      );


      setCustomerSnapshot(
        null
      );


      return;
    }


    setSelectedCustomer(
      customer
    );


    await loadCustomerSnapshot(
      customer
    );
  }


  // =====================================================
  // LOAD SALES CONVERSATION HISTORY
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


      await restoreCustomerFromMessages(
        formattedMessages
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
  // ENSURE CHAT CONVERSATION
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
        question,
        selectedCustomer
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
  // ENSURE VISIT CONVERSATION
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
  // RESET VISIT STATE
  // =====================================================

  function resetVisitState() {

    setActiveVisit(
      null
    );


    setCompletedVisit(
      null
    );


    setVisitInsights(
      null
    );


    setStartVisitError(
      null
    );


    setEndVisitError(
      null
    );


    setIsStartingVisit(
      false
    );


    setIsEndingVisit(
      false
    );


    setSalesRecording(
      null
    );


    setSavedRecording(
      null
    );


    setCompletedRecordingCount(
      0
    );


    setRecordingProcessingError(
      null
    );
  }


  // =====================================================
  // SELECT CUSTOMER FROM GLOBAL SEARCH
  //
  // IMPORTANT:
  //
  // A deliberate customer selection starts a clean Sales
  // conversation context.
  //
  // This prevents Customer A analytical filters/history
  // leaking into Customer B.
  // =====================================================

  async function handleCustomerSelect(
    customer
  ) {

    const normalizedCustomer =
      normalizeCustomer(
        customer
      );


    const previousCode =
      String(
        selectedCustomer?.bmd_code ||
        ""
      ).trim();


    const nextCode =
      String(
        normalizedCustomer?.bmd_code ||
        ""
      ).trim();


    const customerChanged =
      Boolean(
        nextCode
      ) &&
      previousCode !==
        nextCode;


    if (
      customerChanged
    ) {

      sessionStorage.removeItem(
        ACTIVE_CONVERSATION_KEY
      );


      setActiveConversationId(
        null
      );


      setMessages([
        salesInitialMessage,
      ]);
    }


    setSelectedCustomer(
      normalizedCustomer
    );


    setCustomerSnapshot(
      null
    );


    setCustomerSnapshotError(
      null
    );


    resetVisitState();


    if (
      !normalizedCustomer?.bmd_code
    ) {

      return;
    }


    await loadCustomerSnapshot(
      normalizedCustomer
    );
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


      setEndVisitError(
        null
      );


      setVisitInsights(
        null
      );


      setCompletedVisit(
        null
      );


      setCompletedRecordingCount(
        0
      );


      setSalesRecording(
        null
      );


      setSavedRecording(
        null
      );


      setRecordingProcessingError(
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
  // END VISIT + GENERATE INSIGHTS
  // =====================================================

  async function handleEndVisit() {

    if (
      !activeVisit?.visit_id
    ) {

      setEndVisitError(
        "There is no active Sales visit to complete."
      );


      return;
    }


    if (
      !selectedCustomer?.bmd_code
    ) {

      setEndVisitError(
        "Selected customer is not available."
      );


      return;
    }


    if (
      completedRecordingCount <= 0
    ) {

      setEndVisitError(
        "Save at least one customer conversation before finishing the visit."
      );


      return;
    }


    const visitUserId =
      currentUser?.email ||
      currentUser?.id;


    if (
      !visitUserId
    ) {

      setEndVisitError(
        "Authenticated user could not be identified."
      );


      return;
    }


    if (
      isEndingVisit
    ) {

      return;
    }


    try {

      setIsEndingVisit(
        true
      );


      setEndVisitError(
        null
      );


      setRecordingProcessingError(
        null
      );


      const result =
        await completeSalesVisit({
          visitId:
            activeVisit.visit_id,

          bmdCode:
            selectedCustomer.bmd_code,

          userId:
            visitUserId,
        });


      const insights =
        result?.insights ??
        null;


      const completedVisitResult =
        result?.visit ??
        activeVisit;


      if (
        !insights
      ) {

        throw new Error(
          "Visit was completed but no Sales insights were returned."
        );
      }


      setVisitInsights(
        insights
      );


      setCompletedVisit(
        completedVisitResult
      );


      setActiveVisit(
        null
      );


      setSalesRecording(
        null
      );


      setSavedRecording(
        null
      );


      setCompletedRecordingCount(
        0
      );


      console.log(
        "Sales visit completed:",
        {
          visit:
            completedVisitResult,

          insights,
        }
      );


    } catch (
      error
    ) {

      console.error(
        "Unable to finish Sales visit:",
        error
      );


      setEndVisitError(
        error instanceof Error
          ? error.message
          : "Unable to finish the visit and generate insights."
      );


    } finally {

      setIsEndingVisit(
        false
      );
    }
  }


  // =====================================================
  // QUESTION SUBMISSION
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

    const cleanMode =
      String(
        mode || ""
      )
        .trim()
        .toLowerCase();


    if (
      ![
        "text",
        "voice",
        "podcast",
      ].includes(
        cleanMode
      )
    ) {

      return;
    }


    setResponseMode(
      cleanMode
    );


    console.log(
      "Sales response mode selected:",
      cleanMode
    );
  }


  // =====================================================
  // SEND SALES CHAT QUESTION
  //
  // Uses:
  //
  // POST /sales/chat-stream
  //
  // Sends:
  //
  // question
  // conversation_id
  // user_id
  // selected customer
  // response mode
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
            selectedCustomer?.bmd_name
              ? (
                  `Analyzing ${selectedCustomer.bmd_name}...`
                )
              : (
                  "Understanding your Sales question..."
                ),

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
                      "Resolving customer and Sales context...",
                  }
                : message
          )
      );


      // =================================================
      // SALES-SPECIFIC CHAT
      // =================================================

      const response =
        await sendSalesMessageStream({
          question:
            cleanQuestion,

          conversationId:
            conversationId,

          userId:
            currentUser.id,

          selectedCustomer:
            selectedCustomer,

          responseMode:
            responseMode,

          onProgress:
            (
              progress
            ) => {

              const progressMessage =
                String(
                  progress?.message ||
                  "Preparing the Sales response..."
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
                              progressMessage,
                          }
                        : message
                  )
              );
            },
        });


      // =================================================
      // CUSTOMER RESOLVED BY BACKEND
      //
      // This is critical for direct-chat customer lookup.
      //
      // Example:
      //
      // User:
      // "Show July TGS for BHAVANI DISTRIBUTORS"
      //
      // Backend returns BHAVANI.
      //
      // Next:
      // "What about August?"
      //
      // Frontend continues sending BHAVANI.
      // =================================================

      const resolvedCustomer =
        normalizeCustomer(
          response?.resolved_customer
        );


      if (
        resolvedCustomer
      ) {

        await applyResolvedCustomerFromChat(
          resolvedCustomer
        );
      }


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
          responseEngine === "CHAT"
            ? "No response was generated."
            : "The query completed successfully."
        );


      const effectiveResponseMode =
        String(
          response?.response_mode ||
          responseMode ||
          "text"
        )
          .trim()
          .toLowerCase();


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
          effectiveResponseMode,

        resolvedCustomer:
          resolvedCustomer,

        customerContextSource:
          response?.customer_context_source ||
          null,

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
            responseEngine === "CHAT"
              ? "Sales Agent"
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

                    responseMode:
                      "text",

                    rows:
                      [],

                    keyInsights:
                      [],

                    suggestions:
                      [],

                    visual:
                      null,

                    resolvedCustomer:
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


    if (
      audioBlob
    ) {

      setSavedRecording(
        null
      );


      setRecordingProcessingError(
        null
      );
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


      setRecordingProcessingError(
        null
      );
    }
  }


  // =====================================================
  // SAVE + TRANSCRIBE
  //
  // NO INSIGHT GENERATION HERE.
  //
  // Insights are generated when the visit is finished.
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
      isEndingVisit
    ) {

      return;
    }


    const currentVisitId =
      activeVisit.visit_id;


    setRecordingProcessingError(
      null
    );


    try {

      // =================================================
      // CREATE / REUSE SALES CONVERSATION
      // =================================================

      const conversationId =
        await getOrCreateSalesConversation();


      // =================================================
      // UPLOAD
      // =================================================

      setIsSavingRecording(
        true
      );


      const saved =
        await uploadSalesRecording({
          audioBlob:
            salesRecording,

          conversationId,

          visitId:
            currentVisitId,

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
      // TRANSCRIBE SILENTLY
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
            currentVisitId,
        });


      const transcript =
        String(
          transcribed?.transcript ||
          ""
        ).trim();


      if (
        !transcript
      ) {

        throw new Error(
          "Speech processing completed but no transcript was generated."
        );
      }


      setCompletedRecordingCount(
        (
          previous
        ) =>
          previous + 1
      );


      setSalesRecording(
        null
      );


      console.log(
        "Sales recording processed:",
        {
          visitId:
            currentVisitId,

          artifactId:
            saved.artifact_id,

          transcriptId:
            transcribed?.transcript_id,

          language:
            transcribed?.language,
        }
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
      isEndingVisit
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


    resetVisitState();
  }


  // =====================================================
  // OPEN CHAT HISTORY
  // =====================================================

  async function handleHistoryClick(
    conversationId
  ) {

    if (
      isLoading ||
      isStartingVisit ||
      isSavingRecording ||
      isTranscribing ||
      isEndingVisit ||
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


      resetVisitState();


      await restoreCustomerFromMessages(
        formattedMessages
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
  // BUSY
  // =====================================================

  const isSalesBusy =
    isLoading ||
    isLoadingCustomerSnapshot ||
    isStartingVisit ||
    isSavingRecording ||
    isTranscribing ||
    isEndingVisit;


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


        {/* ===============================================
            SALES WORKSPACE
            =============================================== */}

        <div
          className=
            "composer-section"
        >

          {/* =============================================
              OPTION 1:
              GLOBAL CUSTOMER SEARCH
              ============================================= */}

          <SalesCustomerSelector
            selectedCustomer={
              selectedCustomer
            }

            onCustomerSelect={
              handleCustomerSelect
            }

            disabled={
              isSalesBusy
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
              VISIT
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

            onEndVisit={
              handleEndVisit
            }

            isEndingVisit={
              isEndingVisit
            }

            endVisitError={
              endVisitError
            }

            hasRecordedConversation={
              completedRecordingCount > 0
            }

            disabled={
              isLoadingCustomerSnapshot ||
              isLoading ||
              isSavingRecording ||
              isTranscribing
            }
          />


          {/* =============================================
              CUSTOMER GUIDANCE
              ============================================= */}

          {!selectedCustomer && (

            <div
              className=
                "sales-processing-status"
            >

              Select a customer for a business snapshot,
              or ask a customer-specific question below.

            </div>

          )}


          {selectedCustomer &&
           !activeVisit?.visit_id &&
           !completedVisit && (

            <div
              className=
                "sales-processing-status"
            >

              Start the customer visit when you are ready
              to record the conversation.

            </div>

          )}


          {/* =============================================
              RECORDING
              ============================================= */}

          <SalesRecordingPanel
            disabled={
              !selectedCustomer ||
              !activeVisit?.visit_id ||
              isSalesBusy
            }

            onRecordingReady={
              handleRecordingReady
            }

            onSaveRecording={
              handleSaveRecording
            }

            isSaving={
              isSavingRecording ||
              isTranscribing
            }

            isSaved={
              Boolean(
                savedRecording
              )
            }
          />


          {/* =============================================
              RECORDING STATUS
              ============================================= */}

          {isSavingRecording && (

            <div
              className=
                "sales-processing-status"
            >

              Saving customer recording...

            </div>

          )}


          {isTranscribing && (

            <div
              className=
                "sales-processing-status"
            >

              Processing customer conversation...

            </div>

          )}


          {completedRecordingCount > 0 &&
           activeVisit?.visit_id &&
           !isSavingRecording &&
           !isTranscribing && (

            <div
              className=
                "sales-processing-status"
            >

              {
                completedRecordingCount === 1
                  ? (
                      "1 conversation saved for this visit."
                    )
                  : (
                      `${completedRecordingCount} conversations saved for this visit.`
                    )
              }

              {" "}

              You can record another conversation or finish
              the visit to generate insights.

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


          {/* =============================================
              COMPLETED VISIT
              ============================================= */}

          {completedVisit && (

            <div
              className=
                "sales-processing-status"
            >

              Visit completed successfully. Customer
              conversation insights are available below.

            </div>

          )}


          {/* =============================================
              STRUCTURED VISIT INSIGHTS

              RAW TRANSCRIPT IS NEVER DISPLAYED.
              ============================================= */}

          {visitInsights && (

            <div
              className=
                "sales-visit-insights"
            >

              <div
                className=
                  "sales-visit-insights-title"
              >

                Customer Visit Insights

              </div>


              {visitInsights.visit_summary && (

                <div
                  className=
                    "sales-visit-summary"
                >

                  {
                    visitInsights.visit_summary
                  }

                </div>

              )}


              <SalesInsightSection
                title=
                  "Customer Needs"

                items={
                  visitInsights.customer_needs
                }
              />


              <SalesInsightSection
                title=
                  "Opportunities"

                items={
                  visitInsights.opportunities
                }
              />


              <SalesInsightSection
                title=
                  "Product Interests"

                items={
                  visitInsights.product_interests
                }
              />


              <SalesInsightSection
                title=
                  "Commercial Terms"

                items={
                  visitInsights.commercial_terms
                }
              />


              <SalesInsightSection
                title=
                  "Commitments"

                items={
                  visitInsights.commitments
                }
              />


              <SalesInsightSection
                title=
                  "Next Actions"

                items={
                  visitInsights.next_actions
                }
              />


              <SalesInsightSection
                title=
                  "Service Issues"

                items={
                  visitInsights.service_issues
                }
              />


              <SalesInsightSection
                title=
                  "Competitors"

                items={
                  visitInsights.competitors
                }
              />


              <SalesInsightSection
                title=
                  "Risks"

                items={
                  visitInsights.risks
                }
              />

            </div>

          )}


          {/* =============================================
              OUTPUT MODE
              ============================================= */}

          <SalesResponseOptions
            selectedMode={
              responseMode
            }

            onSelect={
              handleResponseModeSelect
            }

            disabled={
              isSalesBusy
            }
          />


          {/* =============================================
              OPTION 2:
              CUSTOMER-AWARE CHAT
              ============================================= */}

          <ChatInput
            onSend={
              handleQuestionSubmit
            }

            disabled={
              isLoading
            }

            placeholder={
              selectedCustomer?.bmd_name
                ? (
                    `Ask about ${selectedCustomer.bmd_name}, sales trends or previous visits...`
                  )
                : (
                    "Ask about a customer, sales trend or previous visit..."
                  )
            }
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