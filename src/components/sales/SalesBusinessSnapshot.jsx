import {
  Box,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

function formatInrCompact(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "₹0";
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPeriod(period) {
  const year = Number(period?.year || 0);
  const month = Number(period?.month || 0);
  if (!year || !month) return "";
  const d = new Date(year, month - 1, 1);
  return `${d.toLocaleString("en-IN", { month: "long" })} ${year} MTD`;
}

function formatUpdatedThrough(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Kpi({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.1 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 800, lineHeight: 1.15, mt: 0.25, whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  );
}

function CompactRow({ index, title, subtitle, tgs, qty }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "16px minmax(0,1fr) auto", gap: 0.5, py: 0.35, alignItems: "start" }}>
      <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{index}.</Typography>
      <Box sx={{ minWidth: 0 }}>
        <Typography title={title} sx={{ fontSize: 10, fontWeight: 700, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography title={subtitle} sx={{ fontSize: 8.5, color: "text.secondary", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Typography sx={{ fontSize: 9.5, fontWeight: 700, lineHeight: 1.1, whiteSpace: "nowrap" }}>
          {formatInrCompact(tgs)}
        </Typography>
        <Typography sx={{ fontSize: 8.5, color: "text.secondary", lineHeight: 1.1, whiteSpace: "nowrap" }}>
          Qty {formatNumber(qty)}
        </Typography>
      </Box>
    </Box>
  );
}

function BusinessSnapshot({ snapshot }) {
  if (!snapshot) return null;

  const customer = snapshot.customer || snapshot.customer_context || {};
  const period = snapshot.period || {};
  const kpis = snapshot.business_snapshot || {};
  const productGroups = Array.isArray(snapshot.top_product_groups)
    ? snapshot.top_product_groups.slice(0, 3)
    : [];
  const materials = Array.isArray(snapshot.top_materials)
    ? snapshot.top_materials.slice(0, 3)
    : [];

  const customerLine = [
    customer.customer_name || customer.bmd_name,
    customer.customer_code || customer.bmd_code,
  ].filter(Boolean).join(" • ");

  const ownerLine = [
    customer.sales_employee,
    customer.sales_office_name || customer.sales_office_code,
    customer.region_name || customer.region_code,
  ].filter(Boolean).join(" • ");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.15 }}>
        Business Snapshot
      </Typography>

      <Typography title={customerLine} sx={{ mt: 0.3, fontSize: 10.5, fontWeight: 700, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {customerLine}
      </Typography>

      <Typography title={ownerLine} sx={{ mt: 0.2, fontSize: 9.5, color: "text.secondary", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {ownerLine}
      </Typography>

      <Typography sx={{ mt: 0.3, fontSize: 9, color: "text.secondary", lineHeight: 1.1 }}>
        {formatPeriod(period)}
        {period.latest_posting_date ? ` • Updated through ${formatUpdatedThrough(period.latest_posting_date)}` : ""}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 0.9, py: 0.9 }}>
        <Kpi label="TGS" value={formatInrCompact(kpis.total_tgs)} />
        <Kpi label="TNS" value={formatInrCompact(kpis.total_tns)} />
        <Kpi label="Qty" value={formatNumber(kpis.quantity_billed)} />
        <Kpi label="Materials" value={formatNumber(kpis.unique_materials_purchased ?? kpis.material_count)} />
      </Box>

      <Divider />

      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 1.25, pt: 0.8 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, mb: 0.2 }}>
            Top Product Groups
          </Typography>
          {productGroups.length ? productGroups.map((item, index) => (
            <CompactRow
              key={`${item.product_group}-${index}`}
              index={index + 1}
              title={item.product_group || "Unknown"}
              tgs={item.tgs}
              qty={item.quantity_billed}
            />
          )) : (
            <Typography sx={{ fontSize: 9, color: "text.secondary" }}>
              No product-group data.
            </Typography>
          )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, mb: 0.2 }}>
            Top Materials
          </Typography>
          {materials.length ? materials.map((item, index) => (
            <CompactRow
              key={`${item.material_number}-${index}`}
              index={index + 1}
              title={item.material_number || "Unknown"}
              subtitle={item.material_description || item.product_group || ""}
              tgs={item.tgs}
              qty={item.quantity_billed}
            />
          )) : (
            <Typography sx={{ fontSize: 9, color: "text.secondary" }}>
              No material data.
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default BusinessSnapshot;
