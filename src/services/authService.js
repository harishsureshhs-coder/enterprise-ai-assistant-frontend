export async function getCurrentUser() {

  const authMode =
    import.meta.env.VITE_AUTH_MODE ||
    "entra";


  const useDevelopmentUser =
    authMode === "local" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";


  // =====================================================
  // LOCAL / TEMPORARY DEV USER
  // =====================================================

  if (useDevelopmentUser) {

    console.warn(
      "Development authentication enabled."
    );


    return {
      id:
        "local-dev-user",

      name:
        "Local Developer",

      email:
        "local-dev@bosch.com",

      roles: [
        "app-users",
      ],

      authenticationType:
        "local-development",
    };
  }


  // =====================================================
  // AZURE / ENTRA ID
  // =====================================================

  try {

    const response =
      await fetch(
        "/.auth/me",
        {
          method:
            "GET",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        }
      );


    if (!response.ok) {

      throw new Error(
        (
          "Unable to retrieve authenticated user. " +
          `Status: ${response.status}`
        )
      );
    }


    const data =
      await response.json();


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      throw new Error(
        "No authenticated Entra ID user was returned."
      );
    }


    const identity =
      data[0];


    const claims =
      identity.user_claims || [];


    const getClaim =
      (...types) => {

        const claim =
          claims.find(
            (item) =>
              types.includes(
                item.typ
              )
          );


        return (
          claim?.val ||
          ""
        );
      };


    const name =
      getClaim(
        "name",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      ) ||
      identity.user_id ||
      "Authenticated User";


    const email =
      getClaim(
        "preferred_username",
        "email",
        "upn",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn"
      ) ||
      identity.user_id ||
      "";


    const id =
      getClaim(
        "oid",
        "http://schemas.microsoft.com/identity/claims/objectidentifier"
      ) ||
      identity.user_id ||
      "";


    const roles =
      claims
        .filter(
          (claim) =>
            claim.typ ===
              "roles" ||
            claim.typ ===
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        )
        .map(
          (claim) =>
            claim.val
        );


    return {
      id,
      name,
      email,
      roles,
      authenticationType:
        "entra",
    };


  } catch (error) {

    console.error(
      "Unable to load authenticated Entra user:",
      error
    );


    return null;
  }
}