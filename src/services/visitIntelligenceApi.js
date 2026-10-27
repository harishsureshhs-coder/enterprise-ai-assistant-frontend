import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// ERROR MESSAGE HELPER
// =========================================================

function buildErrorMessage(
  payload,
  fallback
) {
  if (
    payload &&
    typeof payload === "object"
  ) {
    return (
      payload.detail ||
      payload.message ||
      fallback
    );
  }

  return fallback;
}


// =========================================================
// READ JSON RESPONSE
// =========================================================

async function readJsonResponse(
  response,
  fallbackMessage
) {
  let payload = null;

  try {
    payload =
      await response.json();

  } catch {
    payload = null;
  }


  if (!response.ok) {

    throw new Error(
      buildErrorMessage(
        payload,
        fallbackMessage
      )
    );
  }


  return payload;
}


// =========================================================
// GET PREVIOUS CUSTOMER VISITS
//
// Example:
//
// GET
// /visit-intelligence/customers/17001526/visits
//     ?limit=5
//     &exclude_visit_id=<latest_visit_id>
//
// Returns:
//
// [
//   {
//     visit_id,
//     customer_code,
//     customer_name,
//     visited_by,
//     visit_date,
//     sales_office_name,
//     sales_employee
//   }
// ]
// =========================================================

export async function getPreviousCustomerVisits({
  customerCode,
  currentVisitId = null,
  limit = 5,
}) {

  const cleanCustomerCode =
    String(
      customerCode || ""
    ).trim();


  // =====================================================
  // VALIDATE CUSTOMER
  // =====================================================

  if (!cleanCustomerCode) {

    throw new Error(
      "Customer/BMD code is required."
    );
  }


  // =====================================================
  // QUERY PARAMETERS
  // =====================================================

  const params =
    new URLSearchParams();


  params.set(
    "limit",
    String(
      limit
    )
  );


  // Current latest visit should not appear again
  // inside Previous Visits.

  if (currentVisitId) {

    params.set(
      "exclude_visit_id",
      String(
        currentVisitId
      ).trim()
    );
  }


  // =====================================================
  // URL
  // =====================================================

  const url =
    (
      `${API_URL}/visit-intelligence/customers/`
      +
      `${encodeURIComponent(
        cleanCustomerCode
      )}`
      +
      `/visits?${params.toString()}`
    );


  console.log(
    "[VISIT_UI] Loading previous visits:",
    {
      customerCode:
        cleanCustomerCode,

      currentVisitId,

      limit,

      url,
    }
  );


  // =====================================================
  // REQUEST
  // =====================================================

  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },
      }
    );


  // =====================================================
  // RESPONSE
  // =====================================================

  const payload =
    await readJsonResponse(
      response,
      "Unable to load previous visits."
    );


  console.log(
    "[VISIT_UI] Previous visits response:",
    payload
  );


  // =====================================================
  // NORMALIZE
  // =====================================================

  return Array.isArray(
    payload?.visits
  )
    ? payload.visits
    : [];
}


// =========================================================
// GET SELECTED VISIT INTELLIGENCE
//
// Example:
//
// GET
// /visit-intelligence/visits/<visit_id>
//     ?customer_code=17001526
//
// Returns:
//
// {
//   visit_intelligence: {
//     visit_id,
//     customer_code,
//     customer_name,
//     visited_by,
//     visit_date,
//     sales_employee,
//     sales_office_name,
//     visit_summary,
//     customer_needs,
//     opportunities,
//     product_interests,
//     commercial_terms,
//     commitments,
//     next_actions,
//     service_issues,
//     competitors,
//     risks
//   }
// }
// =========================================================

export async function getVisitIntelligenceById({
  visitId,
  customerCode = null,
}) {

  const cleanVisitId =
    String(
      visitId || ""
    ).trim();


  // =====================================================
  // VALIDATE VISIT
  // =====================================================

  if (!cleanVisitId) {

    throw new Error(
      "Visit ID is required."
    );
  }


  // =====================================================
  // QUERY PARAMETERS
  // =====================================================

  const params =
    new URLSearchParams();


  if (customerCode) {

    const cleanCustomerCode =
      String(
        customerCode
      ).trim();


    if (cleanCustomerCode) {

      params.set(
        "customer_code",
        cleanCustomerCode
      );
    }
  }


  const queryString =
    params.toString();


  // =====================================================
  // URL
  // =====================================================

  const url =
    (
      `${API_URL}/visit-intelligence/visits/`
      +
      `${encodeURIComponent(
        cleanVisitId
      )}`
      +
      (
        queryString
          ? `?${queryString}`
          : ""
      )
    );


  console.log(
    "[VISIT_UI] Loading historical visit:",
    {
      visitId:
        cleanVisitId,

      customerCode,

      url,
    }
  );


  // =====================================================
  // REQUEST
  // =====================================================

  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },
      }
    );


  // =====================================================
  // RESPONSE
  // =====================================================

  const payload =
    await readJsonResponse(
      response,
      "Unable to load the selected visit."
    );


  console.log(
    "[VISIT_UI] Historical visit response:",
    payload
  );


  // =====================================================
  // RETURN VISIT INTELLIGENCE
  // =====================================================

  return (
    payload?.visit_intelligence ??
    null
  );
}