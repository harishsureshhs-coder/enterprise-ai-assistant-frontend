import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// TIMEOUTS
// =========================================================

const START_VISIT_TIMEOUT_MS =
  60000;


// Finishing a visit performs:
//
// SQL transcript retrieval
//        ↓
// Azure OpenAI insight generation
//        ↓
// SQL persistence
//
// Therefore allow more time than a normal REST request.
const COMPLETE_VISIT_TIMEOUT_MS =
  220000;


// =========================================================
// READ API RESPONSE
//
// Handles:
//
// JSON response
// plain-text error
// empty response
// =========================================================

async function readApiResponse(
  response
) {

  const contentType =
    String(
      response.headers.get(
        "content-type"
      ) || ""
    ).toLowerCase();


  // =====================================================
  // JSON
  // =====================================================

  if (
    contentType.includes(
      "application/json"
    )
  ) {

    try {

      return await response.json();

    } catch {

      return null;
    }
  }


  // =====================================================
  // TEXT
  // =====================================================

  try {

    const text =
      await response.text();


    if (
      !text
    ) {

      return null;
    }


    return {
      detail:
        text,
    };


  } catch {

    return null;
  }
}


// =========================================================
// GET API ERROR MESSAGE
// =========================================================

function getApiErrorMessage(
  result,
  fallbackMessage
) {

  // FastAPI normally returns:
  //
  // {
  //   "detail": "..."
  // }

  if (
    typeof result?.detail ===
      "string" &&
    result.detail.trim()
  ) {

    return result.detail.trim();
  }


  // Some endpoints may return:
  //
  // {
  //   "message": "..."
  // }

  if (
    typeof result?.message ===
      "string" &&
    result.message.trim()
  ) {

    return result.message.trim();
  }


  // Pydantic validation may return detail as an array.

  if (
    Array.isArray(
      result?.detail
    )
  ) {

    const validationMessages =
      result.detail
        .map(
          (
            item
          ) => {

            if (
              typeof item?.msg ===
                "string"
            ) {

              return item.msg;
            }


            return null;
          }
        )
        .filter(
          Boolean
        );


    if (
      validationMessages.length > 0
    ) {

      return validationMessages.join(
        " "
      );
    }
  }


  return fallbackMessage;
}


// =========================================================
// START SALES VISIT
//
// Selected customer
//       ↓
// POST /sales/visits
//       ↓
// ai_app.sales_visit
//
// Expected backend:
//
// {
//   "status": "started",
//   "visit": {
//      "visit_id": "...",
//      ...
//   }
// }
//
// IMPORTANT:
//
// SalesApp expects this function itself to return:
//
// {
//    visit_id: "...",
//    ...
// }
//
// not the outer API wrapper.
// =========================================================

export async function startSalesVisit({
  bmdCode,
  userId,
  conversationId = null,
}) {

  // =====================================================
  // VALIDATE BMD CODE
  // =====================================================

  const cleanBmdCode =
    String(
      bmdCode || ""
    ).trim();


  if (
    !cleanBmdCode
  ) {

    throw new Error(
      "BMD code is required to start a Sales visit."
    );
  }


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
      "User ID is required to start a Sales visit."
    );
  }


  // =====================================================
  // OPTIONAL CONVERSATION
  //
  // A Sales visit can intentionally start before any
  // conversation exists.
  // =====================================================

  const cleanConversationId =
    conversationId
      ? String(
          conversationId
        ).trim()
      : null;


  // =====================================================
  // REQUEST TIMEOUT
  // =====================================================

  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {

        controller.abort();

      },
      START_VISIT_TIMEOUT_MS
    );


  try {

    console.log(
      "Starting Sales visit:",
      {
        bmdCode:
          cleanBmdCode,

        userId:
          cleanUserId,

        conversationId:
          cleanConversationId,
      }
    );


    // ===================================================
    // CALL BACKEND
    // ===================================================

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
                cleanConversationId,
            }),

          signal:
            controller.signal,
        }
      );


    // ===================================================
    // READ RESPONSE
    // ===================================================

    const result =
      await readApiResponse(
        response
      );


    // ===================================================
    // API ERROR
    // ===================================================

    if (
      !response.ok
    ) {

      throw new Error(
        getApiErrorMessage(
          result,
          (
            "Unable to start Sales visit. " +
            `Status: ${response.status}`
          )
        )
      );
    }


    // ===================================================
    // VALIDATE VISIT
    // ===================================================

    const visit =
      result?.visit;


    if (
      !visit ||
      typeof visit !==
        "object"
    ) {

      throw new Error(
        "Sales visit API did not return visit data."
      );
    }


    const visitId =
      String(
        visit?.visit_id || ""
      ).trim();


    if (
      !visitId
    ) {

      throw new Error(
        "Sales visit API did not return a visit ID."
      );
    }


    console.log(
      "Sales visit started successfully:",
      {
        visitId:
          visitId,

        bmdCode:
          visit?.bmd_code,

        bmdName:
          visit?.bmd_name,

        status:
          visit?.visit_status,
      }
    );


    // ===================================================
    // IMPORTANT
    //
    // SalesApp expects:
    //
    // const visit = await startSalesVisit(...)
    //
    // visit.visit_id
    //
    // Therefore return visit directly.
    // ===================================================

    return visit;


  } catch (
    error
  ) {

    // ===================================================
    // TIMEOUT
    // ===================================================

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "Starting the Sales visit took too long."
      );
    }


    throw error;


  } finally {

    window.clearTimeout(
      timeoutId
    );
  }
}


