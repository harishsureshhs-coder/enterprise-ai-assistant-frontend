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


const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 300;


// =========================================================
// SALES CUSTOMER SELECTOR
// =========================================================

function SalesCustomerSelector({
  selectedCustomer,
  onCustomerSelect,
  disabled = false,
}) {

  // =======================================================
  // SEARCH TEXT
  // =======================================================

  const [
    searchText,
    setSearchText,
  ] = useState("");


  // =======================================================
  // SEARCH RESULTS
  // =======================================================

  const [
    customers,
    setCustomers,
  ] = useState([]);


  // =======================================================
  // SEARCH STATUS
  // =======================================================

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);


  // =======================================================
  // ERROR
  // =======================================================

  const [
    error,
    setError,
  ] = useState(null);


  // =======================================================
  // DEBOUNCE TIMER
  // =======================================================

  const searchTimerRef =
    useRef(null);


  // =======================================================
  // REQUEST VERSION
  //
  // Example:
  //
  // Request 1 = 1700
  // Request 2 = 17024597
  //
  // If request 1 finishes after request 2,
  // request 1 must NOT replace the latest results.
  // =======================================================

  const searchRequestIdRef =
    useRef(0);


  // =======================================================
  // SEARCH PRIMARY CUSTOMERS
  // =======================================================

  useEffect(
    () => {

      const cleanSearch =
        String(
          searchText || ""
        ).trim();


      // ---------------------------------------------------
      // CANCEL PREVIOUS DEBOUNCE TIMER
      // ---------------------------------------------------

      if (
        searchTimerRef.current
      ) {

        window.clearTimeout(
          searchTimerRef.current
        );


        searchTimerRef.current =
          null;
      }


      // ---------------------------------------------------
      // INVALIDATE PREVIOUS ASYNC REQUESTS
      // ---------------------------------------------------

      const requestId =
        ++searchRequestIdRef.current;


      // ---------------------------------------------------
      // IMPORTANT
      //
      // Remove the previous result list immediately.
      //
      // This fixes:
      //
      // Search 1700
      //      ↓
      // old B C INJECTION list remains visible
      // ---------------------------------------------------

      setCustomers([]);


      setError(
        null
      );


      // ---------------------------------------------------
      // REQUIRE AT LEAST 3 CHARACTERS
      //
      // Must match salesCustomerApi.js and backend.
      // ---------------------------------------------------

      if (
        cleanSearch.length <
        MIN_SEARCH_LENGTH
      ) {

        setIsSearching(
          false
        );


        return;
      }


      // ---------------------------------------------------
      // SHOW SEARCHING STATUS IMMEDIATELY
      // ---------------------------------------------------

      setIsSearching(
        true
      );


      // ---------------------------------------------------
      // DEBOUNCED SEARCH
      // ---------------------------------------------------

      searchTimerRef.current =
        window.setTimeout(
          async () => {

            try {

              console.log(
                "Searching primary Sales customers:",
                cleanSearch
              );


              // ===========================================
              // IMPORTANT
              //
              // Use searchText, not search.
              // ===========================================

              const results =
                await searchSalesCustomers({
                  searchText:
                    cleanSearch,

                  limit:
                    20,
                });


              // -------------------------------------------
              // IGNORE OLD RESPONSE
              // -------------------------------------------

              if (
                requestId !==
                searchRequestIdRef.current
              ) {

                console.log(
                  (
                    "Ignoring stale customer " +
                    "search response:"
                  ),
                  cleanSearch
                );


                return;
              }


              console.log(
                "Primary customer search results:",
                {
                  search:
                    cleanSearch,

                  count:
                    Array.isArray(
                      results
                    )
                      ? results.length
                      : 0,

                  results,
                }
              );


              setCustomers(
                Array.isArray(
                  results
                )
                  ? results
                  : []
              );


            } catch (
              searchError
            ) {

              // -------------------------------------------
              // IGNORE ERROR FROM OLD REQUEST
              // -------------------------------------------

              if (
                requestId !==
                searchRequestIdRef.current
              ) {

                return;
              }


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

              // -------------------------------------------
              // ONLY LATEST REQUEST CONTROLS LOADING STATE
              // -------------------------------------------

              if (
                requestId ===
                searchRequestIdRef.current
              ) {

                setIsSearching(
                  false
                );
              }
            }

          },
          SEARCH_DEBOUNCE_MS
        );


      // ---------------------------------------------------
      // CLEANUP
      // ---------------------------------------------------

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


  // =======================================================
  // CUSTOMER SELECTED
  // =======================================================

  function handleCustomerChange(
    event,
    customer
  ) {

    console.log(
      "Selected primary customer:",
      customer
    );


    // -----------------------------------------------------
    // Clear autocomplete search state.
    //
    // MUI will display the selected customer's label.
    // -----------------------------------------------------

    setSearchText(
      ""
    );


    setCustomers(
      []
    );


    setError(
      null
    );


    // Invalidate any request still running.
    searchRequestIdRef.current +=
      1;


    if (
      typeof onCustomerSelect ===
      "function"
    ) {

      onCustomerSelect(
        customer
      );
    }
  }


  // =======================================================
  // BUILD DISPLAY LABEL
  //
  // Example:
  //
  // PANU DIESEL (17002800)
  // =======================================================

  function getCustomerLabel(
    customer
  ) {

    if (
      !customer
    ) {

      return "";
    }


    const customerName =
      String(
        customer.bmd_name ||
        ""
      ).trim();


    const customerCode =
      String(
        customer.bmd_code ||
        ""
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


  // =======================================================
  // UI
  // =======================================================

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

        // -------------------------------------------------
        // Results come only from backend.
        // -------------------------------------------------

        options={
          customers
        }


        // -------------------------------------------------
        // Currently selected customer.
        // -------------------------------------------------

        value={
          selectedCustomer || null
        }


        // -------------------------------------------------
        // Search loading state.
        // -------------------------------------------------

        loading={
          isSearching
        }


        loadingText={
          "Searching customers..."
        }


        disabled={
          disabled
        }


        // -------------------------------------------------
        // IMPORTANT
        //
        // Backend already filtered the list.
        //
        // Do not apply MUI's local text filter again.
        // -------------------------------------------------

        filterOptions={
          (options) =>
            options
        }


        // -------------------------------------------------
        // COMPARE CUSTOMER BY BMD CODE
        // -------------------------------------------------

        isOptionEqualToValue={
          (
            option,
            value
          ) => {

            return (
              String(
                option?.bmd_code ||
                ""
              ).trim()
              ===
              String(
                value?.bmd_code ||
                ""
              ).trim()
            );
          }
        }


        // -------------------------------------------------
        // LABEL AFTER SELECTION
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

            // ---------------------------------------------
            // Real user typing
            // ---------------------------------------------

            if (
              reason ===
              "input"
            ) {

              setSearchText(
                value
              );


              return;
            }


            // ---------------------------------------------
            // User clicked clear icon
            // ---------------------------------------------

            if (
              reason ===
              "clear"
            ) {

              searchRequestIdRef.current +=
                1;


              setSearchText(
                ""
              );


              setCustomers(
                []
              );


              setError(
                null
              );


              setIsSearching(
                false
              );


              if (
                typeof onCustomerSelect ===
                "function"
              ) {

                onCustomerSelect(
                  null
                );
              }
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
        // EMPTY RESULTS
        // -------------------------------------------------

        noOptionsText={
          searchText.trim().length <
          MIN_SEARCH_LENGTH
            ? (
                "Enter at least " +
                `${MIN_SEARCH_LENGTH} characters`
              )
            : "No primary customers found"
        }


        // -------------------------------------------------
        // RESULT DISPLAY
        // -------------------------------------------------

        renderOption={
          (
            props,
            option
          ) => {

            /*
             * MUI may include key in props.
             *
             * Do not spread key using {...props}.
             */

            const {
              key,
              ...optionProps
            } = props;


            const regionDisplay =
              option.region_name ||
              option.region_code ||
              "";


            const salesOfficeDisplay =
              option.sales_office_code ||
              "";


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

                {/* Customer name */}

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight:
                      700,

                    color:
                      "#0f3557",
                  }}
                >

                  {
                    option.bmd_name ||
                    "Unknown Customer"
                  }

                </Typography>


                {/* BMD + Sales Office */}

                <Typography
                  variant="caption"
                  sx={{
                    color:
                      "#667788",
                  }}
                >

                  BMD:{" "}
                  {
                    option.bmd_code
                  }


                  {
                    salesOfficeDisplay
                      ? (
                          ` • ${salesOfficeDisplay}`
                        )
                      : ""
                  }

                </Typography>


                {/* Region */}

                {
                  regionDisplay
                    ? (

                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            "#8a98a8",

                          fontSize:
                            "0.68rem",
                        }}
                      >

                        {
                          regionDisplay
                        }

                      </Typography>

                    )
                    : null
                }

              </Box>
            );
          }
        }


        // -------------------------------------------------
        // SEARCH INPUT
        //
        // Do NOT override InputProps or endAdornment.
        // MUI controls the loading/dropdown icons.
        // -------------------------------------------------

        renderInput={
          (
            params
          ) => (

            <TextField
              {...params}

              size="small"

              placeholder={
                "Search BMD name or code..."
              }

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

      {
        selectedCustomer &&
        (

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

              {
                selectedCustomer.bmd_name
              }

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
              {
                selectedCustomer.bmd_code
              }

            </Typography>


            {/* SALES EMPLOYEE */}

            {
              selectedCustomer.sales_employee &&
              (

                <Typography
                  variant="body2"
                  sx={{
                    color:
                      "#667788",
                  }}
                >

                  Sales Employee:{" "}
                  {
                    selectedCustomer
                      .sales_employee
                  }

                </Typography>

              )
            }


            {/* SALES OFFICE */}

            {
              (
                selectedCustomer.sales_office_name ||
                selectedCustomer.sales_office_code
              ) &&
              (

                <Typography
                  variant="body2"
                  sx={{
                    color:
                      "#667788",
                  }}
                >

                  Sales Office:{" "}
                  {
                    selectedCustomer.sales_office_name ||
                    selectedCustomer.sales_office_code
                  }

                </Typography>

              )
            }


            {/* REGION */}

            {
              (
                selectedCustomer.region_name ||
                selectedCustomer.region_code
              ) &&
              (

                <Typography
                  variant="body2"
                  sx={{
                    color:
                      "#667788",
                  }}
                >

                  Region:{" "}
                  {
                    selectedCustomer.region_name ||
                    selectedCustomer.region_code
                  }

                </Typography>

              )
            }

          </Box>
        )
      }

    </Box>
  );
}


export default SalesCustomerSelector;