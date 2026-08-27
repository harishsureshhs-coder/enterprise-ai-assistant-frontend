// const API_URL =
//   import.meta.env.VITE_API_URL ||
//   "https://exesalesdev-fdfkfpb9fmabcadg.eastus-01.azurewebsites.net";

import {
  API_URL,
} from "../config/apiConfig";

const UPLOAD_TIMEOUT_MS =
  300000;


// =========================================================
// UPLOAD SALES RECORDING
//
// Browser Audio Blob
//      ↓
// multipart/form-data
//      ↓
// POST /sales/recordings
//
// Sends:
//
// audio_file
// conversation_id
// visit_id
// bmd_code
// customer_code   <-- temporary backward compatibility
//
// Backend returns:
//
// blob_name
// artifact_id
// visit_id
// =========================================================

export async function uploadSalesRecording({
  audioBlob,
  conversationId = null,
  visitId = null,
  bmdCode = null,
}) {

  // =====================================================
  // VALIDATE AUDIO
  // =====================================================

  if (
    !audioBlob ||
    !(audioBlob instanceof Blob)
  ) {

    throw new Error(
      "A valid audio recording is required."
    );
  }


  if (
    audioBlob.size === 0
  ) {

    throw new Error(
      "The recorded audio is empty."
    );
  }


  // =====================================================
  // VALIDATE VISIT
  //
  // Every Sales recording must now belong
  // to an active customer visit.
  // =====================================================

  const cleanVisitId =
    String(
      visitId || ""
    ).trim();


  if (!cleanVisitId) {

    throw new Error(
      "A Sales visit must be started before uploading a recording."
    );
  }


  // =====================================================
  // VALIDATE PRIMARY CUSTOMER
  // =====================================================

  const cleanBmdCode =
    String(
      bmdCode || ""
    ).trim();


  if (!cleanBmdCode) {

    throw new Error(
      "A primary customer must be selected before uploading a recording."
    );
  }


  // =====================================================
  // TIMEOUT
  // =====================================================

  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {

        controller.abort();

      },
      UPLOAD_TIMEOUT_MS
    );


  try {

    // ===================================================
    // FORM DATA
    // ===================================================

    const formData =
      new FormData();


    // ===================================================
    // DETERMINE FILE EXTENSION
    // ===================================================

    const extension =
      getAudioFileExtension(
        audioBlob.type
      );


    const fileName =
      (
        "sales-recording-" +
        `${Date.now()}.` +
        extension
      );


    // ===================================================
    // AUDIO FILE
    //
    // Must match FastAPI:
    //
    // audio_file: UploadFile = File(...)
    // ===================================================

    formData.append(
      "audio_file",
      audioBlob,
      fileName
    );


    // ===================================================
    // VISIT ID
    //
    // ai_app.sales_visit.visit_id
    // ===================================================

    formData.append(
      "visit_id",
      cleanVisitId
    );


    // ===================================================
    // PRIMARY CUSTOMER / BMD CODE
    // ===================================================

    formData.append(
      "bmd_code",
      cleanBmdCode
    );


    // ===================================================
    // CONVERSATION ID
    //
    // This can be null because salesperson may:
    //
    // Select Customer
    // → Start Visit
    // → Record
    //
    // before typing any chat question.
    // ===================================================

    if (
      conversationId &&
      conversationId !== "null"
    ) {

      formData.append(
        "conversation_id",
        String(
          conversationId
        )
      );
    }


    // ===================================================
    // TEMPORARY BACKWARD COMPATIBILITY
    //
    // Your older backend used:
    //
    // customer_code
    //
    // We now use BMDCode as the primary customer key.
    //
    // Keep this temporarily while the backend transition
    // is completed.
    // ===================================================

    formData.append(
      "customer_code",
      cleanBmdCode
    );


    // ===================================================
    // DEBUG
    // ===================================================

    console.log(
      "Uploading Sales recording:",
      {
        fileName,

        size:
          audioBlob.size,

        type:
          audioBlob.type,

        conversationId,

        visitId:
          cleanVisitId,

        bmdCode:
          cleanBmdCode,
      }
    );


    // ===================================================
    // CALL FASTAPI
    //
    // IMPORTANT:
    //
    // DO NOT manually set:
    //
    // Content-Type: multipart/form-data
    //
    // Browser automatically generates the multipart
    // boundary.
    // ===================================================

    const response =
      await fetch(
        `${API_URL}/sales/recordings`,
        {
          method:
            "POST",

          body:
            formData,

          signal:
            controller.signal,
        }
      );


    // ===================================================
    // READ RESPONSE
    // ===================================================

    let result =
      null;


    try {

      result =
        await response.json();


    } catch {

      throw new Error(
        "Recording upload returned an invalid response."
      );
    }


    // ===================================================
    // API ERROR
    // ===================================================

    if (!response.ok) {

      throw new Error(
        result?.detail ||
        result?.message ||
        (
          "Recording upload failed. " +
          `Status: ${response.status}`
        )
      );
    }


    // ===================================================
    // VALIDATE IMPORTANT RESPONSE VALUES
    // ===================================================

    if (
      !result?.blob_name
    ) {

      throw new Error(
        "Recording was uploaded but Blob name was not returned."
      );
    }


    if (
      !result?.artifact_id
    ) {

      throw new Error(
        "Recording was uploaded but artifact ID was not returned."
      );
    }


    console.log(
      "Sales recording uploaded:",
      {
        ...result,

        visitId:
          cleanVisitId,

        bmdCode:
          cleanBmdCode,
      }
    );


    return result;


  } catch (error) {

    // ===================================================
    // TIMEOUT
    // ===================================================

    if (
      error?.name ===
      "AbortError"
    ) {

      throw new Error(
        "Recording upload took too long."
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
// TRANSCRIBE SAVED SALES RECORDING
//
// blob_name
// artifact_id
// visit_id
//       ↓
// POST /sales/recordings/transcribe
//       ↓
// Validate artifact / visit
//       ↓
// Azure Speech
//       ↓
// ai_app.transcript
//
// Backend returns:
//
// transcript
// transcript_id
// artifact_id
// visit_id
// =========================================================

export async function transcribeSalesRecording({
  blobName,
  artifactId,
  visitId,
  locale = "en-IN",
}) {

  // =====================================================
  // BLOB NAME
  // =====================================================

  const cleanBlobName =
    String(
      blobName || ""
    ).trim();


  if (!cleanBlobName) {

    throw new Error(
      "Recording Blob name is required."
    );
  }


  // =====================================================
  // ARTIFACT ID
  // =====================================================

  const cleanArtifactId =
    String(
      artifactId || ""
    ).trim();


  if (!cleanArtifactId) {

    throw new Error(
      "Recording artifact ID is required."
    );
  }


  // =====================================================
  // VISIT ID
  // =====================================================

  const cleanVisitId =
    String(
      visitId || ""
    ).trim();


  if (!cleanVisitId) {

    throw new Error(
      "Sales visit ID is required."
    );
  }


  // =====================================================
  // LOCALE
  // =====================================================

  const cleanLocale =
    String(
      locale || "en-IN"
    ).trim();


  console.log(
    "Starting Sales transcription:",
    {
      blobName:
        cleanBlobName,

      artifactId:
        cleanArtifactId,

      visitId:
        cleanVisitId,

      locale:
        cleanLocale,
    }
  );


  // =====================================================
  // CALL FASTAPI
  // =====================================================

  const response =
    await fetch(
      `${API_URL}/sales/recordings/transcribe`,
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
            blob_name:
              cleanBlobName,

            artifact_id:
              cleanArtifactId,

            visit_id:
              cleanVisitId,

            locale:
              cleanLocale,
          }),
      }
    );


  // =====================================================
  // READ RESPONSE
  // =====================================================

  let result =
    null;


  try {

    result =
      await response.json();


  } catch {

    throw new Error(
      "Transcription service returned an invalid response."
    );
  }


  // =====================================================
  // API ERROR
  // =====================================================

  if (!response.ok) {

    throw new Error(
      result?.detail ||
      result?.message ||
      (
        "Unable to transcribe recording. " +
        `Status: ${response.status}`
      )
    );
  }


  // =====================================================
  // VALIDATE TRANSCRIPT
  // =====================================================

  const transcript =
    String(
      result?.transcript || ""
    ).trim();


  if (!transcript) {

    throw new Error(
      "Transcription completed but no transcript text was returned."
    );
  }


  console.log(
    "Sales transcription completed:",
    {
      transcriptLength:
        transcript.length,

      transcriptId:
        result?.transcript_id,

      artifactId:
        result?.artifact_id,

      visitId:
        result?.visit_id,

      status:
        result?.status,
    }
  );


  return result;
}


