import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Autocomplete,
  Box,
  TextField,
  Typography,
} from "@mui/material";

import {
  searchSalesCustomers,
} from "../../services/salesCustomerApi";


function SalesCustomerSelector({
  selectedCustomer,
  onCustomerSelect,
  disabled = false,
}) {

  // =====================================================
  // SEARCH TEXT
  // =====================================================

  const [
    searchText,
    setSearchText,
  ] = useState("");


  // =====================================================
  // SEARCH RESULTS
  // =====================================================

  const [
    customers,
    setCustomers,
  ] = useState([]);


  // =====================================================
  // SEARCH STATUS
  // =====================================================

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);


  // =====================================================
  // ERROR
  // =====================================================

  const [
    error,
    setError,
  ] = useState(null);


  // =====================================================
  // DEBOUNCE TIMER
  // =====================================================

  const searchTimerRef =
    useRef(null);


  // =====================================================
  // SEARCH PRIMARY CUSTOMERS
  //
  // The API call waits 350ms after typing.
  //
  // Example:
  //
  // PANU DIESEL
  //     ↓
  // GET /sales/customers?search=PANU DIESEL
  // =====================================================

  useEffect(
    () => {

      const cleanSearch =
        String(
          searchText || ""
        ).trim();


      // -------------------------------------------------
      // CLEAR EXISTING TIMER
      // -------------------------------------------------

      if (
        searchTimerRef.current
      ) {

        window.clearTimeout(
          searchTimerRef.current
        );


        searchTimerRef.current =
          null;
      }


      // -------------------------------------------------
      // REQUIRE AT LEAST 2 CHARACTERS
      // -------------------------------------------------

      if (
        cleanSearch.length < 2
      ) {

        setCustomers(
          []
        );


        setError(
          null
        );


        setIsSearching(
          false
        );


        return;
      }


      // -------------------------------------------------
      // DEBOUNCED SEARCH
      // -------------------------------------------------

      searchTimerRef.current =
        window.setTimeout(
          async () => {

            try {

              setIsSearching(
                true
              );


              setError(
                null
              );


              console.log(
                "Searching primary Sales customers:",
                cleanSearch
              );


              const results =
                await searchSalesCustomers({
                  search:
                    cleanSearch,

                  limit:
                    20,
                });


              console.log(
                "Primary customer search results:",
                results
              );


              setCustomers(
                Array.isArray(
                  results
                )
                  ? results
                  : []
              );


            } catch (searchError) {

              console.error(
                "Unable to search Sales customers:",
                searchError
              );


              setCustomers(
                []
              );


              setError(
                searchError instanceof Error
                  ? searchError.message
                  : "Unable to search customers."
              );


            } finally {

              setIsSearching(
                false
              );
            }

          },
          350
        );


      // -------------------------------------------------
      // CLEANUP TIMER
      // -------------------------------------------------

      return () => {

        if (
          searchTimerRef.current
        ) {

          window.clearTimeout(
            searchTimerRef.current
          );


          searchTimerRef.current =
            null;
        }
      };

    },
    [
      searchText,
    ]
  );


  // =====================================================
  // CUSTOMER SELECTED
  // =====================================================

  function handleCustomerChange(
    event,
    customer
  ) {

    console.log(
      "Selected primary customer:",
      customer
    );


    if (
      typeof onCustomerSelect ===
      "function"
    ) {

      onCustomerSelect(
        customer
      );
    }
  }


  // =====================================================
  // BUILD DISPLAY LABEL
  //
  // PANU DIESEL (17002800)
  // =====================================================

  function getCustomerLabel(
    customer
  ) {

    if (!customer) {

      return "";
    }


    const customerName =
      String(
        customer.bmd_name || ""
      ).trim();


    const customerCode =
      String(
        customer.bmd_code || ""
      ).trim();


    if (
      customerName &&
      customerCode
    ) {

      return (
        `${customerName} (${customerCode})`
      );
    }


    return (
      customerName ||
      customerCode
    );
  }


  // =====================================================
  // UI
  // =====================================================

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

          mb:
            0.5,
        }}
      >

        Primary Customer

      </Typography>


      <Typography
        variant="body2"
        sx={{
          color:
            "#667788",

          mb:
            1.5,
        }}
      >

        Search using BMD name or BMD code.

      </Typography>


      {/* =================================================
          AUTOCOMPLETE
          ================================================= */}

      <Autocomplete
        options={
          customers
        }

        value={
          selectedCustomer
        }

        loading={
          isSearching
        }

        loadingText=
          "Searching customers..."

        disabled={
          disabled
        }

        // -------------------------------------------------
        // Backend already filters customer results.
        //
        // Do not let MUI perform another filter.
        // -------------------------------------------------

        filterOptions={
          (options) =>
            options
        }

        // -------------------------------------------------
        // Compare selected customer using BMD code.
        // -------------------------------------------------

        isOptionEqualToValue={
          (
            option,
            value
          ) => {

            return (
              String(
                option?.bmd_code || ""
              ) ===
              String(
                value?.bmd_code || ""
              )
            );
          }
        }

        // -------------------------------------------------
        // Text shown after selection.
        // -------------------------------------------------

        getOptionLabel={
          getCustomerLabel
        }

        // -------------------------------------------------
        // USER TYPING
        // -------------------------------------------------

        onInputChange={
          (
            event,
            value,
            reason
          ) => {

            if (
              reason ===
              "input"
            ) {

              setSearchText(
                value
              );
            }


            if (
              reason ===
              "clear"
            ) {

              setSearchText(
                ""
              );


              setCustomers(
                []
              );


              setError(
                null
              );
            }
          }
        }

        // -------------------------------------------------
        // CUSTOMER SELECTED
        // -------------------------------------------------

        onChange={
          handleCustomerChange
        }

        // -------------------------------------------------
        // EMPTY RESULT MESSAGE
        // -------------------------------------------------

        noOptionsText={
          searchText.trim().length < 2
            ? "Enter at least 2 characters"
            : "No primary customers found"
        }

        // -------------------------------------------------
        // SEARCH RESULT DISPLAY
        // -------------------------------------------------

        renderOption={
          (
            props,
            option
          ) => {

            /*
             * React may include key inside props.
             *
             * Do not spread key through {...props}.
             */

            const {
              key,
              ...optionProps
            } = props;


            return (

              <Box
                component="li"

                key={
                  key ||
                  option.bmd_code
                }

                {...optionProps}

                sx={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "flex-start !important",

                  py:
                    1,
                }}
              >

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight:
                      700,

                    color:
                      "#0f3557",
                  }}
                >

                  {option.bmd_name}

                </Typography>


                <Typography
                  variant="caption"
                  sx={{
                    color:
                      "#667788",
                  }}
                >

                  BMD:{" "}
                  {option.bmd_code}


                  {option.region_code
                    ? (
                        ` • ${option.region_code}`
                      )
                    : ""
                  }


                  {option.region_zone_code
                    ? (
                        ` • ${option.region_zone_code}`
                      )
                    : ""
                  }

                </Typography>

              </Box>
            );
          }
        }

        // -------------------------------------------------
        // SEARCH INPUT
        //
        // IMPORTANT:
        //
        // Do NOT override InputProps/endAdornment here.
        // MUI Autocomplete manages it internally.
        // -------------------------------------------------

        renderInput={
          (params) => (

            <TextField
              {...params}

              size="small"

              placeholder=
                "Search BMD name or code..."

              error={
                Boolean(
                  error
                )
              }

              helperText={
                error || ""
              }
            />

          )
        }
      />


      {/* =================================================
          SELECTED CUSTOMER INFORMATION
          ================================================= */}

      {selectedCustomer && (

        <Box
          sx={{
            mt:
              1.5,

            px:
              1.5,

            py:
              1.25,

            borderRadius:
              1.5,

            backgroundColor:
              "#f5f8fb",

            border:
              "1px solid #e3eaf1",
          }}
        >

          {/* CUSTOMER NAME */}

          <Typography
            variant="body1"
            sx={{
              fontWeight:
                700,

              color:
                "#0f3557",
            }}
          >

            {selectedCustomer.bmd_name}

          </Typography>


          {/* BMD CODE */}

          <Typography
            variant="body2"
            sx={{
              color:
                "#667788",

              mt:
                0.25,
            }}
          >

            BMD Code:{" "}
            {selectedCustomer.bmd_code}

          </Typography>


          {/* REGION */}

          {selectedCustomer.region_code && (

            <Typography
              variant="body2"
              sx={{
                color:
                  "#667788",
              }}
            >

              Region:{" "}
              {selectedCustomer.region_code}

            </Typography>

          )}


          {/* REGION ZONE */}

          {selectedCustomer.region_zone_code && (

            <Typography
              variant="body2"
              sx={{
                color:
                  "#667788",
              }}
            >

              Zone:{" "}
              {selectedCustomer.region_zone_code}

            </Typography>

          )}

        </Box>

      )}

    </Box>
  );
}


export default SalesCustomerSelector;