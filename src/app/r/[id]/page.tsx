import prisma from "@/lib/prisma";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import RespondButtons from "./RespondButtons";

export const dynamic = "force-dynamic";

// Customer follow-up landing page (linked from the referral follow-up message):
// "Did you manage to connect with {supplier}?"
export default async function ReferralFollowUpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const referral = await prisma.referral.findUnique({
    where: { id },
    select: { id: true, status: true, supplier: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <TopEventsLogo href="/" size="lg" />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {!referral ? (
            <p className="text-center text-text-muted">
              הקישור אינו תקף יותר.
            </p>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black text-text-main">
                  הצלחתם ליצור קשר?
                </h1>
                <p className="text-text-muted">
                  {referral.supplier?.name
                    ? `רצינו לוודא שהצלחתם להתחבר עם ${referral.supplier.name}.`
                    : "רצינו לוודא שהצלחתם להתחבר עם הספק."}
                </p>
              </div>
              <RespondButtons referralId={referral.id} initialStatus={referral.status} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
