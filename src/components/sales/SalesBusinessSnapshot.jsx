import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";


function formatAmount(
  value
) {

  const number =
    Number(
      value || 0
    );


  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0,
    }
  ).format(
    number
  );
}


function formatNumber(
  value
) {

  const number =
    Number(
      value || 0
    );


  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    }
  ).format(
    number
  );
}


// =========================================================
// KPI CARD
// =========================================================

function SnapshotMetric({
  label,
  value,
}) {

  return (

    <Paper
      variant="outlined"
      sx={{
        p:
          1.5,

        height:
          "100%",

        borderRadius:
          2,
      }}
    >

      <Typography
        variant="caption"
        sx={{
          color:
            "#667788",
        }}
      >

        {label}

      </Typography>


      <Typography
        sx={{
          mt:
            0.5,

          fontSize:
            "1.05rem",

          fontWeight:
            700,

          color:
            "#0f3557",
        }}
      >

        {value}

      </Typography>

    </Paper>
  );
}


// =========================================================
// SALES BUSINESS SNAPSHOT
// =========================================================

function SalesBusinessSnapshot({
  snapshot,
  loading = false,
  error = null,
}) {

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <Box
        sx={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          gap:
            1,

          py:
            3,
        }}
      >

        <CircularProgress
          size={22}
        />


        <Typography
          variant="body2"
        >

          Loading customer business snapshot...

        </Typography>

      </Box>
    );
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <Box
        sx={{
          border:
            "1px solid #e0b4b4",

          borderRadius:
            2,

          p:
            2,

          mb:
            2,
        }}
      >

        <Typography
          variant="body2"
          sx={{
            color:
              "#a12727",
          }}
        >

          {error}

        </Typography>

      </Box>
    );
  }


  // =====================================================
  // NOTHING SELECTED
  // =====================================================

  if (!snapshot) {

    return null;
  }


  const customer =
    snapshot?.customer ||
    {};


  const business =
    snapshot?.business_snapshot ||
    {};


  const productGroups =
    Array.isArray(
      snapshot?.top_product_groups
    )
      ? snapshot.top_product_groups
      : [];


  const topMaterials =
    Array.isArray(
      snapshot?.top_materials
    )
      ? snapshot.top_materials
      : [];


  return (

    <Box
      sx={{
        border:
          "1px solid #d9e2ec",

        borderRadius:
          2,

        backgroundColor:
          "#ffffff",

        p:
          2,

        mb:
          2,
      }}
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight:
            700,

          color:
            "#0f3557",
        }}
      >

        Business Snapshot

      </Typography>


      <Typography
        variant="body2"
        sx={{
          color:
            "#667788",

          mb:
            2,
        }}
      >

        {customer.bmd_name}

        {
          customer.bmd_code
            ? ` • BMD ${customer.bmd_code}`
            : ""
        }

      </Typography>


      {/* =================================================
          KPIs
          ================================================= */}

      <Grid
        container
        spacing={1.5}
      >

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >

          <SnapshotMetric
            label="Gross Sales (TGS)"
            value={
              formatAmount(
                business.total_tgs
              )
            }
          />

        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >

          <SnapshotMetric
            label="Net Sales (TNS)"
            value={
              formatAmount(
                business.total_tns
              )
            }
          />

        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >

          <SnapshotMetric
            label="Quantity Billed"
            value={
              formatNumber(
                business.quantity_billed
              )
            }
          />

        </Grid>


        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >

          <SnapshotMetric
            label="Materials Purchased"
            value={
              formatNumber(
                business.material_count
              )
            }
          />

        </Grid>

      </Grid>


      <Divider
        sx={{
          my:
            2,
        }}
      />


      <Grid
        container
        spacing={3}
      >

        {/* ===============================================
            TOP PRODUCT GROUPS
            =============================================== */}

        <Grid
          item
          xs={12}
          md={6}
        >

          <Typography
            sx={{
              fontWeight:
                700,

              color:
                "#0f3557",

              mb:
                1,
            }}
          >

            Top Product Groups

          </Typography>


          {productGroups.length === 0 ? (

            <Typography
              variant="body2"
              sx={{
                color:
                  "#667788",
              }}
            >

              No product-group information available.

            </Typography>

          ) : (

            productGroups.map(
              (
                item,
                index
              ) => (

                <Box
                  key={
                    `${item.product_group}-${index}`
                  }
                  sx={{
                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    py:
                      0.75,

                    borderBottom:
                      index <
                      productGroups.length - 1
                        ? "1px solid #edf1f5"
                        : "none",
                  }}
                >

                  <Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight:
                          600,
                      }}
                    >

                      {index + 1}.{" "}
                      {item.product_group ||
                        "Unknown"}

                    </Typography>


                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          "#667788",
                      }}
                    >

                      Qty:{" "}
                      {formatNumber(
                        item.quantity_billed
                      )}

                    </Typography>

                  </Box>


                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight:
                        700,
                    }}
                  >

                    {formatAmount(
                      item.tgs
                    )}

                  </Typography>

                </Box>

              )
            )
          )}

        </Grid>


        {/* ===============================================
            TOP MATERIALS
            =============================================== */}

        <Grid
          item
          xs={12}
          md={6}
        >

          <Typography
            sx={{
              fontWeight:
                700,

              color:
                "#0f3557",

              mb:
                1,
            }}
          >

            Top Materials

          </Typography>


          {topMaterials.length === 0 ? (

            <Typography
              variant="body2"
              sx={{
                color:
                  "#667788",
              }}
            >

              No material information available.

            </Typography>

          ) : (

            topMaterials.map(
              (
                item,
                index
              ) => (

                <Box
                  key={
                    `${item.material_number}-${index}`
                  }
                  sx={{
                    py:
                      0.75,

                    borderBottom:
                      index <
                      topMaterials.length - 1
                        ? "1px solid #edf1f5"
                        : "none",
                  }}
                >

                  <Box
                    sx={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      gap:
                        2,
                    }}
                  >

                    <Box
                      sx={{
                        minWidth:
                          0,
                      }}
                    >

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight:
                            600,
                        }}
                      >

                        {index + 1}.{" "}

                        {
                          item.material_description ||
                          item.material_number ||
                          "Unknown material"
                        }

                      </Typography>


                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            "#667788",
                        }}
                      >

                        {item.material_number}

                        {
                          item.product_group
                            ? ` • ${item.product_group}`
                            : ""
                        }

                      </Typography>

                    </Box>


                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight:
                          700,

                        whiteSpace:
                          "nowrap",
                      }}
                    >

                      {formatAmount(
                        item.tgs
                      )}

                    </Typography>

                  </Box>

                </Box>

              )
            )
          )}

        </Grid>

      </Grid>

    </Box>
  );
}


export default SalesBusinessSnapshot;