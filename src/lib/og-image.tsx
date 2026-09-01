/** Shared visual for opengraph-image.tsx and twitter-image.tsx (next/og ImageResponse via Satori). */

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

export function OgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#121216",
        fontFamily: "serif",
      }}
    >
      <div style={{ display: "flex", position: "relative", marginBottom: 48 }}>
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -22,
            left: 14,
            width: 90,
            height: 30,
            background: "#e8ca8f",
            borderRadius: "10px 10px 0 0",
          }}
        />
        <div
          style={{
            display: "flex",
            width: 220,
            height: 150,
            background: "#d8b673",
            borderRadius: 16,
          }}
        />
      </div>
      <div style={{ display: "flex", fontSize: 88, color: "#f2efe9", fontStyle: "italic" }}>HardCap</div>
      <div style={{ display: "flex", fontSize: 32, color: "#d8b673", marginTop: 12 }}>Know your number</div>
    </div>
  );
}