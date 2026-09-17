import {
  API_URL,
} from "../config/apiConfig";


const MIN_CUSTOMER_SEARCH_LENGTH = 3;
const CUSTOMER_SEARCH_LIMIT = 20;
const CUSTOMER_SEARCH_TIMEOUT_MS = 20000;
const CUSTOMER_SNAPSHOT_TIMEOUT_MS = 30000;


// =========================================================
// SAFE JSON
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
// API ERROR
// =========================================================

function getApiErrorMessage(
  result,
  fallbackMessage
) {

  if (
    typeof result?.detail === "string" &&
    result.detail.trim()
  ) {

    return result.detail.trim();
  }


  if (
    typeof result?.message === "string" &&
    result.message.trim()
  ) {

    return result.message.trim();
  }


  return fallbackMessage;
}


// =========================================================
// NORMALIZE SEARCH ARGUMENT
//
// Supports:
//
// searchSalesCustomers("170")
//
// searchSalesCustomers({
//   searchText: "170"
// })
//
// searchSalesCustomers({
//   search: "170"
// })
//
// Keeps backward compatibility with older frontend code.
// =========================================================

function normalizeSearchText(
  input
) {

  if (
    input &&
    typeof input === "object"
  ) {

    return String(
      input.searchText
      ?? input.search_text
      ?? input.search
      ?? input.query
      ?? ""
    ).trim();
  }


  return String(
    input ?? ""
  ).trim();
}


// =========================================================
// NORMALIZE LIMIT
// =========================================================

function normalizeSearchLimit(
  input
) {

  if (
    !input ||
    typeof input !== "object"
  ) {

    return CUSTOMER_SEARCH_LIMIT;
  }


  const requestedLimit =
    Number(
      input.limit
      ?? CUSTOMER_SEARCH_LIMIT
    );


  if (
    !Number.isFinite(
      requestedLimit
    )
  ) {

    return CUSTOMER_SEARCH_LIMIT;
  }


  return Math.max(
    1,
    Math.min(
      requestedLimit,
      CUSTOMER_SEARCH_LIMIT
    )
  );
}


// =========================================================
// SEARCH SALES CUSTOMERS
// =========================================================

export async function searchSalesCustomers(
  input
) {

  const cleanSearch =
    normalizeSearchText(
      input
    );


  const searchLimit =
    normalizeSearchLimit(
      input
    );


  // -------------------------------------------------------
  // Minimum search length
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
          encodeURIComponent(
            searchLimit
          )
        }`
      );


    console.log(
      "Sales customer search URL:",
      url
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

          // Avoid browser/proxy cache for autocomplete.
          cache:
            "no-store",
        }
      );


    const result =
      await readJsonSafely(
        response
      );


    if (
      !response.ok
    ) {

      console.error(
        "Customer search API error:",
        {
          status:
            response.status,

          url,

          result,
        }
      );


      throw new Error(
        getApiErrorMessage(
          result,
          (
            "Customer search failed " +
            `(${response.status}).`
          )
        )
      );
    }


    // -----------------------------------------------------
    // Preferred API shape:
    //
    // {
    //   status: "success",
    //   customers: [...]
    // }
    // -----------------------------------------------------

    if (
      Array.isArray(
        result?.customers
      )
    ) {

      return result.customers;
    }


    // -----------------------------------------------------
    // Backward compatibility
    // -----------------------------------------------------

    if (
      Array.isArray(
        result?.results
      )
    ) {

      return result.results;
    }


    if (
      Array.isArray(
        result
      )
    ) {

      return result;
    }


    return [];


  } catch (
    error
  ) {

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
// CUSTOMER BUSINESS SNAPSHOT
// =========================================================

export async function getSalesCustomerSnapshot({
  bmdCode,
}) {

  const cleanBmdCode =
    String(
      bmdCode
      ?? ""
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

    const url =
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
      );


    console.log(
      "Loading Sales customer snapshot:",
      cleanBmdCode
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

          cache:
            "no-store",
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
            "Unable to load customer snapshot " +
            `(${response.status}).`
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
        "Customer business snapshot took too long."
      );
    }


    throw error;


  } finally {

    window.clearTimeout(
      timeoutId
    );
  }
}