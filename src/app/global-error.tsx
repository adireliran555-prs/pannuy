"use client";

import { Heebo } from "next/font/google";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  weight: ["400", "700", "900"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.className}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF8",
          color: "#1A1A1A",
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            textAlign: "center",
            background: "#fff",
            border: "1px solid #E5E0D8",
            borderRadius: "24px",
            padding: "32px 24px",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 8px" }}>משהו השתבש</h1>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: "0 0 20px" }}>
            נסו לרענן את הדף.
          </p>
          {error?.digest && (
            <p style={{ color: "#6B7280", fontSize: "12px", margin: "0 0 20px" }} dir="ltr">
              קוד שגיאה: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              width: "100%",
              minHeight: "48px",
              borderRadius: "999px",
              border: "none",
              background: "#8F6844",
              color: "#fff",
              fontWeight: 700,
              fontSize: "16px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            נסו שוב
          </button>
        </div>
      </body>
    </html>
  );
}
