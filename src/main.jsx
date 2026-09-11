import React, {
  lazy,
  Suspense,
} from "react";

import ReactDOM from "react-dom/client";

import {
  ThemeProvider,
} from "@mui/material/styles";

import CssBaseline
  from "@mui/material/CssBaseline";

import App from "./App";
import theme from "./theme/theme";


// Sales code is loaded ONLY when /sales is opened
const SalesApp = lazy(
  () => import("./sales/SalesApp")
);


const isSalesRoute =
  window.location.pathname
    .toLowerCase()
    .startsWith("/sales");


ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <ThemeProvider theme={theme}>

      <CssBaseline />

      {isSalesRoute ? (

        <Suspense
          fallback={
            <div
              style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily:
                  "Arial, sans-serif",
              }}
            >
              Loading Sales Agent...
            </div>
          }
        >
          <SalesApp />
        </Suspense>

      ) : (

        <App />

      )}

    </ThemeProvider>

  </React.StrictMode>
);