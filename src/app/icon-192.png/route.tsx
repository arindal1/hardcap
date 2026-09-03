import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/app-icon";

export const contentType = "image/png";
const size = { width: 192, height: 192 };

export function GET() {
  return new ImageResponse(<AppIcon size={192} />, size);
}