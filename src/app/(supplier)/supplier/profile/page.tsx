"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, X, Check, CheckCircle, LogOut } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ISRAELI_CITIES, cn } from "@/lib/utils";

const SERVICE_AREAS = [
  "גוש דן", "תל אביב", "ירושלים", "חיפה",
  "הצפון", "הדרום", "השרון", "שפלה", "אילת", "מרכז",
];

interface PackageState {
  id?: string;
  name: string;
  price: number;
  hours: number;
  includes: string[];
  isPopular: boolean;
  includeInput: string;
}

export default function SupplierProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "photos" | "packages">("info");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const handleLogout = async () => {
    await fetch("/api/supplier/auth/logout", { method: "POST" });
    router.push("/supplier/login");
  };

  // Info tab state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  // Photos tab state (display only — upload requires Cloudinary)
  const [photos, setPhotos] = useState<string[]>([]);

  // Packages tab state
  const [packages, setPackages] = useState<PackageState[]>([]);

  useEffect(() => {
    fetch("/api/supplier/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const s = json.data;
          setName(s.name ?? "");
          setCity(s.city ?? "");
          setBio(s.bioHe ?? "");
          setSelectedAreas(s.serviceAreas ?? []);
          setPriceFrom(s.basePriceFrom?.toString() ?? "");
          setPriceTo(s.basePriceTo?.toString() ?? "");
          setPhotos((s.photos ?? []).map((p: { cloudinaryUrl: string }) => p.cloudinaryUrl));
          setPackages(
            (s.packages ?? []).map((p: {
              id: string; nameHe: string; price: number; hours: number;
              includes: string[]; isPopular: boolean;
            }) => ({
              id: p.id,
              name: p.nameHe,
              price: p.price,
              hours: p.hours ?? 0,
              includes: p.includes ?? [],
              isPopular: p.isPopular,
              includeInput: "",
            }))
          );
        }
      })
      .finally(() => setIsFetching(false));
  }, []);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const showSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveInfo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          bioHe: bio || undefined,
          city: city || undefined,
          serviceAreas: selectedAreas.length > 0 ? selectedAreas : undefined,
          basePriceFrom: priceFrom ? Number(priceFrom) : undefined,
          basePriceTo: priceTo ? Number(priceTo) : undefined,
        }),
      });
      if (res.ok) showSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePackages = async () => {
    setIsLoading(true);
    try {
      for (const pkg of packages) {
        if (!pkg.name || !pkg.price) continue;
        const body = {
          nameHe: pkg.name,
          price: Number(pkg.price),
          hours: Number(pkg.hours) || undefined,
          includes: pkg.includes,
          isPopular: pkg.isPopular,
        };
        if (pkg.id) {
          await fetch(`/api/supplier/packages/${pkg.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          const res = await fetch("/api/supplier/packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data?.id) {
              setPackages((prev) =>
                prev.map((p) => (p === pkg ? { ...p, id: json.data.id } : p))
              );
            }
          }
        }
      }
      showSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "info", label: "מידע כללי" },
    { id: "photos", label: "תמונות" },
    { id: "packages", label: "חבילות" },
  ];

  if (isFetching) {
    return (
      <SupplierDashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </SupplierDashboardLayout>
    );
  }

  return (
    <SupplierDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-text-main">הפרופיל שלי</h1>
          <p className="text-text-muted text-sm mt-1">עדכנו את הפרטים שמוצגים לזוגות</p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold">
            <CheckCircle className="h-5 w-5" />
            השינויים נשמרו בהצלחה!
          </div>
        )}

        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === id
                  ? "bg-white text-text-main shadow-sm"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Info tab ── */}
        {activeTab === "info" && (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
            <Input label="שם מלא" value={name} onChange={(e) => setName(e.target.value)} />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main">עיר</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-3 text-base text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">בחרו עיר...</option>
                {ISRAELI_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-text-main block mb-2">אזורי שירות</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-medium transition-all",
                      selectedAreas.includes(area)
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text-main hover:border-primary/40"
                    )}
                  >
                    {selectedAreas.includes(area) && <Check className="h-3 w-3" />}
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-text-main">תיאור עצמי</label>
                <span className={cn("text-xs", bio.length > 450 ? "text-red-500" : "text-text-muted")}>
                  {bio.length}/500
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => e.target.value.length <= 500 && setBio(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-border px-4 py-3 text-base text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-main block mb-1.5">מחיר מינימלי (₪)</label>
                <input
                  type="number"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-border px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-main block mb-1.5">מחיר מקסימלי (₪)</label>
                <input
                  type="number"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-border px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <Button fullWidth size="lg" isLoading={isLoading} onClick={handleSaveInfo}>
              שמרי שינויים
            </Button>
          </div>
        )}

        {/* ── Photos tab ── */}
        {activeTab === "photos" && (
          <div className="space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              העלאת תמונות תהיה זמינה בקרוב. כרגע ניתן לראות את התמונות הקיימות בפרופיל.
            </div>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden">
                    <Image src={url} alt={`תמונה ${idx + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center text-text-muted">
                <p className="text-4xl mb-2">📷</p>
                <p className="font-medium">עדיין אין תמונות</p>
              </div>
            )}
          </div>
        )}

        {/* ── Packages tab ── */}
        {activeTab === "packages" && (
          <div className="space-y-5">
            {packages.map((pkg, pkgIdx) => (
              <div
                key={pkgIdx}
                className={cn(
                  "bg-white rounded-2xl border-2 p-6 space-y-4",
                  pkg.isPopular ? "border-primary" : "border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-muted uppercase tracking-wide">
                    חבילה {pkgIdx + 1}
                  </span>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkg.isPopular}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[pkgIdx] = { ...updated[pkgIdx], isPopular: e.target.checked };
                        setPackages(updated);
                      }}
                      className="rounded accent-primary"
                    />
                    הכי פופולרי
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Input
                      label="שם החבילה"
                      value={pkg.name}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[pkgIdx] = { ...updated[pkgIdx], name: e.target.value };
                        setPackages(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-main block mb-1.5">מחיר (₪)</label>
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[pkgIdx] = { ...updated[pkgIdx], price: Number(e.target.value) };
                        setPackages(updated);
                      }}
                      dir="ltr"
                      className="w-full rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-main block mb-1.5">שעות</label>
                    <input
                      type="number"
                      value={pkg.hours}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[pkgIdx] = { ...updated[pkgIdx], hours: Number(e.target.value) };
                        setPackages(updated);
                      }}
                      dir="ltr"
                      className="w-full rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-text-main block mb-2">כולל</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pkg.includes.map((item, i) => (
                      <span key={i} className="flex items-center gap-1.5 bg-primary-light text-primary-dark text-sm px-3 py-1 rounded-full">
                        {item}
                        <button onClick={() => {
                          const updated = [...packages];
                          updated[pkgIdx].includes = updated[pkgIdx].includes.filter((_, ii) => ii !== i);
                          setPackages(updated);
                        }}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="הוסיפו פריט..."
                      value={pkg.includeInput}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[pkgIdx] = { ...updated[pkgIdx], includeInput: e.target.value };
                        setPackages(updated);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const text = pkg.includeInput.trim();
                          if (text) {
                            const updated = [...packages];
                            updated[pkgIdx].includes = [...updated[pkgIdx].includes, text];
                            updated[pkgIdx].includeInput = "";
                            setPackages(updated);
                          }
                        }
                      }}
                      className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text = pkg.includeInput.trim();
                        if (text) {
                          const updated = [...packages];
                          updated[pkgIdx].includes = [...updated[pkgIdx].includes, text];
                          updated[pkgIdx].includeInput = "";
                          setPackages(updated);
                        }
                      }}
                      className="p-2.5 bg-primary-light text-primary rounded-xl hover:bg-primary hover:text-white transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {packages.length < 3 && (
              <button
                type="button"
                onClick={() =>
                  setPackages((prev) => [
                    ...prev,
                    { name: "", price: 0, hours: 0, includes: [], isPopular: false, includeInput: "" },
                  ])
                }
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-2xl text-text-muted hover:border-primary hover:text-primary transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                הוסיפו חבילה
              </button>
            )}

            <Button fullWidth size="lg" isLoading={isLoading} onClick={handleSavePackages}>
              שמרי שינויים
            </Button>
          </div>
        )}

        {/* Logout — visible on all tabs */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:text-red-600 font-semibold text-sm border-t border-border pt-6 mt-4"
        >
          <LogOut className="h-4 w-4" />
          התנתקות מהחשבון
        </button>
      </div>
    </SupplierDashboardLayout>
  );
}
