import { NavBar } from "@/components/NavBar";
import { MobileTopBar } from "@/components/MobileTopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileTopBar />
      <NavBar />
      <div className="flex-1 px-3 pt-4 pb-28 sm:px-6 md:px-8 md:pt-28 md:pb-12">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </div>
    </>
  );
}