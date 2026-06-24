"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check, CheckCircle, LogOut, Upload } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ISRAELI_CITIES, cn } from "@/lib/utils";
import { cloudinaryEnabled, uploadToCloudinary } from "@/lib/cloudinary";
import { CATEGORY_LABELS } from "@/lib/categories";

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

interface PhotoState {
  id: string;
  url: string;
}

interface LandingImportPackage {
  nameHe: string;
  price: number;
  hours?: number;
  includes: string[];
  isPopular: boolean;
}

interface LandingImportData {
  name?: string | null;
  bioHe?: string | null;
  email?: string | null;
  category?: string | null;
  serviceAreas?: string[];
  basePriceFrom?: number | null;
  basePriceTo?: number | null;
  images?: string[];
  imageUploads?: Array<{ url: string; publicId: string }>;
  packages?: LandingImportPackage[];
  followedUrl?: string | null;
  stats?: {
    durationMs: number;
    imagesFound: number;
    imagesMirrored: number;
    packagesFound: number;
    followedPricingPage: boolean;
  };
}

interface ImportSummary {
  fields: string[];
  imageCount: number;
  packageCount: number;
  warning?: string;
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
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  // Photos tab state
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Packages tab state
  const [packages, setPackages] = useState<PackageState[]>([]);

  useEffect(() => {
    fetch("/api/supplier/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const s = json.data;
          setName(s.name ?? "");
          setCategory(s.category ?? "");
          setCity(s.city ?? "");
          setBio(s.bioHe ?? "");
          setSelectedAreas(s.serviceAreas ?? []);
          setPriceFrom(s.basePriceFrom?.toString() ?? "");
          setPriceTo(s.basePriceTo?.toString() ?? "");
          setPhotos(
            (s.photos ?? []).map((p: { id: string; cloudinaryUrl: string }) => ({
              id: p.id,
              url: p.cloudinaryUrl,
            }))
          );
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
          category: category || undefined,
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

  const persistPhoto = async (url: string, publicId: string, sortOrder = photos.length) => {
    const res = await fetch("/api/supplier/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        publicId,
        type: sortOrder === 0 ? "COVER" : sortOrder === 1 ? "PROFILE" : "PORTFOLIO",
        sortOrder,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? "שמירת התמונה נכשלה");
    }
    setPhotos((prev) => [...prev, { id: json.data.id, url: json.data.cloudinaryUrl }]);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || uploading) return;
    setUploading(true);
    setImportMsg(null);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        if (photos.length + uploaded >= 20) break;
        const { url, publicId } = await uploadToCloudinary(file);
        await persistPhoto(url, publicId, photos.length + uploaded);
        uploaded += 1;
      }
      setImportMsg(uploaded > 0 ? `נוספו ${uploaded} תמונות` : "לא נוספו תמונות");
    } catch {
      setImportMsg("העלאת התמונה נכשלה, נסו שוב");
    } finally {
      setUploading(false);
    }
  };

  const addPhoto = async () => {
    const url = photoUrl.trim();
    if (!url || photos.length >= 20) return;
    setImportMsg(null);
    try {
      await persistPhoto(url, `manual-${Date.now()}`);
      setPhotoUrl("");
      setImportMsg("התמונה נוספה");
    } catch {
      setImportMsg("שמירת התמונה נכשלה");
    }
  };

  const removePhoto = async (photo: PhotoState) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    await fetch(`/api/supplier/photos/${photo.id}`, { method: "DELETE" }).catch(() => {});
  };

  const handleImportLanding = async () => {
    if (!importUrl.trim() || importing) return;
    setImporting(true);
    setImportMsg(null);
    setImportSummary(null);
    setImportStatus("סורקים את האתר ומחלצים פרטים...");
    setActiveTab("info");
    try {
      const res = await fetch("/api/supplier/import-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setImportMsg(json.error ?? "הייבוא נכשל, נסו כתובת אחרת");
        setImportStatus(null);
        return;
      }

      const imported = json.data as LandingImportData;
      setImportStatus("שומרים את הפרופיל, התמונות והחבילות...");
      const fields: string[] = [];
      const profilePatch: Record<string, string | number | string[] | null> = {};

      if (imported.name) {
        setName(imported.name);
        profilePatch.name = imported.name;
        fields.push("שם");
      }
      if (imported.bioHe) {
        setBio(imported.bioHe);
        profilePatch.bioHe = imported.bioHe;
        fields.push("תיאור");
      }
      if (imported.category && CATEGORY_LABELS[imported.category]) {
        setCategory(imported.category);
        profilePatch.category = imported.category;
        fields.push("תחום");
      }
      if (imported.serviceAreas && imported.serviceAreas.length > 0) {
        setSelectedAreas(imported.serviceAreas);
        profilePatch.serviceAreas = imported.serviceAreas;
        fields.push("אזורי שירות");
      }
      if (imported.email) {
        profilePatch.email = imported.email;
        fields.push("מייל");
      }
      if (imported.basePriceFrom) {
        setPriceFrom(String(imported.basePriceFrom));
        profilePatch.basePriceFrom = imported.basePriceFrom;
        fields.push("מחיר מינימלי");
      } else {
        setPriceFrom("");
        profilePatch.basePriceFrom = null;
      }
      if (imported.basePriceTo) {
        setPriceTo(String(imported.basePriceTo));
        profilePatch.basePriceTo = imported.basePriceTo;
        fields.push("מחיר מקסימלי");
      } else {
        setPriceTo("");
        profilePatch.basePriceTo = null;
      }

      if (Object.keys(profilePatch).length > 0) {
        await fetch("/api/supplier/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profilePatch),
        });
      }

      for (const photo of photos) {
        await fetch(`/api/supplier/photos/${photo.id}`, { method: "DELETE" }).catch(() => {});
      }
      setPhotos([]);

      const uploads =
        imported.imageUploads ??
        (imported.images ?? []).map((url, idx) => ({
          url,
          publicId: `import-${Date.now()}-${idx}`,
        }));
      let saved = 0;
      for (const [idx, item] of uploads.entries()) {
        if (saved >= 20) break;
        await persistPhoto(item.url, item.publicId, saved);
        saved += 1;
      }

      for (const pkg of packages) {
        if (!pkg.id) continue;
        await fetch(`/api/supplier/packages/${pkg.id}`, { method: "DELETE" }).catch(() => {});
      }

      let packageCount = 0;
      const importedPackages = imported.packages ?? [];
      const nextPackages: PackageState[] = [];
      for (const pkg of importedPackages.slice(0, 3)) {
        const resPkg = await fetch("/api/supplier/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nameHe: pkg.nameHe,
            price: pkg.price,
            hours: pkg.hours,
            includes: pkg.includes,
            isPopular: pkg.isPopular,
          }),
        });
        if (resPkg.ok) {
          const pkgJson = await resPkg.json();
          nextPackages.push({
            id: pkgJson.data?.id,
            name: pkg.nameHe,
            price: pkg.price,
            hours: pkg.hours ?? 0,
            includes: pkg.includes ?? [],
            isPopular: pkg.isPopular,
            includeInput: "",
          });
          packageCount += 1;
        }
      }
      if (packageCount > 0) {
        setPackages(nextPackages);
        fields.push("חבילות");
      } else {
        setPackages([]);
      }

      let warning: string | undefined;
      const stats = imported.stats;
      if (stats && stats.imagesFound > 0 && stats.imagesMirrored === 0) {
        warning = "נמצאו תמונות באתר אבל ההעלאה נכשלה. נסו שוב או הוסיפו תמונות ידנית.";
      } else if (
        stats &&
        stats.packagesFound === 0 &&
        stats.imagesFound < 3 &&
        !imported.basePriceFrom
      ) {
        warning =
          "נמצא מעט מידע בדף הזה. להצעת מחיר מלאה הדביקו קישור ישיר לדף הצעת מחיר / מחירון.";
      }

      setImportUrl("");
      setImportSummary({ fields, imageCount: saved, packageCount, warning });
      const seconds = stats ? Math.max(1, Math.round(stats.durationMs / 1000)) : null;
      setImportMsg(
        fields.length > 0 || saved > 0 || packageCount > 0
          ? `הפרופיל עודכן · ${saved} תמונות · ${packageCount} חבילות${seconds ? ` · ${seconds} שניות` : ""}`
          : "לא נמצאו פרטים חדשים באתר"
      );
      if (imported.followedUrl) {
        setImportStatus(`נמצא דף מחירון: ${imported.followedUrl}`);
      } else {
        setImportStatus(null);
      }
    } catch {
      setImportMsg("הייבוא נכשל, נסו שוב");
      setImportStatus(null);
    } finally {
      setImporting(false);
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

        {/* Landing import — first step in profile setup (מידע כללי) */}
        <div className="p-5 bg-primary-light/50 border-2 border-primary/30 rounded-2xl space-y-3">
          <div>
            <span className="inline-block text-xs font-bold text-primary mb-1">מידע כללי</span>
            <p className="text-base font-black text-text-main">ייבוא מדף נחיתה או אתר</p>
            <p className="text-sm text-text-muted mt-1">
              הדביקו קישור ונמלא אוטומטית שם, תיאור, מחירים, תמונות וחבילות.
              לתוצאה מלאה השתמשו בקישור ישיר לדף הצעת מחיר.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleImportLanding())
              }
              placeholder="https://..."
              dir="ltr"
              disabled={importing}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
            <Button
              onClick={handleImportLanding}
              isLoading={importing}
              disabled={!importUrl.trim()}
              size="sm"
            >
              ייבאו
            </Button>
          </div>
          {importStatus && (
            <p className="text-sm font-semibold text-primary-dark">{importStatus}</p>
          )}
          {importMsg && (
            <p className="text-sm font-semibold text-primary-dark">{importMsg}</p>
          )}
          {importSummary && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 space-y-1">
              <p className="font-bold">ייבוא הושלם</p>
              {importSummary.fields.length > 0 && (
                <p>עודכנו: {importSummary.fields.join(" · ")}</p>
              )}
              <p>תמונות: {importSummary.imageCount}</p>
              <p>חבילות: {importSummary.packageCount}</p>
              {importSummary.warning && (
                <p className="text-amber-700 font-semibold">{importSummary.warning}</p>
              )}
            </div>
          )}
        </div>

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
              <label className="text-sm font-semibold text-text-main">תחום עיסוק</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-3 text-base text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">בחרו תחום...</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

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
              שמרו שינויים
            </Button>
          </div>
        )}

        {/* ── Photos tab ── */}
        {activeTab === "photos" && (
          <div className="space-y-5">
            {cloudinaryEnabled() && (
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/40 rounded-2xl p-6 cursor-pointer hover:bg-primary-light/30 transition-colors",
                  (uploading || photos.length >= 20) && "opacity-60 pointer-events-none"
                )}
              >
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-sm font-bold text-text-main">
                  {uploading ? "מעלה..." : "העלו תמונות מהמכשיר"}
                </span>
                <span className="text-xs text-text-muted">עד 20 תמונות · JPG/PNG</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading || photos.length >= 20}
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            )}

            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhoto())}
                placeholder="https://... (הוספת תמונה בודדת)"
                dir="ltr"
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button
                onClick={addPhoto}
                disabled={!photoUrl.trim() || photos.length >= 20}
                size="sm"
              >
                <Plus className="h-4 w-4" />
                הוסיפו
              </Button>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`תמונה ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo)}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      aria-label="מחקו תמונה"
                    >
                      <X className="h-4 w-4" />
                    </button>
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
              שמרו שינויים
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
