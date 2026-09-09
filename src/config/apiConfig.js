const rawApiUrl =
  String(
    import.meta.env.VITE_API_URL || ""
  ).trim();


if (!rawApiUrl) {
  throw new Error(
    "VITE_API_URL is not configured."
  );
}


export const API_URL =
  rawApiUrl.replace(
    /\/+$/,
    ""
  );


console.log(
  "Frontend API configuration:",
  {
    apiUrl:
      API_URL,

    authMode:
      import.meta.env.VITE_AUTH_MODE ||
      "entra",

    mode:
      import.meta.env.MODE,
  }
);