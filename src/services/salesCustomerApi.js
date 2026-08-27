const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://exesalesdev-fdfkfpb9fmabcadg.eastus-01.azurewebsites.net";


const REQUEST_TIMEOUT_MS = 120000;


// =========================================================
// SEARCH PRIMARY BMD CUSTOMERS
//
// GET
// /sales/customers?search=PANU%20DIESEL&limit=20
// =========================================================

export async function searchSalesCustomers({
  search = "",
  limit = 20,
}) {

  const cleanSearch =
    String(
      search || ""
    ).trim();


  const params =
    new URLSearchParams();


  params.set(
    "search",
    cleanSearch
  );


  params.set(
    "limit",
    String(
      limit
    )
  );


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
        `${API_URL}/sales/customers?${params.toString()}`,
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


    let result = null;


    try {

      result =
        await response.json();

    } catch {

      throw new Error(
        "Customer search returned an invalid response."
      );
    }


    if (!response.ok) {

      throw new Error(
        result?.detail ||
        (
          "Unable to search customers. " +
          `Status: ${response.status}`
        )
      );
    }


    return (
      Array.isArray(
        result?.customers
      )
        ? result.customers
        : []
    );


  } catch (error) {

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
// GET PRIMARY CUSTOMER BUSINESS SNAPSHOT
//
// GET
// /sales/customers/{bmd_code}/snapshot
// =========================================================

export async function getSalesCustomerSnapshot({
  bmdCode,
}) {

  const cleanBmdCode =
    String(
      bmdCode || ""
    ).trim();


  if (!cleanBmdCode) {

    throw new Error(
      "BMD code is required."
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
        (
          `${API_URL}/sales/customers/` +
          `${encodeURIComponent(cleanBmdCode)}/snapshot`
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


    let result = null;


    try {

      result =
        await response.json();

    } catch {

      throw new Error(
        "Customer snapshot returned an invalid response."
      );
    }


    if (!response.ok) {

      throw new Error(
        result?.detail ||
        (
          "Unable to load customer snapshot. " +
          `Status: ${response.status}`
        )
      );
    }


    return result;


  } catch (error) {

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "Customer snapshot request took too long."
      );
    }


    throw error;


  } finally {

    window.clearTimeout(
      timeoutId
    );
  }
}