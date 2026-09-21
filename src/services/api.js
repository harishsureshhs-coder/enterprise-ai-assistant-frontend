import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// CONFIGURATION
// =========================================================

export const REQUEST_TIMEOUT_MS =
  120000;


// =========================================================
// NORMALIZE API URL
// =========================================================

const API_BASE_URL =
  String(
    API_URL || ""
  ).replace(
    /\/+$/,
    ""
  );


// =========================================================
// BUILD URL
// =========================================================

function buildApiUrl(
  path
) {
  const normalizedPath =
    String(
      path || ""
    ).startsWith("/")
      ? path
      : `/${path}`;

  return (
    `${API_BASE_URL}${normalizedPath}`
  );
}


// =========================================================
// VALIDATE QUESTION
// =========================================================

function normalizeQuestion(
  question
) {
  const cleanQuestion =
    String(
      question || ""
    ).trim();

  if (!cleanQuestion) {
    throw new Error(
      "Question is required."
    );
  }

  return cleanQuestion;
}


// =========================================================
// BUILD CHAT PAYLOAD
// =========================================================

function buildChatPayload(
  question,
  conversationId
) {
  return {
    question,

    conversation_id:
      conversationId ||
      null,
  };
}


// =========================================================
// ABORT / TIMEOUT MANAGER
// =========================================================

function createAbortManager(
  externalSignal = null,
  timeoutMs =
    REQUEST_TIMEOUT_MS
) {
  const controller =
    new AbortController();

  let timedOut =
    false;

  let externallyAborted =
    false;


  const handleExternalAbort =
    () => {
      externallyAborted =
        true;

      controller.abort();
    };


  if (externalSignal) {
    if (
      externalSignal.aborted
    ) {
      handleExternalAbort();
    } else {
      externalSignal.addEventListener(
        "abort",
        handleExternalAbort,
        {
          once: true,
        }
      );
    }
  }


  const timeoutId =
    window.setTimeout(
      () => {
        timedOut =
          true;

        controller.abort();
      },
      timeoutMs
    );


  function cleanup() {
    window.clearTimeout(
      timeoutId
    );

    if (externalSignal) {
      externalSignal.removeEventListener(
        "abort",
        handleExternalAbort
      );
    }
  }


  return {
    signal:
      controller.signal,

    cleanup,

    wasTimedOut:
      () => timedOut,

    wasExternallyAborted:
      () =>
        externallyAborted,
  };
}


// =========================================================
// READ HTTP ERROR
// =========================================================

async function readErrorResponse(
  response
) {
  try {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const body =
        await response.json();

      return (
        body?.detail ||
        body?.message ||
        body?.error ||
        JSON.stringify(
          body
        )
      );
    }


    const text =
      await response.text();

    return (
      text ||
      `Request failed with status ${response.status}.`
    );

  } catch {
    return (
      `Request failed with status ${response.status}.`
    );
  }
}


// =========================================================
// NORMAL NON-STREAMING CHAT
// =========================================================

export async function sendMessage(
  question,
  conversationId,
  externalSignal = null
) {
  const cleanQuestion =
    normalizeQuestion(
      question
    );


  const abortManager =
    createAbortManager(
      externalSignal
    );


  try {
    const response =
      await fetch(
        buildApiUrl(
          "/chat"
        ),
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              buildChatPayload(
                cleanQuestion,
                conversationId
              )
            ),

          signal:
            abortManager.signal,
        }
      );


    if (!response.ok) {
      const errorMessage =
        await readErrorResponse(
          response
        );

      throw new Error(
        errorMessage
      );
    }


    const responsePayload =
      await response.json();


    return responsePayload;


  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      if (
        abortManager
          .wasExternallyAborted()
      ) {
        throw new Error(
          "Request stopped."
        );
      }

      if (
        abortManager
          .wasTimedOut()
      ) {
        throw new Error(
          "The request took too long. Please try again."
        );
      }

      throw new Error(
        "The request was cancelled."
      );
    }


    if (
      error instanceof TypeError &&
      error.message ===
        "Failed to fetch"
    ) {
      throw new Error(
        (
          "The AI service is temporarily unavailable. "
          + "Please try again."
        )
      );
    }


    throw error;


  } finally {
    abortManager.cleanup();
  }
}


// =========================================================
// PARSE ONE SSE EVENT BLOCK
// =========================================================

function parseSseEventBlock(
  rawBlock
) {
  const cleanBlock =
    String(
      rawBlock || ""
    ).trim();


  if (!cleanBlock) {
    return null;
  }


  const lines =
    cleanBlock.split(
      "\n"
    );


  const dataLines =
    [];


  for (
    const rawLine
    of lines
  ) {
    const line =
      rawLine.trimEnd();


    if (
      !line.startsWith(
        "data:"
      )
    ) {
      continue;
    }


    dataLines.push(
      line
        .slice(5)
        .trimStart()
    );
  }


  if (
    dataLines.length ===
    0
  ) {
    return null;
  }


  const dataText =
    dataLines.join(
      "\n"
    );


  if (!dataText) {
    return null;
  }


  try {
    return JSON.parse(
      dataText
    );

  } catch (error) {
    console.error(
      "Unable to parse SSE JSON:",
      {
        dataText,
        error,
      }
    );


    throw new Error(
      "The AI service returned an invalid streaming response."
    );
  }
}


