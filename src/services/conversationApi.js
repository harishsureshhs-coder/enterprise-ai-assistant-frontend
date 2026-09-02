import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// VALID AGENTS
// =========================================================

const VALID_AGENT_IDS = [
  "EXECUTIVE",
  "SALES",
];


// =========================================================
q// NORMALIZE AGENT ID
// =========================================================

function normalizeAgentId(
  agentId
) {

  const normalized =
    String(
      agentId || ""
    )
      .trim()
      .toUpperCase();


  if (
    !VALID_AGENT_IDS.includes(
      normalized
    )
  ) {

    throw new Error(
      `Invalid agent ID: ${agentId || "empty"}`
    );
  }


  return normalized;
}


// =========================================================
// READ API RESPONSE
// =========================================================

async function readApiResponse(
  response
) {

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  if (
    contentType.includes(
      "application/json"
    )
  ) {

    return response.json();
  }


  const text =
    await response.text();


  return {
    detail:
      text,
  };
}


// =========================================================
// CREATE CONVERSATION
// =========================================================

export async function createConversation(
  user,
  title,
  agentId
) {

  // =====================================================
  // VALIDATE USER
  // =====================================================

  if (
    !user?.id
  ) {

    throw new Error(
      "Authenticated user is required."
    );
  }


  // =====================================================
  // VALIDATE TITLE
  // =====================================================

  const cleanTitle =
    String(
      title || ""
    ).trim();


  if (
    !cleanTitle
  ) {

    throw new Error(
      "Conversation title is required."
    );
  }


  // =====================================================
  // VALIDATE AGENT
  // =====================================================

  const normalizedAgentId =
    normalizeAgentId(
      agentId
    );


  console.log(
    "Creating conversation:",
    {
      userId:
        user.id,

      email:
        user.email,

      title:
        cleanTitle,

      agentId:
        normalizedAgentId,
    }
  );


  // =====================================================
  // API REQUEST
  // =====================================================

  const response =
    await fetch(
      `${API_URL}/conversations`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            user_id:
              user.id,

            agent_id:
              normalizedAgentId,

            display_name:
              user.name ||
              "Authenticated User",

            email_address:
              user.email ||
              null,

            title:
              cleanTitle,
          }),
      }
    );


  const data =
    await readApiResponse(
      response
    );


  if (
    !response.ok
  ) {

    throw new Error(
      data?.detail ||
      data?.message ||
      "Failed to create conversation."
    );
  }


  // =====================================================
  // NORMALIZE RESPONSE
  // =====================================================

  const conversationId =
    data?.conversation_id ??
    data?.ConversationId;


  if (
    !conversationId
  ) {

    throw new Error(
      "Conversation was created but no conversation ID was returned."
    );
  }


  return {
    id:
      conversationId,

    title:
      data?.title ??
      data?.Title ??
      cleanTitle,

    agentId:
      data?.agent_id ??
      data?.AgentId ??
      normalizedAgentId,

    updatedAt:
      data?.updated_at ??
      data?.UpdatedAt ??
      new Date().toISOString(),
  };
}


// =========================================================
// GET CONVERSATIONS
//
// IMPORTANT:
//
// Conversation history is scoped by:
//
// user
// +
// agent
//
// Executive:
// getConversations(userId, "EXECUTIVE")
//
// Sales:
// getConversations(userId, "SALES")
// =========================================================

export async function getConversations(
  userId,
  agentId
) {

  // =====================================================
  // VALIDATE USER
  // =====================================================

  const cleanUserId =
    String(
      userId || ""
    ).trim();


  if (
    !cleanUserId
  ) {

    throw new Error(
      "User ID is required."
    );
  }


  // =====================================================
  // VALIDATE AGENT
  // =====================================================

  const normalizedAgentId =
    normalizeAgentId(
      agentId
    );


  // =====================================================
  // BUILD URL
  // =====================================================

  const url =
    `${API_URL}/conversations` +
    `?user_id=${encodeURIComponent(
      cleanUserId
    )}` +
    `&agent_id=${encodeURIComponent(
      normalizedAgentId
    )}`;


  console.log(
    "Loading conversations:",
    {
      userId:
        cleanUserId,

      agentId:
        normalizedAgentId,
    }
  );


  // =====================================================
  // REQUEST
  // =====================================================

  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },
      }
    );


  const data =
    await readApiResponse(
      response
    );


  if (
    !response.ok
  ) {

    throw new Error(
      data?.detail ||
      data?.message ||
      "Failed to load conversations."
    );
  }


  if (
    !Array.isArray(
      data
    )
  ) {

    return [];
  }


  // =====================================================
  // NORMALIZE RESPONSE
  // =====================================================

  return data.map(
    (
      conversation
    ) => ({

      id:
        conversation.ConversationId ??
        conversation.conversation_id,

      title:
        conversation.Title ??
        conversation.title,

      agentId:
        conversation.AgentId ??
        conversation.agent_id ??
        normalizedAgentId,

      updatedAt:
        conversation.UpdatedAt ??
        conversation.updated_at ??
        conversation.CreatedAt ??
        conversation.created_at,

    })
  );
}


// =========================================================
// GET CONVERSATION MESSAGES
// =========================================================

export async function getConversationMessages(
  conversationId
) {

  const cleanConversationId =
    String(
      conversationId || ""
    ).trim();


  if (
    !cleanConversationId
  ) {

    throw new Error(
      "Conversation ID is required."
    );
  }


  const url =
    `${API_URL}/conversations/` +
    `${encodeURIComponent(
      cleanConversationId
    )}/messages`;


  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },
      }
    );


  const data =
    await readApiResponse(
      response
    );


  if (
    !response.ok
  ) {

    throw new Error(
      data?.detail ||
      data?.message ||
      "Failed to load conversation messages."
    );
  }


  return Array.isArray(
    data
  )
    ? data
    : [];
}