import {
  useEffect,
  useRef,
  useState,
} from "react";


function SalesRecordingPanel({

  disabled = false,

  onRecordingReady,

  onSaveRecording,

  isSaving = false,

  isSaved = false,

}) {

  // =====================================================
  // REFERENCES
  // =====================================================

  const mediaRecorderRef =
    useRef(null);


  const mediaStreamRef =
    useRef(null);


  const chunksRef =
    useRef([]);


  const timerRef =
    useRef(null);


  const recordingStartedAtRef =
    useRef(null);


  const isStartingRef =
    useRef(false);


  const audioUrlRef =
    useRef(null);


  // =====================================================
  // STATE
  // =====================================================

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);


  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);


  const [
    audioUrl,
    setAudioUrl,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState(null);


  // =====================================================
  // STOP TIMER
  // =====================================================

  function stopTimer() {

    if (
      timerRef.current !== null
    ) {

      window.clearInterval(
        timerRef.current
      );


      timerRef.current =
        null;
    }


    recordingStartedAtRef.current =
      null;
  }


  // =====================================================
  // START TIMER
  // =====================================================

  function startTimer() {

    stopTimer();


    recordingStartedAtRef.current =
      Date.now();


    setRecordingSeconds(
      0
    );


    timerRef.current =
      window.setInterval(
        () => {

          if (
            !recordingStartedAtRef.current
          ) {
            return;
          }


          const elapsedMilliseconds =
            Date.now() -
            recordingStartedAtRef.current;


          const elapsedSeconds =
            Math.floor(
              elapsedMilliseconds /
              1000
            );


          setRecordingSeconds(
            elapsedSeconds
          );

        },
        250
      );
  }


  // =====================================================
  // STOP MICROPHONE STREAM
  // =====================================================

  function stopMediaStream() {

    const stream =
      mediaStreamRef.current;


    if (!stream) {
      return;
    }


    stream
      .getTracks()
      .forEach(
        (track) => {

          if (
            track.readyState ===
            "live"
          ) {

            track.stop();
          }
        }
      );


    mediaStreamRef.current =
      null;
  }


  // =====================================================
  // REMOVE LOCAL PLAYBACK URL
  // =====================================================

  function removeAudioUrl() {

    if (
      audioUrlRef.current
    ) {

      URL.revokeObjectURL(
        audioUrlRef.current
      );


      audioUrlRef.current =
        null;
    }


    setAudioUrl(
      null
    );
  }


  // =====================================================
  // RESET RECORDER UI AFTER SUCCESSFUL SAVE
  //
  // IMPORTANT:
  //
  // We intentionally do NOT call:
  //
  // onRecordingReady(null)
  //
  // because that would clear transcript and summary
  // in SalesApp.
  //
  // This only clears the temporary browser recording.
  // =====================================================

  useEffect(
    () => {

      if (
        !isSaved ||
        isRecording
      ) {
        return;
      }


      if (
        audioUrlRef.current
      ) {

        URL.revokeObjectURL(
          audioUrlRef.current
        );


        audioUrlRef.current =
          null;
      }


      setAudioUrl(
        null
      );


      setRecordingSeconds(
        0
      );


      setError(
        null
      );


      chunksRef.current =
        [];

    },
    [
      isSaved,
      isRecording,
    ]
  );


  // =====================================================
  // START RECORDING
  // =====================================================

  async function startRecording() {

    if (
      disabled ||
      isRecording ||
      isStartingRef.current
    ) {

      return;
    }


    isStartingRef.current =
      true;


    setError(
      null
    );


    // ===================================================
    // BROWSER SUPPORT CHECKS
    // ===================================================

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices
        .getUserMedia
    ) {

      setError(
        "Microphone recording is not supported by this browser."
      );


      isStartingRef.current =
        false;


      return;
    }


    if (
      !window.MediaRecorder
    ) {

      setError(
        "MediaRecorder is not supported by this browser."
      );


      isStartingRef.current =
        false;


      return;
    }


    try {

      // =================================================
      // NEW CONVERSATION STARTING
      //
      // Clear previous transcript / summary through
      // the parent.
      // =================================================

      if (
        typeof onRecordingReady ===
        "function"
      ) {

        onRecordingReady(
          null
        );
      }


      // =================================================
      // REMOVE PREVIOUS LOCAL RECORDING
      // =================================================

      removeAudioUrl();


      chunksRef.current =
        [];


      setRecordingSeconds(
        0
      );


      // =================================================
      // REQUEST MICROPHONE
      // =================================================

      const stream =
        await navigator.mediaDevices
          .getUserMedia({

            audio: {

              echoCancellation:
                true,

              noiseSuppression:
                true,

              autoGainControl:
                true,
            },
          });


      mediaStreamRef.current =
        stream;


      // =================================================
      // CREATE MEDIA RECORDER
      //
      // Browser chooses the supported codec.
      // =================================================

      const recorder =
        new MediaRecorder(
          stream
        );


      mediaRecorderRef.current =
        recorder;


      console.log(
        "Sales MediaRecorder type:",
        recorder.mimeType
      );


      // =================================================
      // AUDIO DATA
      // =================================================

      recorder.ondataavailable =
        (event) => {

          if (
            event.data &&
            event.data.size > 0
          ) {

            chunksRef.current.push(
              event.data
            );
          }
        };


      // =================================================
      // RECORDING STOPPED
      // =================================================

      recorder.onstop =
        () => {

          stopTimer();


          try {

            if (
              chunksRef.current.length ===
              0
            ) {

              throw new Error(
                "No audio data was captured."
              );
            }


            const mimeType =
              recorder.mimeType ||
              chunksRef.current[0]
                ?.type ||
              "audio/webm";


            const audioBlob =
              new Blob(
                chunksRef.current,
                {
                  type:
                    mimeType,
                }
              );


            if (
              audioBlob.size === 0
            ) {

              throw new Error(
                "The recorded audio file is empty."
              );
            }


            console.log(
              "Sales recording completed:",
              {
                size:
                  audioBlob.size,

                type:
                  audioBlob.type,

                chunks:
                  chunksRef.current
                    .length,
              }
            );


            // ===========================================
            // LOCAL PLAYBACK URL
            // ===========================================

            const newAudioUrl =
              URL.createObjectURL(
                audioBlob
              );


            audioUrlRef.current =
              newAudioUrl;


            setAudioUrl(
              newAudioUrl
            );


            // ===========================================
            // SEND AUDIO BLOB TO SALES APP
            // ===========================================

            if (
              typeof onRecordingReady ===
              "function"
            ) {

              onRecordingReady(
                audioBlob
              );
            }


          } catch (recordingError) {

            console.error(
              "Unable to prepare Sales recording:",
              recordingError
            );


            setError(
              recordingError instanceof Error
                ? recordingError.message
                : "Unable to prepare recorded audio."
            );


          } finally {

            chunksRef.current =
              [];


            mediaRecorderRef.current =
              null;


            stopMediaStream();


            setIsRecording(
              false
            );


            isStartingRef.current =
              false;
          }
        };


      // =================================================
      // RECORDER ERROR
      // =================================================

      recorder.onerror =
        (event) => {

          console.error(
            "Sales MediaRecorder error:",
            event
          );


          stopTimer();


          stopMediaStream();


          chunksRef.current =
            [];


          mediaRecorderRef.current =
            null;


          setIsRecording(
            false
          );


          isStartingRef.current =
            false;


          setError(
            "An error occurred while recording audio."
          );
        };


      // =================================================
      // START
      // =================================================

      recorder.start();


      setIsRecording(
        true
      );


      startTimer();


      isStartingRef.current =
        false;


    } catch (recordingError) {

      console.error(
        "Unable to start Sales recording:",
        recordingError
      );


      stopTimer();


      stopMediaStream();


      mediaRecorderRef.current =
        null;


      chunksRef.current =
        [];


      setIsRecording(
        false
      );


      isStartingRef.current =
        false;


      if (
        recordingError?.name ===
        "NotAllowedError"
      ) {

        setError(
          "Microphone permission was denied."
        );


      } else if (
        recordingError?.name ===
        "NotFoundError"
      ) {

        setError(
          "No microphone was found."
        );


      } else {

        setError(
          recordingError instanceof Error
            ? recordingError.message
            : "Unable to access the microphone."
        );
      }
    }
  }


  // =====================================================
  // STOP RECORDING
  // =====================================================

  function stopRecording() {

    const recorder =
      mediaRecorderRef.current;


    stopTimer();


    setIsRecording(
      false
    );


    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {

      stopMediaStream();

      return;
    }


    console.log(
      "Stopping Sales recording..."
    );


    /*
     * Do not stop microphone tracks first.
     *
     * recorder.stop()
     *       ↓
     * final ondataavailable
     *       ↓
     * onstop
     *       ↓
     * stopMediaStream()
     */

    recorder.stop();
  }


  // =====================================================
  // DELETE UNSAVED RECORDING
  // =====================================================

  function clearRecording() {

    if (
      isRecording ||
      isSaving
    ) {

      return;
    }


    stopTimer();


    removeAudioUrl();


    setRecordingSeconds(
      0
    );


    setError(
      null
    );


    chunksRef.current =
      [];


    if (
      typeof onRecordingReady ===
      "function"
    ) {

      onRecordingReady(
        null
      );
    }
  }


  // =====================================================
  // SAVE
  // =====================================================

  function handleSave() {

    if (
      !audioUrl ||
      isSaving ||
      isSaved
    ) {

      return;
    }


    if (
      typeof onSaveRecording ===
      "function"
    ) {

      onSaveRecording();
    }
  }


  // =====================================================
  // FORMAT TIME
  // =====================================================

  function formatTime(
    totalSeconds
  ) {

    const safeSeconds =
      Number.isFinite(
        totalSeconds
      )
        ? totalSeconds
        : 0;


    const minutes =
      Math.floor(
        safeSeconds /
        60
      );


    const seconds =
      Math.floor(
        safeSeconds %
        60
      );


    return (
      `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:` +
      `${String(
        seconds
      ).padStart(
        2,
        "0"
      )}`
    );
  }


  // =====================================================
  // CLEANUP WHEN COMPONENT UNMOUNTS
  // =====================================================

  useEffect(
    () => {

      return () => {

        stopTimer();


        const recorder =
          mediaRecorderRef.current;


        if (
          recorder &&
          recorder.state !==
            "inactive"
        ) {

          try {

            recorder.stop();

          } catch (
            cleanupError
          ) {

            console.warn(
              "Sales recorder cleanup:",
              cleanupError
            );
          }
        }


        stopMediaStream();


        if (
          audioUrlRef.current
        ) {

          URL.revokeObjectURL(
            audioUrlRef.current
          );


          audioUrlRef.current =
            null;
        }
      };

    },
    []
  );


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className=
        "sales-recording-panel"
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <div
        className=
          "sales-recording-header"
      >

        <div>

          <strong>
            Customer Conversation
          </strong>


          <div
            className=
              "sales-recording-subtitle"
          >

            Record the customer discussion
            for transcription and analysis.

          </div>

        </div>


        {isRecording && (

          <div
            className=
              "sales-recording-status"
          >

            🔴 Recording&nbsp;

            {formatTime(
              recordingSeconds
            )}

          </div>

        )}

      </div>


      {/* =================================================
          ACTION BUTTONS
          ================================================= */}

      <div
        className=
          "sales-recording-actions"
      >

        {/* -----------------------------------------------
            READY FOR NEW RECORDING
            ----------------------------------------------- */}

        {!isRecording &&
          !audioUrl && (

            <button

              type="button"

              onClick={
                startRecording
              }

              disabled={
                disabled
              }

              className=
                "sales-record-button"

            >

              ⏺ Record New Conversation

            </button>

          )}


        {/* -----------------------------------------------
            RECORDING ACTIVE
            ----------------------------------------------- */}

        {isRecording && (

          <button

            type="button"

            onClick={
              stopRecording
            }

            className=
              "sales-stop-button"

          >

            ⏹ Stop Recording

          </button>

        )}


        {/* -----------------------------------------------
            RECORDING COMPLETED BUT NOT YET RESET
            ----------------------------------------------- */}

        {audioUrl &&
          !isRecording && (

            <>

              <button

                type="button"

                onClick={
                  handleSave
                }

                disabled={
                  isSaving ||
                  isSaved ||
                  !onSaveRecording
                }

                className=
                  "sales-record-button"

              >

                {isSaving
                  ? "Saving..."
                  : (
                      isSaved
                        ? "✓ Saved"
                        : "Save Recording"
                    )
                }

              </button>


              {!isSaved && (

                <button

                  type="button"

                  onClick={
                    clearRecording
                  }

                  disabled={
                    isSaving
                  }

                  className=
                    "sales-clear-button"

                >

                  Delete Recording

                </button>

              )}

            </>

          )}

      </div>


      {/* =================================================
          PLAYBACK
          ================================================= */}

      {audioUrl &&
        !isRecording && (

          <div
            className=
              "sales-recording-preview"
          >

            <div>

              <strong>
                Recording completed
              </strong>


              <div>

                Duration:&nbsp;

                {formatTime(
                  recordingSeconds
                )}

              </div>

            </div>


            <audio

              key={
                audioUrl
              }

              controls

              preload=
                "metadata"

              src={
                audioUrl
              }

            />

          </div>

        )}


      {/* =================================================
          RECORDING ERROR
          ================================================= */}

      {error && (

        <div
          className=
            "sales-recording-error"
        >

          {error}

        </div>

      )}

    </div>
  );
}


export default SalesRecordingPanel;