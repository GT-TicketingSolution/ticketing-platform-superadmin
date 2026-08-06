import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Ticket body */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 10,
            width: 44,
            height: 20,
            borderRadius: 3,
            background: "white",
            display: "flex",
            alignItems: "center",
          }}
        />
        {/* Left notch */}
        <div
          style={{
            position: "absolute",
            top: 27,
            left: 5,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#1e293b",
          }}
        />
        {/* Right notch */}
        <div
          style={{
            position: "absolute",
            top: 27,
            right: 5,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#1e293b",
          }}
        />
        {/* Gold star badge */}
        <div
          style={{
            position: "absolute",
            bottom: 6,
            right: 6,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
          }}
        >
          ★
        </div>
      </div>
    ),
    { ...size }
  );
}
