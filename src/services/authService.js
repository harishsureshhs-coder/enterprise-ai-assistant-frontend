const USER_STORAGE_KEY =
  "enterprise_ai_temporary_user";


function createTemporaryUser() {
  const uniqueId =
    crypto.randomUUID();

  return {
    id: `temporary-user-${uniqueId}`,
    name: "Guest User",
    email: "",
    authenticationType: "temporary",
  };
}


export function getCurrentUser() {
  try {
    const storedUser =
      localStorage.getItem(
        USER_STORAGE_KEY
      );

    if (storedUser) {
      const parsedUser =
        JSON.parse(storedUser);

      if (
        parsedUser?.id &&
        parsedUser?.name
      ) {
        return parsedUser;
      }
    }
  } catch (error) {
    console.error(
      "Unable to read the temporary user:",
      error
    );
  }

  const temporaryUser =
    createTemporaryUser();

  try {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(
        temporaryUser
      )
    );
  } catch (error) {
    console.error(
      "Unable to store the temporary user:",
      error
    );
  }

  return temporaryUser;
}