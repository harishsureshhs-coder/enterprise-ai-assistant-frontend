// const API_URL =
//   import.meta.env.VITE_API_URL ||
//   "https://exesalesdev-fdfkfpb9fmabcadg.eastus-01.azurewebsites.net";

import {
  API_URL,
} from "../config/apiConfig";


const REQUEST_TIMEOUT_MS =
  120000;


// =========================================================
// START SALES VISIT
//
// POST /sales/visits
// =========================================================

export async function startSalesVisit({
  bmdCode,
  userId,
  conversationId = null,
}) {

  const cleanBmdCode =
    String(
      bmdCode || ""
    ).trim();


  const cleanUserId =
    String(
      userId || ""
    ).trim();


  if (!cleanBmdCode) {

    throw new Error(
      "BMD code is required to start a visit."
    );
  }


  if (!cleanUserId) {

    throw new Error(
      "Authenticated user is required to start a visit."
    );
  }


  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {
        controller.abort();
      },
      REQUEST_TIMEOUT_MS
    );


  try {

    const response =
      await fetch(
        `${API_URL}/sales/visits`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify({
              bmd_code:
                cleanBmdCode,

              user_id:
                cleanUserId,

              conversation_id:
                conversationId || null,
            }),

          signal:
            controller.signal,
        }
      );


    let result =
      null;


    try {

      result =
        await response.json();


    } catch {

      throw new Error(
        "Start Visit returned an invalid response."
      );
    }


    if (!response.ok) {

      throw new Error(
        result?.detail ||
        (
          "Unable to start Sales visit. " +
          `Status: ${response.status}`
        )
      );
    }


    if (
      !result?.visit?.visit_id
    ) {

      throw new Error(
        "Visit was created but visit ID was not returned."
      );
    }


    return result.visit;


  } catch (error) {

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "Start Visit request took too long."
      );
    }


    throw error;


  } finally {

    window.clearTimeout(
      timeoutId
    );
  }
}