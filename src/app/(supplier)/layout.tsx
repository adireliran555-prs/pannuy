import { SupplierNavbar } from "@/components/common/Navbar";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SupplierNavbar />
      <div className="flex-1 pb-16 sm:pb-0">{children}</div>
    </>
  );
}
