import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8F6844, #6F5035)",
          borderRadius: 12,
          color: "white",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        T
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "#F3EBE3",
            margin: "0 2px",
            alignSelf: "flex-end",
            marginBottom: 9,
          }}
        />
        E
      </div>
    ),
    { ...size }
  );
}
