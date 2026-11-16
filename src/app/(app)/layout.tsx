import Nav from "@/components/Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <Nav />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
