import { useState } from "react";

function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask me anything about your business data...",
}) {
  const [question, setQuestion] = useState("");

  function submitQuestion(event) {
    event.preventDefault();

    const cleanQuestion = question.trim();

    if (!cleanQuestion || disabled) {
      return;
    }

    onSend(cleanQuestion);
    setQuestion("");
  }

  return (
    <form className="chat-input" onSubmit={submitQuestion}>
      <input
        type="text"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Business question"
      />

      <button type="submit" disabled={disabled || !question.trim()}>
        {disabled ? "Working..." : "Send"}
      </button>
    </form>
  );
}

export default ChatInput;