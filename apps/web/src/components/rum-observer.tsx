"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";
import { sendRumEvent } from "@/lib/rum";

export function RumObserver() {
  useReportWebVitals((metric) => {
    sendRumEvent({
      type: "web-vital",
      path: window.location.pathname,
      metricName: metric.name,
      metricValue: metric.value,
    });
  });

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      sendRumEvent({
        type: "js-error",
        path: window.location.pathname,
        message: event.message || "Unknown client error",
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || "Unhandled promise rejection";
      sendRumEvent({
        type: "js-error",
        path: window.location.pathname,
        message: reason,
      });
    };

    const onNavigation = () => {
      sendRumEvent({
        type: "navigation",
        path: window.location.pathname,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("popstate", onNavigation);
    onNavigation();

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("popstate", onNavigation);
    };
  }, []);

  return null;
}

