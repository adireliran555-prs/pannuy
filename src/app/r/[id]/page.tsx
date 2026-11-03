import prisma from "@/lib/prisma";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import RespondButtons from "./RespondButtons";
import OutcomePrompt from "@/components/customer/OutcomePrompt";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

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
    select: { id: true, status: true, customerId: true, customerOutcome: true, supplier: { select: { name: true } } },
  });

  const token = (await cookies()).get("pannuy_session")?.value;
  const session = token ? (verifyToken(token) as { id?: string; type?: string } | null) : null;
  const isOwner = !!session && session.type === "customer" && session.id === referral?.customerId;

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
                    ? `רצינו לוודא שהצלחתם ליצור קשר עם ${referral.supplier.name}.`
                    : "רצינו לוודא שהצלחתם ליצור קשר עם הספק."}
                </p>
              </div>
              {isOwner && !referral.customerOutcome ? (
                <OutcomePrompt referralId={referral.id} supplierName={referral.supplier?.name ?? "הספק"} />
              ) : isOwner ? (
                <p className="text-center text-green-700 font-semibold">תודה, העדכון שלכם נשמר 🙏</p>
              ) : (
                <RespondButtons referralId={referral.id} initialStatus={referral.status} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
