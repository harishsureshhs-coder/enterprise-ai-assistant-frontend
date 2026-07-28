function SuggestedQuestions({
  questions = [],
  onSelect,
  disabled = false,
}) {
  return (
    <div className="suggestion-section">
      <div className="suggestion-header">
        <span>Suggested questions</span>
        <small>Select a question to get started</small>
      </div>

      <div className="suggested-questions">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SuggestedQuestions;