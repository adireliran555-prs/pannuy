import Navbar from "@/components/common/Navbar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex-1 pb-16 sm:pb-0">{children}</div>
    </>
  );
}
