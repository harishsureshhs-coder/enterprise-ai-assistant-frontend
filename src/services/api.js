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
//
// Supports:
//
// 1. Internal request timeout
// 2. Future Stop/Cancel button using AbortController
//
// Existing callers can continue using only 3 arguments.
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


  // -------------------------------------------------------
  // External cancellation
  // -------------------------------------------------------

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


  // -------------------------------------------------------
  // Timeout
  // -------------------------------------------------------

  const timeoutId =
    window.setTimeout(
      () => {
        timedOut =
          true;

        controller.abort();
      },
      timeoutMs
    );


  // -------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------

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


    // -----------------------------------------------------
    // JSON response
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // Plain text response
    // -----------------------------------------------------

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
//
// Kept for compatibility.
// Main UI currently uses sendMessageStream().
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
//
// Backend sends:
//
// data: {"type":"progress", ...}
//
// OR
//
// data: {"type":"result","data":{...}}
//
// OR
//
// data: {"type":"error","message":"..."}
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
//
// Returns:
// - actual result object when event is result
// - null for progress / ignored events
//
// Throws:
// - Error when backend sends type=error
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
  // BACKEND ERROR
  //
  // Important:
  // SSE HTTP status may still be 200 because the stream
  // already started before backend processing failed.
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
  //
  // Current backend format:
  //
  // {
  //   "type": "result",
  //   "data": {
  //      "engine": "SQL",
  //      "answer": "...",
  //      ...
  //   }
  // }
  //
  // App.jsx expects:
  //
  // response.engine
  // response.answer
  // response.rows
  //
  // Therefore we MUST return event.data.
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
  //
  // Supports older backend versions that may return
  // the result directly rather than wrapping it.
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
//
// Existing use:
//
// sendMessageStream(
//   question,
//   conversationId,
//   onProgress
// )
//
// Future Stop button:
//
// sendMessageStream(
//   question,
//   conversationId,
//   onProgress,
//   abortController.signal
// )
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
    // =====================================================
    // START SSE REQUEST
    // =====================================================

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


    // =====================================================
    // HTTP ERROR
    // =====================================================

    if (!response.ok) {
      const errorMessage =
        await readErrorResponse(
          response
        );


      throw new Error(
        errorMessage
      );
    }


    // =====================================================
    // STREAM REQUIRED
    // =====================================================

    if (!response.body) {
      throw new Error(
        (
          "The AI service did not "
          + "return a streaming response."
        )
      );
    }


    // =====================================================
    // VALIDATE CONTENT TYPE
    // =====================================================

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


    // =====================================================
    // STREAM READER
    // =====================================================

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


    // =====================================================
    // READ STREAM
    // =====================================================

    while (true) {
      const {
        value,
        done,
      } =
        await reader.read();


      if (done) {
        break;
      }


      // ---------------------------------------------------
      // Decode chunk
      // ---------------------------------------------------

      buffer +=
        decoder.decode(
          value,
          {
            stream: true,
          }
        );


      // ---------------------------------------------------
      // Normalize Windows / HTTP CRLF into LF.
      //
      // Backend currently writes:
      //
      // data: {...}\n\n
      //
      // But proxies may expose CRLF.
      // ---------------------------------------------------

      buffer =
        buffer.replace(
          /\r\n/g,
          "\n"
        );


      // ---------------------------------------------------
      // Split complete SSE blocks
      // ---------------------------------------------------

      const blocks =
        buffer.split(
          "\n\n"
        );


      // ---------------------------------------------------
      // Last item may be incomplete.
      // Keep it for next network chunk.
      // ---------------------------------------------------

      buffer =
        blocks.pop() ||
        "";


      // ---------------------------------------------------
      // Process complete events
      // ---------------------------------------------------

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


    // =====================================================
    // FLUSH DECODER
    // =====================================================

    buffer +=
      decoder.decode();


    buffer =
      buffer.replace(
        /\r\n/g,
        "\n"
      );


    // =====================================================
    // PROCESS ANY FINAL BUFFERED EVENT
    // =====================================================

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


    // =====================================================
    // FINAL RESULT REQUIRED
    // =====================================================

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
    // =====================================================
    // ABORT / TIMEOUT
    // =====================================================

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


    // =====================================================
    // NETWORK FAILURE
    // =====================================================

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


    // =====================================================
    // BACKEND / SSE ERROR
    // =====================================================

    throw error;


  } finally {
    // =====================================================
    // CLEANUP
    // =====================================================

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