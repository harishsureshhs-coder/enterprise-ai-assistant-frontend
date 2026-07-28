const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://mabdo-dtc3gkb3dhctg9hw.eastus-01.azurewebsites.net";

const REQUEST_TIMEOUT_MS = 120000;

export async function sendMessage(
  question,
  conversationId
) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const cleanQuestion =
      String(question || "").trim();

    if (!cleanQuestion) {
      throw new Error(
        "Please enter a question."
      );
    }

    const response = await fetch(
      `${API_URL}/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: cleanQuestion,

          conversation_id:
            conversationId &&
            conversationId !== "null"
              ? conversationId
              : null,
        }),

        signal: controller.signal,
      }
    );

    let result = null;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        `Backend returned an invalid response. Status: ${response.status}`
      );
    }

    if (!response.ok) {
      throw new Error(
        result?.detail ||
          result?.message ||
          result?.answer ||
          `Backend returned status ${response.status}.`
      );
    }

    if (result?.status === "error") {
      throw new Error(
        result?.message ||
          result?.answer ||
          "The request could not be completed."
      );
    }

    if (result?.status === "blocked") {
      throw new Error(
        result?.answer ||
          result?.summary ||
          "The generated SQL query was blocked."
      );
    }

    return result;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "The request took too long. Please try again."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}