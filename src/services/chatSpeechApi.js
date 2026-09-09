import {
  API_URL,
} from "../config/apiConfig";


export async function transcribeChatAudio(
  audioBlob
) {
  if (!audioBlob) {
    throw new Error(
      "Audio is required."
    );
  }


  const formData =
    new FormData();


  formData.append(
    "audio",
    audioBlob,
    "chat-question.webm"
  );


  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {
        controller.abort();
      },
      60000
    );


  try {
    const response =
      await fetch(
        `${API_URL}/speech/transcribe`,
        {
          method: "POST",

          body:
            formData,

          signal:
            controller.signal,
        }
      );


    if (!response.ok) {
      const errorText =
        await response.text();


      throw new Error(
        errorText
        || (
          "Unable to transcribe "
          + "the voice question."
        )
      );
    }


    const data =
      await response.json();


    return String(
      data.transcript
      || data.text
      || ""
    ).trim();

  } finally {
    window.clearTimeout(
      timeoutId
    );
  }
}