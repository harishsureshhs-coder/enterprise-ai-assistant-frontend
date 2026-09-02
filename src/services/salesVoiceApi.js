import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// VOICE GENERATION TIMEOUT
// =========================================================

const SALES_VOICE_TIMEOUT_MS =
  120000;


// =========================================================
// SYNTHESIZE SALES VOICE SUMMARY
//
// Input:
// grounded Sales answer
//
// Output:
// audio Blob (MP3)
// =========================================================

export async function synthesizeSalesVoiceSummary({
  text,
}) {

  const cleanText =
    String(
      text || ""
    ).trim();


  if (
    !cleanText
  ) {

    throw new Error(
      "Voice summary text is required."
    );
  }


  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {
        controller.abort();
      },
      SALES_VOICE_TIMEOUT_MS
    );


  try {

    const response =
      await fetch(
        `${API_URL}/sales/voice-summary`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "audio/mpeg",
          },

          body:
            JSON.stringify({
              text:
                cleanText,
            }),

          signal:
            controller.signal,
        }
      );


    if (
      !response.ok
    ) {

      let errorMessage =
        (
          "Unable to generate Sales voice summary. " +
          `Status: ${response.status}`
        );


      try {

        const contentType =
          String(
            response.headers.get(
              "content-type"
            ) || ""
          ).toLowerCase();


        if (
          contentType.includes(
            "application/json"
          )
        ) {

          const result =
            await response.json();


          errorMessage =
            result?.detail ||
            result?.message ||
            errorMessage;


        } else {

          const result =
            await response.text();


          if (
            result
          ) {

            errorMessage =
              result;
          }
        }


      } catch {

        // Keep fallback error.
      }


      throw new Error(
        errorMessage
      );
    }


    const audioBlob =
      await response.blob();


    if (
      !audioBlob ||
      audioBlob.size <= 0
    ) {

      throw new Error(
        "Voice summary audio was empty."
      );
    }


    return audioBlob;


  } catch (
    error
  ) {

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "Voice summary generation took too long."
      );
    }


    throw error;


  } finally {

    window.clearTimeout(
      timeoutId
    );
  }
}