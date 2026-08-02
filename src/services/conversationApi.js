const API_BASE_URL =
  "https://mabdo-dtc3gkb3dhctg9hw.eastus-01.azurewebsites.net";

// const API_BASE_URL =
//   "http://127.0.0.1:8000";


export async function createConversation(
  user,
  title
) {
  const response = await fetch(
    `${API_BASE_URL}/conversations`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        user_id: user.id,

        display_name:
          user.name ||
          "Guest User",

        email_address:
          user.email ||
          null,

        title,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      "Failed to create conversation."
    );
  }

  return {
    id:
      data.conversation_id ??
      data.ConversationId,

    title:
      data.title ??
      data.Title ??
      title,

    updatedAt:
      data.updated_at ??
      data.UpdatedAt ??
      new Date().toISOString(),
  };
}


export async function getConversations(
  userId
) {
  const url =
    `${API_BASE_URL}/conversations` +
    `?user_id=${encodeURIComponent(userId)}`;

  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Failed to load conversations."
    );
  }

  return data.map(
    (conversation) => ({
      id:
        conversation.ConversationId ??
        conversation.conversation_id,

      title:
        conversation.Title ??
        conversation.title,

      updatedAt:
        conversation.UpdatedAt ??
        conversation.updated_at ??
        conversation.CreatedAt ??
        conversation.created_at,
    })
  );
}


export async function getConversationMessages(
  conversationId
) {
  const url =
    `${API_BASE_URL}/conversations/` +
    `${encodeURIComponent(conversationId)}/messages`;

  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Failed to load conversation messages."
    );
  }

  return data;
}