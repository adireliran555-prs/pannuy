import Navbar from "@/components/common/Navbar";
import EventContextBar from "@/components/common/EventContextBar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <EventContextBar />
      <div className="flex-1 pb-16 sm:pb-0">{children}</div>
    </>
  );
}
