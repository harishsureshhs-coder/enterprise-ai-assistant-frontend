import {
  API_URL,
} from "../config/apiConfig";


// =========================================================
// CONSTANTS
// =========================================================

const MIN_CUSTOMER_SEARCH_LENGTH =
  3;


const CUSTOMER_SEARCH_LIMIT =
  20;


// Customer search should be fast.
// The debounce happens in the component.
//
// This timeout protects the browser if the
// backend/database becomes unavailable.

const CUSTOMER_SEARCH_TIMEOUT_MS =
  15000;


const CUSTOMER_SNAPSHOT_TIMEOUT_MS =
  30000;


// =========================================================
// READ JSON SAFELY
// =========================================================

async function readJsonSafely(
  response
) {

  try {

    return await response.json();


  } catch {

    return null;
  }
}


// =========================================================
// GET ERROR MESSAGE
// =========================================================

function getApiErrorMessage(
  result,
  fallbackMessage
) {

  const detail =
    result?.detail;


  if (
    typeof detail ===
    "string" &&
    detail.trim()
  ) {

    return detail.trim();
  }


  if (
    typeof result?.message ===
    "string" &&
    result.message.trim()
  ) {

    return result.message.trim();
  }


  return fallbackMessage;
}


// =========================================================
// SEARCH SALES CUSTOMERS
// =========================================================

export async function searchSalesCustomers(
  searchText
) {

  const cleanSearch =
    String(
      searchText
      || ""
    ).trim();


  // -------------------------------------------------------
  // NEVER CALL BACKEND FOR 1-2 CHARACTERS
  // -------------------------------------------------------

  if (
    cleanSearch.length <
    MIN_CUSTOMER_SEARCH_LENGTH
  ) {

    return [];
  }


  console.log(
    "Searching primary Sales customers:",
    cleanSearch
  );


  // -------------------------------------------------------
  // ABORT CONTROLLER
  // -------------------------------------------------------

  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {

        controller.abort();

      },
      CUSTOMER_SEARCH_TIMEOUT_MS
    );


  try {

    // -----------------------------------------------------
    // ENDPOINT
    //
    // Example:
    //
    // /sales/customers/search
    //      ?search_text=170015
    //      &limit=20
    // -----------------------------------------------------

    const url =
      (
        `${API_URL}/sales/customers/search`
        +
        `?search_text=${
          encodeURIComponent(
            cleanSearch
          )
        }`
        +
        `&limit=${
          CUSTOMER_SEARCH_LIMIT
        }`
      );


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

          signal:
            controller.signal,
        }
      );


    const result =
      await readJsonSafely(
        response
      );


    if (
      !response.ok
    ) {

      throw new Error(
        getApiErrorMessage(
          result,
          (
            "Unable to search "
            + "Sales customers."
          )
        )
      );
    }


    // -----------------------------------------------------
    // CURRENT BACKEND CONTRACT
    // -----------------------------------------------------

    if (
      Array.isArray(
        result?.customers
      )
    ) {

      return result.customers;
    }


    // -----------------------------------------------------
    // BACKWARD COMPATIBILITY
    // -----------------------------------------------------

    if (
      Array.isArray(
        result
      )
    ) {

      return result;
    }


    if (
      Array.isArray(
        result?.results
      )
    ) {

      return result.results;
    }


    return [];


  } catch (
    error
  ) {

    // -----------------------------------------------------
    // TIMEOUT
    // -----------------------------------------------------

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "Customer search took too long."
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
// GET CUSTOMER BUSINESS SNAPSHOT
// =========================================================

export async function getSalesCustomerSnapshot({
  bmdCode,
}) {

  const cleanBmdCode =
    String(
      bmdCode
      || ""
    ).trim();


  if (
    !cleanBmdCode
  ) {

    throw new Error(
      "Customer code is required."
    );
  }


  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {

        controller.abort();

      },
      CUSTOMER_SNAPSHOT_TIMEOUT_MS
    );


  try {

    const response =
      await fetch(
        (
          `${API_URL}/sales/customers/`
          +
          `${
            encodeURIComponent(
              cleanBmdCode
            )
          }`
          +
          "/snapshot"
        ),
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",
          },

          signal:
            controller.signal,
        }
      );


    const result =
      await readJsonSafely(
        response
      );


    if (
      !response.ok
    ) {

      throw new Error(
        getApiErrorMessage(
          result,
          (
            "Unable to load customer "
            + "business snapshot."
          )
        )
      );
    }


    return result;


  } catch (
    error
  ) {

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        (
          "Customer business snapshot "
          + "took too long."
        )
      );
    }


    throw error;


  } finally {

    window.clearTimeout(
      timeoutId
    );
  }
}