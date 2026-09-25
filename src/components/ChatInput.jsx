import {
  useEffect,
  useRef,
  useState,
} from "react";

import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";


function ChatInput({
  onSend,

  // New:
  // Function supplied by parent.
  //
  // audioBlob
  //    ↓
  // backend
  //    ↓
  // Azure Speech
  //    ↓
  // return transcript text
  //
  onTranscribeAudio,

  disabled = false,

  placeholder =
    "Ask me anything about your business data...",
}) {
  const [
    question,
    setQuestion,
  ] = useState("");


  const [
    isRecording,
    setIsRecording,
  ] = useState(false);


  const [
    isTranscribing,
    setIsTranscribing,
  ] = useState(false);


  const [
    microphoneError,
    setMicrophoneError,
  ] = useState("");


  const mediaRecorderRef =
    useRef(null);


  const mediaStreamRef =
    useRef(null);


  const audioChunksRef =
    useRef([]);


  // =====================================================
  // STOP MEDIA STREAM
  // =====================================================

  function releaseMicrophone() {
    const stream =
      mediaStreamRef.current;


    if (stream) {
      stream
        .getTracks()
        .forEach(
          (track) => {
            try {
              track.stop();
            } catch {
              // Ignore cleanup error.
            }
          }
        );
    }


    mediaStreamRef.current =
      null;
  }


  // =====================================================
  // CLEAN UP IF COMPONENT UNMOUNTS
  // =====================================================

  useEffect(() => {
    return () => {
      try {
        const recorder =
          mediaRecorderRef.current;


        if (
          recorder
          && recorder.state !== "inactive"
        ) {
          recorder.stop();
        }
      } catch {
        // Ignore cleanup error.
      }


      releaseMicrophone();
    };
  }, []);


  // =====================================================
  // SUBMIT QUESTION
  // =====================================================

  function submitQuestion(
    event
  ) {
    event.preventDefault();


    const cleanQuestion =
      question.trim();


    if (
      !cleanQuestion
      || disabled
      || isRecording
      || isTranscribing
    ) {
      return;
    }


    onSend(
      cleanQuestion
    );


    setQuestion("");
  }


  // =====================================================
  // TRANSCRIBE RECORDED AUDIO
  // =====================================================

  async function transcribeAudio(
    audioBlob
  ) {
    if (
      typeof onTranscribeAudio
      !== "function"
    ) {
      setMicrophoneError(
        "Voice transcription is not configured."
      );

      return;
    }


    try {
      setIsTranscribing(
        true
      );


      setMicrophoneError(
        ""
      );


      const transcript =
        await onTranscribeAudio(
          audioBlob
        );


      const cleanTranscript =
        String(
          transcript
          || ""
        ).trim();


      if (!cleanTranscript) {
        setMicrophoneError(
          "No speech was detected. Please try again."
        );

        return;
      }


      // ===============================================
      // IMPORTANT
      //
      // Do NOT automatically send.
      //
      // Put the recognized question in the textbox so
      // the salesperson can review/edit it first.
      // ===============================================

      setQuestion(
        cleanTranscript
      );

    } catch (error) {
      console.error(
        "Chat voice transcription failed:",
        error
      );


      setMicrophoneError(
        "Unable to transcribe your question."
      );

    } finally {
      setIsTranscribing(
        false
      );
    }
  }


  // =====================================================
  // START CHAT MICROPHONE
  //
  // This is NOT Visit Recording.
  //
  // No visit_id
  // No Blob persistence
  // No visit insight generation
  // No customer-conversation consent workflow
  // =====================================================

  async function startRecording() {
    if (
      disabled
      || isRecording
      || isTranscribing
    ) {
      return;
    }


    setMicrophoneError(
      ""
    );


    try {
      if (
        !navigator.mediaDevices
        || !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Browser microphone API is not available."
        );
      }


      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );


      mediaStreamRef.current =
        stream;


      audioChunksRef.current =
        [];


      // ===============================================
      // PICK SUPPORTED FORMAT
      // ===============================================

      let options = undefined;


      if (
        window.MediaRecorder
        && MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        options = {
          mimeType:
            "audio/webm;codecs=opus",
        };
      }


      const recorder =
        new MediaRecorder(
          stream,
          options
        );


      mediaRecorderRef.current =
        recorder;


      // ===============================================
      // AUDIO CHUNKS
      // ===============================================

      recorder.ondataavailable = (
        event
      ) => {
        if (
          event.data
          && event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };


      // ===============================================
      // RECORDING COMPLETE
      // ===============================================

      recorder.onstop =
        async () => {
          try {
            const chunks =
              audioChunksRef.current;


            if (
              !chunks
              || chunks.length === 0
            ) {
              setMicrophoneError(
                "No audio was captured."
              );

              return;
            }


            const mimeType =
              recorder.mimeType
              || "audio/webm";


            const audioBlob =
              new Blob(
                chunks,
                {
                  type:
                    mimeType,
                }
              );


            if (
              audioBlob.size === 0
            ) {
              setMicrophoneError(
                "No audio was captured."
              );

              return;
            }


            // ===========================================
            // Send temporary audio to transcription.
            //
            // Audio is not added to visit recording.
            // ===========================================

            await transcribeAudio(
              audioBlob
            );

          } finally {
            audioChunksRef.current =
              [];


            mediaRecorderRef.current =
              null;


            releaseMicrophone();
          }
        };


      recorder.onerror =
        (event) => {
          console.error(
            "Chat microphone recording error:",
            event
          );


          setMicrophoneError(
            "Microphone recording failed."
          );


          setIsRecording(
            false
          );


          releaseMicrophone();
        };


      recorder.start();


      setIsRecording(
        true
      );

    } catch (error) {
      console.error(
        "Unable to access microphone:",
        error
      );


      setMicrophoneError(
        "Microphone access was not available."
      );


      setIsRecording(
        false
      );


      releaseMicrophone();
    }
  }


  // =====================================================
  // STOP CHAT MICROPHONE
  // =====================================================

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;


    if (
      !recorder
      || recorder.state === "inactive"
    ) {
      setIsRecording(
        false
      );

      releaseMicrophone();

      return;
    }


    try {
      recorder.stop();

    } catch (error) {
      console.error(
        "Unable to stop microphone:",
        error
      );


      releaseMicrophone();
    }


    setIsRecording(
      false
    );
  }


  // =====================================================
  // MIC CLICK
  // =====================================================

  function handleMicClick() {
    if (isRecording) {
      stopRecording();
      return;
    }


    startRecording();
  }


  // =====================================================
  // UI
  // =====================================================

  return (
    <div>
      <form
        className="chat-input"
        onSubmit={
          submitQuestion
        }
      >
        <input
          type="text"

          value={
            question
          }

          onChange={
            (event) => {
              setQuestion(
                event.target.value
              );


              if (
                microphoneError
              ) {
                setMicrophoneError(
                  ""
                );
              }
            }
          }

          placeholder={
            isRecording
              ? "Listening..."
              : isTranscribing
              ? "Transcribing..."
              : placeholder
          }

          disabled={
            disabled
            || isTranscribing
          }

          aria-label=
            "Business question"
        />


        {/* ========================================== */}
        {/* CHAT MICROPHONE */}
        {/* ========================================== */}

        <button
          type="button"

          className={
            isRecording
              ? "chat-mic-button recording"
              : "chat-mic-button"
          }

          onClick={
            handleMicClick
          }

          disabled={
            disabled
            || isTranscribing
          }

          aria-label={
            isRecording
              ? "Stop voice input"
              : "Speak your question"
          }

          title={
            isRecording
              ? "Stop listening"
              : "Speak your question"
          }
        >
          {
            isRecording
              ? (
                <StopCircleOutlinedIcon
                  fontSize="small"
                />
              )
              : (
                <MicNoneOutlinedIcon
                  fontSize="small"
                />
              )
          }
        </button>


        {/* ========================================== */}
        {/* SEND */}
        {/* ========================================== */}

        <button
          type="submit"

          disabled={
            disabled
            || isRecording
            || isTranscribing
            || !question.trim()
          }
        >
          {
            disabled
              ? "Working..."
              : isTranscribing
              ? "Transcribing..."
              : "Send"
          }
        </button>
      </form>


      {/* ============================================ */}
      {/* SMALL MIC STATUS */}
      {/* ============================================ */}

      {
        isRecording
          ? (
            <div
              className="chat-mic-status"
            >
              Listening… click the mic again to stop.
            </div>
          )
          : null
      }


      {
        microphoneError
          ? (
            <div
              className="chat-mic-error"
            >
              {microphoneError}
            </div>
          )
          : null
      }
    </div>
  );
}


export default ChatInput;