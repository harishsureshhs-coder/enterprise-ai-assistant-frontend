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
// COMPACT SALES CUSTOMER SELECTOR
//
// Customer name/code are shown only in the dropdown.
// After selection, BusinessSnapshot becomes the single place
// where customer context is displayed.
// =========================================================

function SalesCustomerSelector({
  selectedCustomer,
  onCustomerSelect,
  disabled = false,
}) {

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const searchTimerRef =
    useRef(null);

  const searchRequestIdRef =
    useRef(0);


  // =======================================================
  // SEARCH
  // =======================================================

  useEffect(
    () => {

      const cleanSearch =
        String(
          searchText || ""
        ).trim();


      if (
        searchTimerRef.current
      ) {

        window.clearTimeout(
          searchTimerRef.current
        );

        searchTimerRef.current =
          null;
      }


      const requestId =
        ++searchRequestIdRef.current;


      // Remove stale dropdown rows immediately.
      setCustomers([]);
      setError(null);


      if (
        cleanSearch.length <
        MIN_SEARCH_LENGTH
      ) {

        setIsSearching(false);
        return;
      }


      setIsSearching(true);


      searchTimerRef.current =
        window.setTimeout(
          async () => {

            try {

              const results =
                await searchSalesCustomers({
                  searchText:
                    cleanSearch,

                  limit:
                    20,
                });


              if (
                requestId !==
                searchRequestIdRef.current
              ) {

                return;
              }


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


              setCustomers([]);

              setError(
                searchError instanceof Error
                  ? searchError.message
                  : "Unable to search customers."
              );


            } finally {

              if (
                requestId ===
                searchRequestIdRef.current
              ) {

                setIsSearching(false);
              }
            }

          },
          SEARCH_DEBOUNCE_MS
        );


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
  // SELECT CUSTOMER
  // =======================================================

  function handleCustomerChange(
    event,
    customer
  ) {

    setSearchText("");
    setCustomers([]);
    setError(null);

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
  // DISPLAY LABEL
  // =======================================================

  function getCustomerLabel(
    customer
  ) {

    if (!customer) {

      return "";
    }


    const name =
      String(
        customer.bmd_name || ""
      ).trim();

    const code =
      String(
        customer.bmd_code || ""
      ).trim();


    if (
      name &&
      code
    ) {

      return `${name} (${code})`;
    }


    return (
      name ||
      code
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
          2.5,

        backgroundColor:
          "#ffffff",

        px:
          1.5,

        py:
          1.25,

        mb:
          1.25,
      }}
    >

      <Typography
        sx={{
          fontSize:
            13,

          fontWeight:
            800,

          color:
            "#0f3557",

          lineHeight:
            1.15,

          mb:
            0.2,
        }}
      >
        Primary Customer
      </Typography>


      <Typography
        sx={{
          fontSize:
            10,

          color:
            "#667788",

          lineHeight:
            1.15,

          mb:
            0.8,
        }}
      >
        Search using BMD name or BMD code.
      </Typography>


      <Autocomplete
        options={
          customers
        }

        value={
          selectedCustomer || null
        }

        loading={
          isSearching
        }

        loadingText={
          "Searching customers..."
        }

        disabled={
          disabled
        }

        filterOptions={
          (options) =>
            options
        }

        isOptionEqualToValue={
          (
            option,
            value
          ) => (
            String(
              option?.bmd_code || ""
            ).trim()
            ===
            String(
              value?.bmd_code || ""
            ).trim()
          )
        }

        getOptionLabel={
          getCustomerLabel
        }

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

              return;
            }


            if (
              reason ===
              "clear"
            ) {

              searchRequestIdRef.current +=
                1;

              setSearchText("");
              setCustomers([]);
              setError(null);
              setIsSearching(false);


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

        onChange={
          handleCustomerChange
        }

        noOptionsText={
          searchText.trim().length <
          MIN_SEARCH_LENGTH
            ? (
                "Enter at least " +
                `${MIN_SEARCH_LENGTH} characters`
              )
            : "No primary customers found"
        }

        renderOption={
          (
            props,
            option
          ) => {

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
                    0.75,
                }}
              >

                <Typography
                  sx={{
                    fontSize:
                      12,

                    fontWeight:
                      700,

                    color:
                      "#0f3557",

                    lineHeight:
                      1.15,
                  }}
                >
                  {
                    option.bmd_name ||
                    "Unknown Customer"
                  }
                </Typography>


                <Typography
                  sx={{
                    fontSize:
                      9.5,

                    color:
                      "#667788",

                    lineHeight:
                      1.1,

                    mt:
                      0.15,
                  }}
                >
                  BMD:{" "}
                  {
                    option.bmd_code
                  }

                  {
                    option.sales_office_code
                      ? (
                          ` • ${option.sales_office_code}`
                        )
                      : ""
                  }
                </Typography>

              </Box>
            );
          }
        }

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

              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    minHeight:
                      42,

                    borderRadius:
                      2,
                  },

                "& .MuiInputBase-input":
                  {
                    fontSize:
                      12.5,

                    py:
                      0.9,
                  },

                "& .MuiFormHelperText-root":
                  {
                    mt:
                      0.4,

                    fontSize:
                      9,
                  },
              }}
            />

          )
        }
      />

    </Box>
  );
}


export default SalesCustomerSelector;
