import {
  API_URL,
} from "../config/apiConfig";

const REQUEST_TIMEOUT_MS = 120000;


/* =========================================================
   NORMAL CHAT
   Existing production API - KEEP THIS
   ========================================================= */

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

    validateBackendResult(result);

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


/* =========================================================
   SSE CHAT
   New streaming API
   ========================================================= */

export async function sendMessageStream(
  question,
  conversationId,
  onProgress
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


    /* -----------------------------------------------------
       Open streaming connection
       ----------------------------------------------------- */

    const response = await fetch(
      `${API_URL}/chat-stream`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
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


    /* -----------------------------------------------------
       HTTP-level error
       ----------------------------------------------------- */

    if (!response.ok) {
      let errorMessage =
        `Backend returned status ${response.status}.`;

      try {
        const errorResult =
          await response.json();

        errorMessage =
          errorResult?.detail ||
          errorResult?.message ||
          errorResult?.answer ||
          errorMessage;
      } catch {
        // Keep default message.
      }

      throw new Error(
        errorMessage
      );
    }


    /* -----------------------------------------------------
       Streaming body required
       ----------------------------------------------------- */

    if (!response.body) {
      throw new Error(
        "Streaming response is unavailable."
      );
    }


    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder("utf-8");


    let buffer = "";

    let finalResult = null;


    /* =====================================================
       READ STREAM
       ===================================================== */

    while (true) {
      const {
        value,
        done,
      } = await reader.read();


      if (done) {
        break;
      }


      buffer += decoder.decode(
        value,
        {
          stream: true,
        }
      );


      /*
       * SSE events are separated by a blank line.
       *
       * Support both:
       *
       * \n\n
       *
       * and Windows/network:
       *
       * \r\n\r\n
       */

      const eventBlocks =
        buffer.split(/\r?\n\r?\n/);


      /*
       * Last part may be an incomplete event.
       * Preserve it for the next network chunk.
       */

      buffer =
        eventBlocks.pop() || "";


      for (
        const eventBlock
        of eventBlocks
      ) {
        if (!eventBlock.trim()) {
          continue;
        }


        const parsedEvent =
          parseSseEvent(
            eventBlock
          );


        if (!parsedEvent) {
          continue;
        }


        const {
          eventType,
          data,
        } = parsedEvent;


        /* -------------------------------------------------
           PROGRESS EVENT

           Backend sends:

           event: progress
           data: {"stage":"processing"}

           Frontend will show only ONE line:

           Processing your request...
           ------------------------------------------------- */

        if (
          eventType ===
          "progress"
        ) {
          if (
            typeof onProgress ===
            "function"
          ) {
            onProgress(
              data
            );
          }

          continue;
        }


        /* -------------------------------------------------
           COMPLETED EVENT
           ------------------------------------------------- */

        if (
          eventType ===
          "completed"
        ) {
          finalResult =
            data?.result || null;

          continue;
        }


        /* -------------------------------------------------
           ERROR EVENT
           ------------------------------------------------- */

        if (
          eventType ===
          "error"
        ) {
          throw new Error(
            data?.message ||
              "The request could not be completed."
          );
        }
      }
    }


    /* =====================================================
       STREAM COMPLETED
       ===================================================== */

    if (!finalResult) {
      throw new Error(
        "The streaming request ended without a result."
      );
    }


    /*
     * Apply the same validation rules
     * used by normal /chat.
     */

    validateBackendResult(
      finalResult
    );


    /*
     * IMPORTANT:
     *
     * Return exactly the same response structure
     * as sendMessage().
     */

    return finalResult;

  } catch (error) {

    if (
      error?.name ===
      "AbortError"
    ) {
      throw new Error(
        "The request took too long. Please try again."
      );
    }


    throw error;

  } finally {

    clearTimeout(
      timeoutId
    );
  }
}


/* =========================================================
   SSE PARSER
   ========================================================= */

function parseSseEvent(
  eventBlock
) {
  const lines =
    String(
      eventBlock || ""
    ).split(/\r?\n/);


  let eventType =
    "message";

  const dataLines = [];


  for (const line of lines) {

    if (
      line.startsWith(
        "event:"
      )
    ) {
      eventType =
        line
          .slice(
            "event:".length
          )
          .trim();

      continue;
    }


    if (
      line.startsWith(
        "data:"
      )
    ) {
      dataLines.push(
        line
          .slice(
            "data:".length
          )
          .trim()
      );
    }
  }


  if (
    dataLines.length === 0
  ) {
    return null;
  }


  const dataText =
    dataLines.join("\n");


  try {
    return {
      eventType,

      data:
        JSON.parse(
          dataText
        ),
    };
  } catch (error) {

    console.error(
      "Unable to parse SSE event:",
      dataText,
      error
    );

    return null;
  }
}


/* =========================================================
   COMMON BACKEND RESPONSE VALIDATION
   ========================================================= */

function validateBackendResult(
  result
) {
  if (
    result?.status ===
    "error"
  ) {
    throw new Error(
      result?.message ||
        result?.answer ||
        "The request could not be completed."
    );
  }


  if (
    result?.status ===
    "blocked"
  ) {
    throw new Error(
      result?.answer ||
        result?.summary ||
        result?.validation_message ||
        "The generated SQL query was blocked."
    );
  }
}