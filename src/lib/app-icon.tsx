/** Shared visual for the PNG app icon routes (icon-192.png, icon-512.png,
 * icon-512-maskable.png) - rendered via next/og ImageResponse (Satori).
 * Mirrors the folder shape/palette of src/app/icon.svg (authored on a 32x32
 * grid) so the PWA install icon matches the browser tab favicon.
 */

const BG = "#121216";
const GOLD = "#d8b673";
const GOLD_LIGHT = "#e8ca8f";

type AppIconProps = {
  size: number;
  /** Maskable icons must keep all content within Android's ~80% safe zone. */
  maskable?: boolean;
};

export function AppIcon({ size, maskable = false }: AppIconProps) {
  const scale = (maskable ? size * 0.6 : size) / 32;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
        borderRadius: maskable ? 0 : 7 * scale,
      }}
    >
      <div style={{ display: "flex", position: "relative", width: 32 * scale, height: 32 * scale }}>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 6 * scale,
            top: 8 * scale,
            width: 9 * scale,
            height: 3 * scale,
            borderRadius: 1.5 * scale,
            background: GOLD,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 6 * scale,
            top: 10 * scale,
            width: 18 * scale,
            height: 13 * scale,
            borderRadius: 2 * scale,
            background: GOLD,
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 6 * scale,
            top: 13 * scale,
            width: 20 * scale,
            height: 1.6 * scale,
            background: GOLD_LIGHT,
            opacity: 0.55,
          }}
        />
      </div>
    </div>
  );
}