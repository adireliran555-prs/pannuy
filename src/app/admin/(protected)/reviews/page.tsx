import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import { formatRelativeHebrew } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true } },
      supplier: { select: { name: true, slug: true } },
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">ביקורות</h1>
          <p className="text-sm text-text-muted mt-1">{reviews.length} ביקורות אחרונות</p>
        </div>

        <ul className="space-y-3">
          {reviews.length === 0 ? (
            <li className="bg-white rounded-2xl border border-border py-10 text-center text-text-muted">
              אין ביקורות עדיין
            </li>
          ) : (
            reviews.map((r) => (
              <li key={r.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div>
                    <div className="font-bold text-text-main">{r.customer?.name}</div>
                    <div className="text-xs text-text-muted">
                      על {r.supplier?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-black">{"⭐".repeat(r.rating)}</span>
                    <span className={cn(
                      "inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border",
                      r.isVisible
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    )}>
                      {r.isVisible ? "מוצגת" : "מוסתרת"}
                    </span>
                  </div>
                </div>
                {r.textHe && <p className="text-sm text-text-main leading-relaxed">{r.textHe}</p>}
                <div className="text-xs text-text-muted mt-2">
                  {formatRelativeHebrew(r.createdAt)}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </AdminLayout>
  );
}
