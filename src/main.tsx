import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "@/components/ui/provider";
import { PageNotFound } from "@/page_not_found";
import { App } from "./app";
import { TermsOfService } from "./tos";
import { PrivacyPolicy } from "./privacy";

function Routing() {
  return (
    <BrowserRouter>
      <Routes>
        {/* If change any routes, then change sitemap.xml. */}
        <Route path={"/"}>
          <Route index element={<App />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/tos" element={<TermsOfService />} />

          {/* All remaining non-matches go to not found. */}
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider forcedTheme="light">
      <Routing />
    </Provider>
  </StrictMode>
);