// =========================================================
// COMPLETE SALES VISIT
//
// Visit in progress
//       ↓
// POST /sales/visits/{visit_id}/complete
//       ↓
// Load ALL visit transcripts
//       ↓
// SalesSummaryService
//       ↓
// Structured English insights
//       ↓
// ai_app.sales_visit_insight
//       ↓
// visit_status = COMPLETED
//
// Expected backend:
//
// {
//   "status": "completed",
//   "already_completed": false,
//   "visit": {...},
//   "insights": {...},
//   "transcript_count": 1
// }
//
// IMPORTANT:
//
// SalesApp expects the COMPLETE response because it uses:
//
// result.visit
// result.insights
// =========================================================

export async function completeSalesVisit({
  visitId,
  bmdCode,
  userId,
}) {

  // =====================================================
  // VISIT ID
  // =====================================================

  const cleanVisitId =
    String(
      visitId || ""
    ).trim();


  if (
    !cleanVisitId
  ) {

    throw new Error(
      "Sales visit ID is required."
    );
  }


  // =====================================================
  // CUSTOMER
  // =====================================================

  const cleanBmdCode =
    String(
      bmdCode || ""
    ).trim();


  if (
    !cleanBmdCode
  ) {

    throw new Error(
      "BMD code is required to complete the Sales visit."
    );
  }


  // =====================================================
  // USER
  // =====================================================

  const cleanUserId =
    String(
      userId || ""
    ).trim();


  if (
    !cleanUserId
  ) {

    throw new Error(
      "User ID is required to complete the Sales visit."
    );
  }


  // =====================================================
  // REQUEST TIMEOUT
  // =====================================================

  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {

        controller.abort();

      },
      COMPLETE_VISIT_TIMEOUT_MS
    );


  try {

    console.log(
      "Completing Sales visit:",
      {
        visitId:
          cleanVisitId,

        bmdCode:
          cleanBmdCode,

        userId:
          cleanUserId,
      }
    );


    // ===================================================
    // CALL BACKEND
    // ===================================================

    const response =
      await fetch(
        (
          `${API_URL}/sales/visits/` +
          `${encodeURIComponent(
            cleanVisitId
          )}/complete`
        ),
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
            }),

          signal:
            controller.signal,
        }
      );


    // ===================================================
    // READ RESPONSE
    // ===================================================

    const result =
      await readApiResponse(
        response
      );


    // ===================================================
    // API ERROR
    // ===================================================

    if (
      !response.ok
    ) {

      throw new Error(
        getApiErrorMessage(
          result,
          (
            "Unable to complete Sales visit. " +
            `Status: ${response.status}`
          )
        )
      );
    }


    // ===================================================
    // RESPONSE VALIDATION
    // ===================================================

    if (
      !result ||
      typeof result !==
        "object"
    ) {

      throw new Error(
        "Complete Sales visit API returned an invalid response."
      );
    }


    // ===================================================
    // VISIT VALIDATION
    // ===================================================

    if (
      !result?.visit ||
      typeof result.visit !==
        "object"
    ) {

      throw new Error(
        "Sales visit was completed but visit data was not returned."
      );
    }


    // ===================================================
    // INSIGHT VALIDATION
    // ===================================================

    if (
      !result?.insights ||
      typeof result.insights !==
        "object"
    ) {

      throw new Error(
        "Sales visit was completed but insights were not returned."
      );
    }


    console.log(
      "Sales visit completed successfully:",
      {
        visitId:
          result?.visit?.visit_id,

        visitStatus:
          result?.visit?.visit_status,

        alreadyCompleted:
          Boolean(
            result?.already_completed
          ),

        transcriptCount:
          result?.transcript_count,

        hasSummary:
          Boolean(
            result?.insights
              ?.visit_summary
          ),

        customerNeeds:
          Array.isArray(
            result?.insights
              ?.customer_needs
          )
            ? result.insights
                .customer_needs
                .length
            : 0,

        opportunities:
          Array.isArray(
            result?.insights
              ?.opportunities
          )
            ? result.insights
                .opportunities
                .length
            : 0,

        nextActions:
          Array.isArray(
            result?.insights
              ?.next_actions
          )
            ? result.insights
                .next_actions
                .length
            : 0,
      }
    );


    // ===================================================
    // IMPORTANT
    //
    // Unlike startSalesVisit(), return the FULL result.
    //
    // SalesApp uses:
    //
    // result.visit
    // result.insights
    // ===================================================

    return result;


  } catch (
    error
  ) {

    // ===================================================
    // TIMEOUT
    // ===================================================

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "Generating Sales visit insights took too long."
      );
    }


    throw error;


  } finally {

    window.clearTimeout(
      timeoutId
    );
  }
}