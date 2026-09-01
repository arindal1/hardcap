import { NavBar } from "@/components/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <div className="flex-1 px-3 py-6 sm:px-6 sm:py-8">{children}</div>
    </>
  );
}