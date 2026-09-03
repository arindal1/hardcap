import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/app-icon";

export const contentType = "image/png";
const size = { width: 512, height: 512 };

export function GET() {
  return new ImageResponse(<AppIcon size={512} maskable />, size);
}