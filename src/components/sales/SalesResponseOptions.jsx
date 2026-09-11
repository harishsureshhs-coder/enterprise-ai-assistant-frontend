function SalesResponseOptions({
  selectedMode,
  onSelect,
  disabled = false,
}) {
  const options = [
    {
      id: "podcast",
      icon: "🎧",
      title: "Customer Trend Podcast",
      description:
        "Listen to a customer performance briefing.",
    },
    {
      id: "voice",
      icon: "🔊",
      title: "Voice Summary",
      description:
        "Get the response as a short voice summary.",
    },
    {
      id: "text",
      icon: "📝",
      title: "Text Summary",
      description:
        "View the response as a concise text summary.",
    },
  ];

  return (
    <div className="sales-response-options">
      <div className="sales-options-header">
        <strong>
          How would you like the information?
        </strong>

        <span>
          Select a response format
        </span>
      </div>

      <div className="sales-options-grid">
        {options.map(
          (option) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                onSelect(option.id)
              }
              className={
                selectedMode ===
                option.id
                  ? "sales-option-card selected"
                  : "sales-option-card"
              }
            >
              <span className="sales-option-icon">
                {option.icon}
              </span>

              <span className="sales-option-content">
                <strong>
                  {option.title}
                </strong>

                <small>
                  {option.description}
                </small>
              </span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default SalesResponseOptions;