// =========================================================
// PROCESS SSE EVENT
// =========================================================

function processSseEvent(
  event,
  onProgress
) {
  if (
    !event ||
    typeof event !==
      "object"
  ) {
    return null;
  }


  console.log(
    "SSE event received:",
    event
  );


  const eventType =
    String(
      event.type || ""
    ).toLowerCase();


  // -------------------------------------------------------
  // PROGRESS
  // -------------------------------------------------------

  if (
    eventType ===
    "progress"
  ) {
    if (
      typeof onProgress ===
      "function"
    ) {
      onProgress(
        event
      );
    }

    return null;
  }


  // -------------------------------------------------------
  // TOKEN STREAM
  // -------------------------------------------------------

  if (
    eventType ===
    "token"
  ) {
    if (
      typeof onProgress ===
      "function"
    ) {
      onProgress(
        event
      );
    }

    return null;
  }


  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  if (
    eventType ===
    "error"
  ) {
    throw new Error(
      event?.message ||
      event?.detail ||
      (
        "The backend could not "
        + "process the request."
      )
    );
  }


  // -------------------------------------------------------
  // FINAL RESULT
  // -------------------------------------------------------

  if (
    eventType ===
    "result"
  ) {
    return (
      event?.data ??
      event?.result ??
      null
    );
  }


  // -------------------------------------------------------
  // BACKWARD COMPATIBILITY
  // -------------------------------------------------------

  if (
    event?.engine ||
    event?.answer ||
    event?.summary ||
    event?.executive_summary ||
    event?.rows ||
    event?.generated_sql ||
    event?.executed_sql
  ) {
    return event;
  }


  return null;
}


// =========================================================
// STREAMING CHAT
// =========================================================

export async function sendMessageStream(
  question,
  conversationId,
  onProgress = null,
  externalSignal = null
) {
  const cleanQuestion =
    normalizeQuestion(
      question
    );


  const abortManager =
    createAbortManager(
      externalSignal
    );


  let reader =
    null;


  try {
    const response =
      await fetch(
        buildApiUrl(
          "/chat-stream"
        ),
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "text/event-stream",
          },

          body:
            JSON.stringify(
              buildChatPayload(
                cleanQuestion,
                conversationId
              )
            ),

          signal:
            abortManager.signal,
        }
      );


    if (!response.ok) {
      const errorMessage =
        await readErrorResponse(
          response
        );


      throw new Error(
        errorMessage
      );
    }


    if (!response.body) {
      throw new Error(
        (
          "The AI service did not "
          + "return a streaming response."
        )
      );
    }


    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    if (
      !contentType.includes(
        "text/event-stream"
      )
    ) {
      console.warn(
        (
          "Expected text/event-stream "
          + "but received:"
        ),
        contentType
      );
    }


    reader =
      response.body.getReader();


    const decoder =
      new TextDecoder(
        "utf-8"
      );


    let buffer =
      "";


    let finalResult =
      null;


    while (true) {
      const {
        value,
        done,
      } =
        await reader.read();


      if (done) {
        break;
      }


      buffer +=
        decoder.decode(
          value,
          {
            stream: true,
          }
        );


      buffer =
        buffer.replace(
          /\r\n/g,
          "\n"
        );


      const blocks =
        buffer.split(
          "\n\n"
        );


      buffer =
        blocks.pop() ||
        "";


      for (
        const block
        of blocks
      ) {
        const event =
          parseSseEventBlock(
            block
          );


        if (!event) {
          continue;
        }


        const result =
          processSseEvent(
            event,
            onProgress
          );


        if (result) {
          finalResult =
            result;
        }
      }
    }


    buffer +=
      decoder.decode();


    buffer =
      buffer.replace(
        /\r\n/g,
        "\n"
      );


    if (
      buffer.trim()
    ) {
      const remainingBlocks =
        buffer.split(
          "\n\n"
        );


      for (
        const block
        of remainingBlocks
      ) {
        if (
          !block.trim()
        ) {
          continue;
        }


        const event =
          parseSseEventBlock(
            block
          );


        if (!event) {
          continue;
        }


        const result =
          processSseEvent(
            event,
            onProgress
          );


        if (result) {
          finalResult =
            result;
        }
      }
    }


    if (!finalResult) {
      throw new Error(
        (
          "The streaming request ended "
          + "without a result."
        )
      );
    }


    console.log(
      "Final streaming result:",
      finalResult
    );


    return finalResult;


  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      if (
        abortManager
          .wasExternallyAborted()
      ) {
        throw new Error(
          "Request stopped."
        );
      }


      if (
        abortManager
          .wasTimedOut()
      ) {
        throw new Error(
          (
            "The request took too long. "
            + "Please try again."
          )
        );
      }


      throw new Error(
        "The request was cancelled."
      );
    }


    if (
      error instanceof TypeError &&
      error.message ===
        "Failed to fetch"
    ) {
      throw new Error(
        (
          "The AI service is temporarily unavailable. "
          + "Please try again."
        )
      );
    }


    throw error;


  } finally {
    abortManager.cleanup();


    if (reader) {
      try {
        reader.releaseLock();
      } catch {
        // Nothing required.
      }
    }
  }
}