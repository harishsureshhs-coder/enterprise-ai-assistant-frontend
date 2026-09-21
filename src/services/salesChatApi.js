import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// SALES CHAT TIMEOUT
// =========================================================

const SALES_CHAT_TIMEOUT_MS =
  180000;


// =========================================================
// PARSE ONE SSE BLOCK
// =========================================================

function parseSseBlock(
  rawBlock
) {

  const cleanBlock =
    String(
      rawBlock || ""
    )
      .replace(
        /\r/g,
        ""
      )
      .trim();


  if (
    !cleanBlock
  ) {

    return null;
  }


  // SSE heartbeat/comment.
  if (
    cleanBlock.startsWith(
      ":"
    )
  ) {

    return null;
  }


  const lines =
    cleanBlock.split(
      "\n"
    );


  let eventName =
    "";


  const dataLines =
    [];


  for (
    const rawLine
    of lines
  ) {

    const line =
      String(
        rawLine || ""
      );


    if (
      line.startsWith(
        ":"
      )
    ) {

      continue;
    }


    if (
      line.startsWith(
        "event:"
      )
    ) {

      eventName =
        line
          .slice(
            6
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
            5
          )
          .trimStart()
      );
    }
  }


  if (
    dataLines.length === 0
  ) {

    return null;
  }


  const jsonText =
    dataLines.join(
      "\n"
    );


  let data =
    null;


  try {

    data =
      JSON.parse(
        jsonText
      );


  } catch {

    return null;
  }


  return {
    eventName,
    data,
  };
}


// =========================================================
// SALES CHAT SSE
// =========================================================

export async function sendSalesMessageStream({
  question,
  conversationId,
  userId,
  selectedCustomer = null,
  responseMode = "text",
  onProgress = null,
}) {

  const cleanQuestion =
    String(
      question || ""
    ).trim();


  if (
    !cleanQuestion
  ) {

    throw new Error(
      "Sales question is required."
    );
  }


  const cleanConversationId =
    conversationId
      ? String(
          conversationId
        ).trim()
      : null;


  const cleanUserId =
    userId
      ? String(
          userId
        ).trim()
      : null;


  const cleanResponseMode =
    String(
      responseMode || "text"
    )
      .trim()
      .toLowerCase();


  const selectedCustomerPayload =
    selectedCustomer?.bmd_code
      ? {
          bmd_code:
            String(
              selectedCustomer.bmd_code
            ).trim(),

          bmd_name:
            String(
              selectedCustomer.bmd_name ||
              ""
            ).trim(),
        }
      : null;


  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {
        controller.abort();
      },
      SALES_CHAT_TIMEOUT_MS
    );


  let reader =
    null;


  try {

    const response =
      await fetch(
        `${API_URL}/sales/chat-stream`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "text/event-stream",
          },

          body:
            JSON.stringify({
              question:
                cleanQuestion,

              conversation_id:
                cleanConversationId,

              user_id:
                cleanUserId,

              selected_customer:
                selectedCustomerPayload,

              response_mode:
                cleanResponseMode,
            }),

          signal:
            controller.signal,
        }
      );


    // =====================================================
    // HTTP ERROR
    // =====================================================

    if (
      !response.ok
    ) {

      let errorText =
        `Sales chat failed. Status: ${response.status}`;


      try {

        const errorBody =
          await response.json();


        errorText =
          errorBody?.detail ||
          errorBody?.message ||
          errorText;


      } catch {

        // Keep fallback error.
      }


      throw new Error(
        errorText
      );
    }


    // =====================================================
    // STREAM VALIDATION
    // =====================================================

    if (
      !response.body
    ) {

      throw new Error(
        "Sales chat stream was not returned."
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


    // =====================================================
    // READ STREAM
    // =====================================================

    while (
      true
    ) {

      const {
        value,
        done,
      } =
        await reader.read();


      if (
        done
      ) {

        buffer +=
          decoder.decode();

        break;
      }


      buffer +=
        decoder.decode(
          value,
          {
            stream:
              true,
          }
        );


      // Normalize CRLF.
      buffer =
        buffer.replace(
          /\r\n/g,
          "\n"
        );


      // SSE events are separated by blank lines.
      const blocks =
        buffer.split(
          "\n\n"
        );


      // Keep incomplete block for next chunk.
      buffer =
        blocks.pop() ||
        "";


      for (
        const rawBlock
        of blocks
      ) {

        const parsed =
          parseSseBlock(
            rawBlock
          );


        if (
          !parsed
        ) {

          continue;
        }


        const {
          eventName,
          data:
            eventData,
        } =
          parsed;


        const eventType =
          String(
            eventData?.type ||
            eventName ||
            ""
          )
            .trim()
            .toLowerCase();


        // =================================================
        // PROGRESS EVENT
        // =================================================

        if (
          eventType ===
          "progress"
        ) {

          if (
            typeof onProgress ===
            "function"
          ) {

            onProgress(
              {
                type:
                  "progress",

                stage:
                  eventData?.stage ||
                  "processing",

                message:
                  eventData?.message ||
                  "Processing your Sales request...",
              }
            );
          }


          continue;
        }


        // =================================================
        // ERROR EVENT
        // =================================================

        if (
          eventType ===
          "error"
        ) {

          throw new Error(
            eventData?.message ||
            eventData?.detail ||
            "Sales chat failed."
          );
        }


        // =================================================
        // RESULT EVENT
        // =================================================

        if (
          eventType ===
          "result"
        ) {

          finalResult =
            eventData?.data ||
            eventData?.result ||
            {};


          continue;
        }


        // =================================================
        // COMPLETED EVENT
        // =================================================

        if (
          eventType ===
          "completed"
        ) {

          if (
            finalResult
          ) {

            return finalResult;
          }


          // Backward-compatible format:
          //
          // completed event contains:
          //
          // {
          //   result: {...}
          // }

          if (
            eventData?.result
          ) {

            return (
              eventData.result
            );
          }


          continue;
        }
      }
    }


    // =====================================================
    // PROCESS LAST BUFFER
    //
    // Handles a final SSE event when the connection closes
    // without another blank line.
    // =====================================================

    if (
      buffer.trim()
    ) {

      const parsed =
        parseSseBlock(
          buffer
        );


      if (
        parsed
      ) {

        const eventData =
          parsed.data;


        const eventType =
          String(
            eventData?.type ||
            parsed.eventName ||
            ""
          )
            .trim()
            .toLowerCase();


        if (
          eventType ===
          "error"
        ) {

          throw new Error(
            eventData?.message ||
            eventData?.detail ||
            "Sales chat failed."
          );
        }


        if (
          eventType ===
          "result"
        ) {

          finalResult =
            eventData?.data ||
            eventData?.result ||
            {};
        }


        if (
          eventType ===
          "completed" &&
          eventData?.result
        ) {

          finalResult =
            eventData.result;
        }
      }
    }


    // =====================================================
    // RETURN RESULT
    // =====================================================

    if (
      finalResult
    ) {

      return finalResult;
    }


    throw new Error(
      "Sales chat stream ended without a result."
    );


  } catch (
    error
  ) {

    // =====================================================
    // TIMEOUT
    // =====================================================

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "The Sales question took too long to process."
      );
    }


    throw error;


  } finally {

    // =====================================================
    // CLEANUP
    // =====================================================

    window.clearTimeout(
      timeoutId
    );


    if (
      reader
    ) {

      try {

        await reader.cancel();


      } catch {

        // Stream may already be closed.
      }
    }
  }
}