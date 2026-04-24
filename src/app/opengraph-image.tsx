import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AuraSport — Prendas Deportivas Usadas Importadas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#0A0A0A",
          color: "#FFFFFF",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: 0.6,
              fontWeight: 800,
            }}
          >
            AuraSport
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: -4,
              textTransform: "uppercase",
            }}
          >
            Jerseys de
          </div>
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: -4,
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #FFFFFF 0%, #888888 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Ropa Vintage
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 20,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: 0.5,
            fontWeight: 700,
          }}
        >
          <div>Envío a toda la República</div>
          <div>aurasport.mx</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
