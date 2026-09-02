import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// SALES CHAT TIMEOUT
// =========================================================

const SALES_CHAT_TIMEOUT_MS =
  180000;


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

        // Keep fallback.
      }


      throw new Error(
        errorText
      );
    }


    if (
      !response.body
    ) {

      throw new Error(
        "Sales chat stream was not returned."
      );
    }


    const reader =
      response.body.getReader();


    const decoder =
      new TextDecoder(
        "utf-8"
      );


    let buffer =
      "";


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


      const events =
        buffer.split(
          "\n\n"
        );


      buffer =
        events.pop() ||
        "";


      for (
        const rawEvent
        of events
      ) {

        const lines =
          rawEvent.split(
            "\n"
          );


        for (
          const line
          of lines
        ) {

          if (
            !line.startsWith(
              "data:"
            )
          ) {

            continue;
          }


          const jsonText =
            line
              .slice(
                5
              )
              .trim();


          if (
            !jsonText
          ) {

            continue;
          }


          let eventData =
            null;


          try {

            eventData =
              JSON.parse(
                jsonText
              );


          } catch {

            continue;
          }


          if (
            eventData?.type ===
            "progress"
          ) {

            if (
              typeof onProgress ===
              "function"
            ) {

              onProgress(
                eventData
              );
            }


            continue;
          }


          if (
            eventData?.type ===
            "error"
          ) {

            throw new Error(
              eventData?.message ||
              "Sales chat failed."
            );
          }


          if (
            eventData?.type ===
            "result"
          ) {

            return (
              eventData?.data ||
              {}
            );
          }
        }
      }
    }


    throw new Error(
      "Sales chat stream ended without a result."
    );


  } catch (
    error
  ) {

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

    window.clearTimeout(
      timeoutId
    );
  }
}