// =========================================================
// SUMMARIZE SALES TRANSCRIPT
//
// transcript
//      ↓
// POST /sales/recordings/summarize
//      ↓
// Azure OpenAI
//      ↓
// Four concise conversation highlights
//
// NOTE:
//
// We are intentionally leaving this API separate from
// transcription.
//
// Later we can persist the generated highlights into
// ai_app.insight.
// =========================================================

export async function summarizeSalesTranscript({
  transcript,
}) {

  // =====================================================
  // VALIDATE TRANSCRIPT
  // =====================================================

  const cleanTranscript =
    String(
      transcript || ""
    ).trim();


  if (!cleanTranscript) {

    throw new Error(
      "Transcript is required for summary generation."
    );
  }


  console.log(
    "Starting Sales summary:",
    {
      transcriptLength:
        cleanTranscript.length,
    }
  );


  // =====================================================
  // CALL FASTAPI
  // =====================================================

  const response =
    await fetch(
      `${API_URL}/sales/recordings/summarize`,
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
            transcript:
              cleanTranscript,
          }),
      }
    );


  // =====================================================
  // READ RESPONSE
  // =====================================================

  let result =
    null;


  try {

    result =
      await response.json();


  } catch {

    throw new Error(
      "Summary service returned an invalid response."
    );
  }


  // =====================================================
  // API ERROR
  // =====================================================

  if (!response.ok) {

    throw new Error(
      result?.detail ||
      result?.message ||
      (
        "Unable to generate conversation summary. " +
        `Status: ${response.status}`
      )
    );
  }


  // =====================================================
  // HIGHLIGHTS
  // =====================================================

  const highlights =
    Array.isArray(
      result?.highlights
    )
      ? result.highlights
      : [];


  console.log(
    "Sales summary completed:",
    {
      status:
        result?.status,

      highlightCount:
        highlights.length,
    }
  );


  return result;
}


// =========================================================
// AUDIO FILE EXTENSION
//
// Browser MediaRecorder may return:
//
// audio/webm
// video/webm
// audio/ogg
// audio/wav
// audio/mpeg
// audio/mp4
//
// We use this only to create a reasonable filename.
// =========================================================

function getAudioFileExtension(
  mimeType
) {

  const type =
    String(
      mimeType || ""
    ).toLowerCase();


  // =====================================================
  // OGG
  // =====================================================

  if (
    type.includes(
      "ogg"
    )
  ) {

    return "ogg";
  }


  // =====================================================
  // WAV
  // =====================================================

  if (
    type.includes(
      "wav"
    )
  ) {

    return "wav";
  }


  // =====================================================
  // MPEG / MP3
  // =====================================================

  if (
    type.includes(
      "mpeg"
    )
  ) {

    return "mp3";
  }


  // =====================================================
  // MP4 / M4A
  // =====================================================

  if (
    type.includes(
      "mp4"
    )
  ) {

    return "m4a";
  }


  // =====================================================
  // DEFAULT BROWSER RECORDING FORMAT
  // =====================================================

  return "webm";
}