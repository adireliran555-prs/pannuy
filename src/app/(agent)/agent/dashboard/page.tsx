"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Copy, Check, Users, Briefcase, Wallet, Clock, LogOut, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import TopEventsLogo from "@/components/common/TopEventsLogo";
import { formatHebrewDate } from "@/lib/utils";
import { CATEGORY_LABELS_SINGULAR } from "@/lib/categories";
import { BRAND_NAME } from "@/lib/branding";
import { AGENT_REFERRAL_RATE, formatRate } from "@/lib/commission";

const SITE_URL = "https://topeventer.co.il";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתין לאירוע",
  CONFIRMED: "אושר לתשלום",
  PAID: "שולם",
  CANCELLED: "בוטל",
};
const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-green-50 text-green-700",
  PAID: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface Data {
  agent: { name: string; phone: string; email: string | null; referralCode: string };
  stats: {
    referredCustomers: number;
    referredSuppliers: number;
    earnings: { pending: number; confirmed: number; paid: number; count: number };
  };
  recent: {
    id: string;
    amountIls: number;
    status: string;
    eventDate: string;
    dealAmountIls: number | null;
    supplierName: string;
    supplierCategory: string;
  }[];
}

async function fetcher(url: string): Promise<Data> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "שגיאה");
  return json.data;
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR("/api/agent/me", fetcher, { revalidateOnFocus: false });
  const [copied, setCopied] = useState(false);

  const shareUrl = data ? `${SITE_URL}/?ref=${data.agent.referralCode}` : "";
  const shareText = `היי! מחפשים ספקים לאירוע? ב־${BRAND_NAME} תמצאו ספקים מובחרים שפנויים בתאריך שלכם: ${shareUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const logout = async () => {
    await fetch("/api/agent/auth/logout", { method: "POST" });
    router.push("/agent/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TopEventsLogo href="/" size="sm" />
            <span className="text-xs font-bold text-text-muted bg-primary-light text-primary px-2 py-1 rounded-full">סוכנים</span>
          </div>
          <button onClick={logout} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-main">
            <LogOut size={16} /> יציאה
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {isLoading && <p className="text-text-muted text-sm">טוען…</p>}
        {error && <p className="text-red-600 text-sm">{error.message}</p>}
        {data && (
          <>
            <div>
              <h1 className="text-2xl font-black text-text-main">שלום, {data.agent.name.split(" ")[0]} 👋</h1>
              <p className="text-text-muted text-sm mt-1">
                אתם מרוויחים <strong>{formatRate(AGENT_REFERRAL_RATE)}</strong> משווי כל עסקה שנסגרה והתקיימה
                דרך לקוח או ספק שהפניתם. העמלה מאושרת לתשלום אחרי שהאירוע התקיים.
              </p>
            </div>

            <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
              <h2 className="font-bold text-text-main">קישור ההפניה שלכם</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <div dir="ltr" className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm font-mono text-text-main break-all text-left">
                  {shareUrl}
                </div>
                <Button variant="secondary" onClick={copy} className="flex-shrink-0">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span className="ms-1">{copied ? "הועתק" : "העתקה"}</span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-text-muted">
                  קוד: <span dir="ltr" className="font-black text-text-main tracking-wider">{data.agent.referralCode}</span>
                </p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full"
                >
                  <MessageCircle size={16} /> שיתוף בוואטסאפ
                </a>
              </div>
              <p className="text-xs text-text-muted">
                כל מי שנרשם דרך הקישור (לקוח או ספק) משויך אליכם ל־30 יום מרגע הלחיצה.
              </p>
            </section>

            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "לקוחות שהופנו", value: data.stats.referredCustomers, icon: Users },
                { label: "ספקים שהופנו", value: data.stats.referredSuppliers, icon: Briefcase },
                { label: "ממתין לאירוע", value: `₪${data.stats.earnings.pending.toLocaleString("he-IL")}`, icon: Clock },
                {
                  label: "זמין לתשלום",
                  value: `₪${data.stats.earnings.confirmed.toLocaleString("he-IL")}`,
                  icon: Wallet,
                  sub: `שולם עד כה: ₪${data.stats.earnings.paid.toLocaleString("he-IL")}`,
                },
              ].map(({ label, value, icon: Icon, sub }) => (
                <div key={label} className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 text-text-muted text-xs">
                    <Icon size={14} /> {label}
                  </div>
                  <p className="text-xl font-black text-text-main mt-1">{value}</p>
                  {sub && <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>}
                </div>
              ))}
            </section>

            <section className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-bold text-text-main">עמלות</h2>
              </div>
              {data.recent.length === 0 ? (
                <p className="px-5 py-8 text-sm text-text-muted text-center">
                  עדיין אין עמלות. שתפו את הקישור והעמלות יופיעו כאן אחרי שעסקאות ייסגרו.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recent.map((e) => (
                    <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-main text-sm truncate">
                          {e.supplierName}
                          <span className="text-text-muted font-normal"> · {CATEGORY_LABELS_SINGULAR[e.supplierCategory] ?? e.supplierCategory}</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          אירוע ב־{formatHebrewDate(new Date(e.eventDate))}
                          {e.dealAmountIls ? ` · שווי עסקה ₪${e.dealAmountIls.toLocaleString("he-IL")}` : ""}
                        </p>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <p className="font-black text-text-main">₪{e.amountIls.toLocaleString("he-IL")}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASS[e.status] ?? ""}`}>
                          {STATUS_LABEL[e.status] ?? e.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
