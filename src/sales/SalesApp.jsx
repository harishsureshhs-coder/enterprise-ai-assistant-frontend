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

import SalesVoicePlayer
  from "../components/sales/SalesVoicePlayer";


import {
  getCurrentUser,
} from "../services/authService";


import {
  sendSalesMessageStream,
} from "../services/salesChatApi";


import {
  synthesizeSalesVoiceSummary,
} from "../services/salesVoiceApi";


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
// FIND LAST RESOLVED CUSTOMER
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
  // VOICE SUMMARY
  // =====================================================

  const [
    voiceAudioUrl,
    setVoiceAudioUrl,
  ] = useState(null);


  const [
    isGeneratingVoice,
    setIsGeneratingVoice,
  ] = useState(false);


  const [
    voiceGenerationError,
    setVoiceGenerationError,
  ] = useState(null);


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
  // CLEAN UP BROWSER AUDIO URL
  //
  // Prevent memory leak when a new voice summary replaces
  // the previous one.
  // =====================================================

  useEffect(
    () => {

      return () => {

        if (
          voiceAudioUrl
        ) {

          URL.revokeObjectURL(
            voiceAudioUrl
          );
        }
      };

    },
    [
      voiceAudioUrl,
    ]
  );


  // =====================================================
  // CLEAR VOICE RESULT
  // =====================================================

  function clearVoiceSummary() {

    setVoiceAudioUrl(
      null
    );


    setVoiceGenerationError(
      null
    );


    setIsGeneratingVoice(
      false
    );
  }


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
  // CUSTOMER SELECTION
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


      clearVoiceSummary();
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
  // COMPLETE VISIT
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


    try {

      setIsEndingVisit(
        true
      );


      setEndVisitError(
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


      if (
        !result?.insights
      ) {

        throw new Error(
          "Visit was completed but no Sales insights were returned."
        );
      }


      setVisitInsights(
        result.insights
      );


      setCompletedVisit(
        result.visit ||
        activeVisit
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


    // If user moves away from Voice, remove old audio.

    if (
      cleanMode !==
      "voice"
    ) {

      clearVoiceSummary();
    }
  }


  // =====================================================
  // QUESTION SUBMIT
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
  // SEND CUSTOMER-AWARE SALES CHAT
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


    // Remove previous audio whenever a new question starts.

    clearVoiceSummary();


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
              ? `Analyzing ${selectedCustomer.bmd_name}...`
              : "Understanding your Sales question...",

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


      const response =
        await sendSalesMessageStream({
          question:
            cleanQuestion,

          conversationId,

          userId:
            currentUser.id,

          selectedCustomer,

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
      // BACKEND-RESOLVED CUSTOMER
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


      // =================================================
      // NORMALIZE RESPONSE
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
            responseEngine ===
              "CHAT"
              ? "Sales Agent"
              : "Azure SQL"
          ),

        rowCount:
          response?.row_count ??
          rows.length,

        executionTime:
          response?.execution_time_ms ??
          response?.timings
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


      // =================================================
      // VOICE SUMMARY
      //
      // Only final grounded answer is synthesized.
      //
      // No second SQL query.
      // No second LLM call.
      // =================================================

      if (
        effectiveResponseMode ===
          "voice" &&
        answer
      ) {

        try {

          setIsGeneratingVoice(
            true
          );


          setVoiceGenerationError(
            null
          );


          const audioBlob =
            await synthesizeSalesVoiceSummary({
              text:
                answer,
            });


          const audioUrl =
            URL.createObjectURL(
              audioBlob
            );


          setVoiceAudioUrl(
            audioUrl
          );


        } catch (
          voiceError
        ) {

          console.error(
            "Unable to generate Sales voice summary:",
            voiceError
          );


          setVoiceGenerationError(
            voiceError instanceof Error
              ? voiceError.message
              : "Unable to generate voice summary."
          );


        } finally {

          setIsGeneratingVoice(
            false
          );
        }
      }


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
  // SAVE + TRANSCRIBE RECORDING
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

      const conversationId =
        await getOrCreateSalesConversation();


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
        !saved?.blob_name ||
        !saved?.artifact_id
      ) {

        throw new Error(
          "Recording storage did not return the required identifiers."
        );
      }


      setSavedRecording(
        saved
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


      setIsSavingRecording(
        false
      );


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
      isEndingVisit ||
      isGeneratingVoice
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


    clearVoiceSummary();


    setSelectedCustomer(
      null
    );


    setCustomerSnapshot(
      null
    );


    setCustomerSnapshotError(
      null
    );


    resetVisitState();
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
      isEndingVisit ||
      isGeneratingVoice ||
      !conversationId
    ) {

      return;
    }


    clearVoiceSummary();


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
  // GLOBAL BUSY STATE
  // =====================================================

  const isSalesBusy =
    isLoading ||
    isLoadingCustomerSnapshot ||
    isStartingVisit ||
    isSavingRecording ||
    isTranscribing ||
    isEndingVisit ||
    isGeneratingVoice;


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
            CHAT RESULTS
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
            VOICE SUMMARY PLAYER

            Sales-only.
            Appears only after Voice Summary generation.
            =============================================== */}

        <SalesVoicePlayer
          audioUrl={
            voiceAudioUrl
          }

          loading={
            isGeneratingVoice
          }

          error={
            voiceGenerationError
          }
        />


        {/* ===============================================
            SALES WORKSPACE
            =============================================== */}

        <div
          className=
            "composer-section"
        >

          {/* CUSTOMER */}

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


          {/* BUSINESS SNAPSHOT */}

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


          {/* VISIT */}

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
              isSalesBusy
            }
          />


          {/* RECORDING */}

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
                  ? "1 conversation saved for this visit."
                  : `${completedRecordingCount} conversations saved for this visit.`
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


          {/* VISIT INSIGHTS */}

          {completedVisit && (

            <div
              className=
                "sales-processing-status"
            >

              Visit completed successfully. Customer
              conversation insights are available below.

            </div>

          )}


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
                title="Customer Needs"
                items={
                  visitInsights.customer_needs
                }
              />


              <SalesInsightSection
                title="Opportunities"
                items={
                  visitInsights.opportunities
                }
              />


              <SalesInsightSection
                title="Product Interests"
                items={
                  visitInsights.product_interests
                }
              />


              <SalesInsightSection
                title="Commercial Terms"
                items={
                  visitInsights.commercial_terms
                }
              />


              <SalesInsightSection
                title="Commitments"
                items={
                  visitInsights.commitments
                }
              />


              <SalesInsightSection
                title="Next Actions"
                items={
                  visitInsights.next_actions
                }
              />


              <SalesInsightSection
                title="Service Issues"
                items={
                  visitInsights.service_issues
                }
              />


              <SalesInsightSection
                title="Competitors"
                items={
                  visitInsights.competitors
                }
              />


              <SalesInsightSection
                title="Risks"
                items={
                  visitInsights.risks
                }
              />

            </div>

          )}


          {/* RESPONSE FORMAT */}

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


          {/* CHAT */}

          <ChatInput
            onSend={
              handleQuestionSubmit
            }

            disabled={
              isSalesBusy
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