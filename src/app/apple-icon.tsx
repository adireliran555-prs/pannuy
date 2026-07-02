import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          color: "white",
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -3,
        }}
      >
        T
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "#F3EBE3",
            margin: "0 6px",
            alignSelf: "flex-end",
            marginBottom: 34,
          }}
        />
        E
      </div>
    ),
    { ...size }
  );
}
