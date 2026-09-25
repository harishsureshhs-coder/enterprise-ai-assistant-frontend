import {
  Box,
  Divider,
  Paper,
  Typography,
} from "@mui/material";


// =========================================================
// FORMAT HELPERS
// =========================================================

function formatInrCompact(value) {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) {
    return "₹0";
  }

  if (Math.abs(n) >= 10000000) {
    return `₹${(n / 10000000).toFixed(2)}Cr`;
  }

  if (Math.abs(n) >= 100000) {
    return `₹${(n / 100000).toFixed(2)}L`;
  }

  if (Math.abs(n) >= 1000) {
    return `₹${(n / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(n);
}


function formatMillionCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "—";
  }

  return `₹${new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }
  ).format(n)} Mn`;
}


function formatPercentage(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return "—";
  }

  return `${new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }
  ).format(n)}%`;
}


function formatIncentive(value) {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) {
    return "₹0.00";
  }

  return `₹${new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(n)}`;
}


function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value || 0)
  );
}


function formatPeriod(period) {
  const year =
    Number(
      period?.year || 0
    );

  const month =
    Number(
      period?.month || 0
    );

  if (!year || !month) {
    return "";
  }

  const d =
    new Date(
      year,
      month - 1,
      1
    );

  return `${d.toLocaleString(
    "en-IN",
    {
      month: "short",
    }
  )} ${year} MTD`;
}


// =========================================================
// KPI
// =========================================================

function Kpi({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: 8.5,
          color: "text.secondary",
          lineHeight: 1.05,
          mb: 0.15,
        }}
      >
        {label}
      </Typography>

      <Typography
        title={String(value ?? "")}
        sx={{
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}


// =========================================================
// TOP PRODUCT / MATERIAL ROW
// =========================================================

function CompactRow({
  index,
  title,
  subtitle,
  tgs,
  qty,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "14px minmax(0,1fr) auto",
        gap: 0.4,
        py: 0.25,
        alignItems: "start",
      }}
    >
      <Typography
        sx={{
          fontSize: 9,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {index}.
      </Typography>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          title={title}
          sx={{
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>

        {subtitle ? (
          <Typography
            title={subtitle}
            sx={{
              fontSize: 7.5,
              color: "text.secondary",
              lineHeight: 1.05,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ textAlign: "right" }}>
        <Typography
          sx={{
            fontSize: 8.5,
            fontWeight: 700,
            lineHeight: 1.05,
            whiteSpace: "nowrap",
          }}
        >
          {formatInrCompact(tgs)}
        </Typography>

        <Typography
          sx={{
            fontSize: 7.5,
            color: "text.secondary",
            lineHeight: 1.05,
            whiteSpace: "nowrap",
          }}
        >
          Qty {formatNumber(qty)}
        </Typography>
      </Box>
    </Box>
  );
}


// =========================================================
// BUSINESS SNAPSHOT
// =========================================================

function BusinessSnapshot({
  snapshot,
}) {
  if (!snapshot) {
    return null;
  }

  const customer =
    snapshot.customer ||
    snapshot.customer_context ||
    {};

  const period =
    snapshot.period ||
    {};

  const kpis =
    snapshot.business_snapshot ||
    {};

  const productGroups =
    Array.isArray(
      snapshot.top_product_groups
    )
      ? snapshot.top_product_groups.slice(0, 3)
      : [];

  const materials =
    Array.isArray(
      snapshot.top_materials
    )
      ? snapshot.top_materials.slice(0, 3)
      : [];

  const customerName =
    customer.customer_name ||
    customer.bmd_name ||
    "";

  const customerCode =
    customer.customer_code ||
    customer.bmd_code ||
    "";

  const salesOffice =
    customer.sales_office_name ||
    customer.sales_office_code ||
    "";

  const region =
    customer.region_name ||
    customer.region_code ||
    "";

  const locationLine = [
    salesOffice,
    region,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2.5,
        overflow: "hidden",
        mb: 1.25,
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 0.6,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 800,
            lineHeight: 1.1,
            flexShrink: 0,
          }}
        >
          Business Snapshot
        </Typography>

        <Typography
          title={`${customerName} • ${customerCode}`}
          sx={{
            fontSize: 9.5,
            fontWeight: 700,
            lineHeight: 1.1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {customerName}
          {customerCode
            ? ` • ${customerCode}`
            : ""}
        </Typography>
      </Box>

      {/* SALES OFFICE + REGION ONLY */}
      {locationLine ? (
        <Typography
          title={locationLine}
          sx={{
            mt: 0.2,
            fontSize: 8,
            color: "text.secondary",
            lineHeight: 1.05,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {locationLine}
        </Typography>
      ) : null}

      {/* MONTH MTD ONLY - NO UPDATED DATE */}
      <Typography
        sx={{
          mt: 0.15,
          fontSize: 8,
          color: "text.secondary",
          lineHeight: 1.05,
        }}
      >
        {formatPeriod(period)}
      </Typography>

      {/* KPI GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          columnGap: 0.9,
          rowGap: 0.7,
          py: 0.8,
        }}
      >
        <Kpi
          label="TGS"
          value={
            formatMillionCurrency(
              kpis.total_tgs_mn
            )
          }
        />

        <Kpi
          label="Monthly Target"
          value={
            formatMillionCurrency(
              kpis.monthly_target_mn
            )
          }
        />

        <Kpi
          label="Achievement"
          value={
            formatPercentage(
              kpis.achievement_percentage
            )
          }
        />

        <Kpi
          label="Incentive"
          value={
            formatIncentive(
              kpis.total_incentive
            )
          }
        />

        <Kpi
          label="Qty"
          value={
            formatNumber(
              kpis.quantity_billed
            )
          }
        />

        <Kpi
          label="Materials"
          value={
            formatNumber(
              kpis.unique_materials_purchased
              ??
              kpis.material_count
            )
          }
        />
      </Box>

      <Divider />

      {/* TOP LISTS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
          gap: 1,
          pt: 0.65,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 9.5,
              fontWeight: 800,
              mb: 0.15,
              lineHeight: 1.05,
            }}
          >
            Top Product Groups
          </Typography>

          {productGroups.length
            ? productGroups.map(
                (item, index) => (
                  <CompactRow
                    key={`${item.product_group}-${index}`}
                    index={index + 1}
                    title={
                      item.product_group ||
                      "Unknown"
                    }
                    tgs={item.tgs}
                    qty={
                      item.quantity_billed
                    }
                  />
                )
              )
            : (
              <Typography
                sx={{
                  fontSize: 8,
                  color: "text.secondary",
                }}
              >
                No product-group data.
              </Typography>
            )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 9.5,
              fontWeight: 800,
              mb: 0.15,
              lineHeight: 1.05,
            }}
          >
            Top Materials
          </Typography>

          {materials.length
            ? materials.map(
                (item, index) => (
                  <CompactRow
                    key={`${item.material_number}-${index}`}
                    index={index + 1}
                    title={
                      item.material_number ||
                      "Unknown"
                    }
                    subtitle={
                      item.material_description ||
                      item.product_group ||
                      ""
                    }
                    tgs={item.tgs}
                    qty={
                      item.quantity_billed
                    }
                  />
                )
              )
            : (
              <Typography
                sx={{
                  fontSize: 8,
                  color: "text.secondary",
                }}
              >
                No material data.
              </Typography>
            )}
        </Box>
      </Box>
    </Paper>
  );
}


export default BusinessSnapshot;
