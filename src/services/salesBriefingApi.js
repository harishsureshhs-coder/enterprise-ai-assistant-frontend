const API_BASE_URL =
  String(
    import.meta.env.VITE_API_URL ||
    ""
  ).replace(
    /\/$/,
    ""
  );


export async function generateSalesBriefing({
  bmdCode,
  businessSnapshot,
}) {

  const cleanBmdCode =
    String(
      bmdCode ||
      ""
    ).trim();


  if (
    !cleanBmdCode
  ) {

    throw new Error(
      "Select a customer before generating a Sales Briefing."
    );
  }


  const response =
    await fetch(
      `${API_BASE_URL}/sales/sales-briefing`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            {
              bmd_code:
                cleanBmdCode,

              business_snapshot:
                businessSnapshot ||
                null,
            }
          ),
      }
    );


  if (
    !response.ok
  ) {

    let errorMessage =
      "Unable to generate Sales Briefing.";


    try {

      const errorBody =
        await response.json();


      errorMessage =
        errorBody?.detail ||
        errorBody?.message ||
        errorMessage;

    } catch {

      try {

        const errorText =
          await response.text();


        if (
          errorText
        ) {

          errorMessage =
            errorText;
        }

      } catch {

        // Keep fallback message.
      }
    }


    throw new Error(
      errorMessage
    );
  }


  return response.json();
}
