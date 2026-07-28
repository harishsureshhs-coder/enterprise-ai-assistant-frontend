export function isMonetaryColumn(columnName) {
  const normalizedColumn =
    String(columnName)
      .toLowerCase()
      .replaceAll("_", "");

  const monetaryTerms = [
    "tns",
    "tgs",
    "revenue",
    "sales",
    "amount",
    "value",
    "cost",
    "margin",
    "budget",
    "target",
    "actual",
    "variance",
    "turnover",
  ];

  return monetaryTerms.some((term) =>
    normalizedColumn.includes(term)
  );
}


export function formatInrMillions(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  const valueInMillions =
    numericValue / 1_000_000;

  return `₹${valueInMillions.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} Mn`;
}


export function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return numericValue.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  );
}