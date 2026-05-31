import prisma from "@/lib/prisma";
import AdminLayout from "@/components/common/AdminLayout";
import { formatRelativeHebrew } from "@/lib/utils";
import { Eye, UserPlus, Briefcase, CalendarCheck, Star, Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

type Event = {
  kind: "customer_signup" | "supplier_signup" | "meeting" | "review" | "save" | "view";
  text: string;
  at: Date;
};

export default async function AdminActivityPage() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // $transaction runs all queries serially on a single pooler connection.
  // Promise.all here would fan out to 6 connections per request and trip the
  // Supabase pooler limit (15) under any concurrency.
  const [customers, suppliers, meetings, reviews, saves, views] = await prisma.$transaction([
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, weddingArea: true, createdAt: true },
      take: 50,
    }),
    prisma.supplier.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, category: true, createdAt: true },
      take: 50,
    }),
    prisma.meeting.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
      take: 50,
    }),
    prisma.review.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
      take: 50,
    }),
    prisma.savedSupplier.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
      take: 50,
    }),
    prisma.profileView.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
      take: 50,
    }),
  ]);

  const events: Event[] = [
    ...customers.map<Event>((c) => ({
      kind: "customer_signup",
      text: `לקוח חדש: ${c.name}${c.weddingArea ? ` (${c.weddingArea})` : ""}`,
      at: c.createdAt,
    })),
    ...suppliers.map<Event>((s) => ({
      kind: "supplier_signup",
      text: `ספק חדש נרשם: ${s.name}`,
      at: s.createdAt,
    })),
    ...meetings.map<Event>((m) => ({
      kind: "meeting",
      text: `${m.customer?.name} ביקש פגישה עם ${m.supplier?.name} (${m.status})`,
      at: m.createdAt,
    })),
    ...reviews.map<Event>((r) => ({
      kind: "review",
      text: `${r.customer?.name} כתב/ה ביקורת על ${r.supplier?.name}: ${r.rating}⭐`,
      at: r.createdAt,
    })),
    ...saves.map<Event>((s) => ({
      kind: "save",
      text: `${s.customer?.name} שמר/ה את ${s.supplier?.name}`,
      at: s.createdAt,
    })),
    ...views.map<Event>((v) => ({
      kind: "view",
      text: v.customer?.name
        ? `${v.customer.name} צפה בפרופיל ${v.supplier?.name}`
        : `אורח/ת צפה בפרופיל ${v.supplier?.name}`,
      at: v.createdAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 200);

  const ICONS = {
    customer_signup: UserPlus,
    supplier_signup: Briefcase,
    meeting: CalendarCheck,
    review: Star,
    save: Bookmark,
    view: Eye,
  };

  const COLORS = {
    customer_signup: "bg-blue-50 text-blue-600",
    supplier_signup: "bg-amber-50 text-amber-600",
    meeting: "bg-green-50 text-green-600",
    review: "bg-purple-50 text-purple-600",
    save: "bg-rose-50 text-rose-600",
    view: "bg-gray-100 text-gray-600",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">פעילות</h1>
          <p className="text-sm text-text-muted mt-1">{events.length} אירועים אחרונים (30 ימים)</p>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {events.length === 0 ? (
            <div className="py-10 text-center text-text-muted">אין פעילות עדיין</div>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e, i) => {
                const Icon = ICONS[e.kind];
                return (
                  <li key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${COLORS[e.kind]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm text-text-main">{e.text}</div>
                    <div className="text-xs text-text-muted whitespace-nowrap">
                      {formatRelativeHebrew(e.at)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
