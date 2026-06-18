"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, User, Plus, X, Check, ChevronRight, Upload } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "@/components/ui/OtpInput";
import StepProgress from "@/components/ui/StepProgress";
import { validateIsraeliPhone, ISRAELI_CITIES, cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/categories";
import { uploadToCloudinary, cloudinaryEnabled } from "@/lib/cloudinary";

// Categories offered when joining — legacy categories (FLORIST, BRIDAL_SUITE) are excluded.
const JOIN_CATEGORIES = [
  "PHOTOGRAPHER",
  "VIDEOGRAPHER",
  "DJ",
  "CATERING",
  "VENUE",
  "HAIR_STYLIST",
  "MAKEUP_ARTIST",
  "PHOTO_BOOTH",
  "EVENT_PRODUCER",
] as const;

const STEPS = [
  { label: "פרטי קשר" },
  { label: "פרופיל" },
  { label: "תמונות" },
  { label: "חבילות" },
];

const SERVICE_AREAS = [
  "גוש דן",
  "תל אביב",
  "ירושלים",
  "חיפה",
  "הצפון",
  "הדרום",
  "השרון",
  "שפלה",
  "אילת",
  "מרכז",
];

interface Package {
  id: string;
  name: string;
  price: string;
  hours: string;
  includes: string[];
  isPopular: boolean;
}

const step1Schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  phone: z
    .string()
    .refine((v) => validateIsraeliPhone(v), "מספר חייב להתחיל ב-05 ולהכיל 10 ספרות"),
  email: z.string().email("כתובת מייל לא תקינה").optional().or(z.literal("")),
});

type Step1Data = z.infer<typeof step1Schema>;

export default function SupplierJoinPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 2 state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [step2Attempted, setStep2Attempted] = useState(false);

  // Step 3 state
  const [photoUrl, setPhotoUrl] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Landing-page import
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Direct upload (Cloudinary)
  const [uploading, setUploading] = useState(false);
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (photos.length >= 20) break;
        try {
          const { url } = await uploadToCloudinary(file);
          setPhotos((prev) => (prev.length < 20 ? [...prev, url] : prev));
        } catch {
          /* skip a failed file */
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImportLanding = async () => {
    if (!importUrl.trim() || importing) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/supplier/import-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setImportMsg(json.error ?? "הייבוא נכשל, נסו כתובת אחרת");
        return;
      }
      const imgs: string[] = json.data?.images ?? [];
      setPhotos((prev) => {
        const merged = [...prev];
        for (const u of imgs) {
          if (merged.length >= 20) break;
          if (!merged.includes(u)) merged.push(u);
        }
        return merged;
      });
      const found = json.data?.name ? ` · נמצא: ${json.data.name}` : "";
      setImportMsg(
        imgs.length > 0
          ? `נוספו ${imgs.length} תמונות מהאתר${found}`
          : `לא נמצאו תמונות באתר${found}`
      );
    } catch {
      setImportMsg("הייבוא נכשל, נסו שוב");
    } finally {
      setImporting(false);
    }
  };

  // Step 4 state
  const [packages, setPackages] = useState<Package[]>([
    { id: "1", name: "", price: "", hours: "", includes: [], isPopular: false },
  ]);
  const [includeInput, setIncludeInput] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  });

  const onStep1Submit = async (data: Step1Data) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/supplier/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error ?? "שגיאה בשליחת קוד");
        return;
      }
      setStage("otp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = async (value: string) => {
    setOtp(value);
    setOtpError("");
    if (value.length === 6) {
      setIsLoading(true);
      try {
        const { name, phone, email } = getValues();
        const res = await fetch("/api/supplier/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: value, name, email }),
        });
        const json = await res.json();
        if (!res.ok) {
          setOtpError(json.error ?? "קוד שגוי. נסו שנית.");
          setOtp("");
          return;
        }
        setStep(2);
        setStage("form");
        setOtp("");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const addPhoto = () => {
    const url = photoUrl.trim();
    if (url && photos.length < 20) {
      setPhotos((prev) => [...prev, url]);
      setPhotoUrl("");
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPackage = () => {
    if (packages.length < 3) {
      setPackages((prev) => [
        ...prev,
        { id: Date.now().toString(), name: "", price: "", hours: "", includes: [], isPopular: false },
      ]);
    }
  };

  const updatePackage = (id: string, key: keyof Package, value: string | boolean | string[]) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  };

  const addInclude = (pkgId: string) => {
    const text = (includeInput[pkgId] || "").trim();
    if (text) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkgId ? { ...p, includes: [...p.includes, text] } : p
        )
      );
      setIncludeInput((prev) => ({ ...prev, [pkgId]: "" }));
    }
  };

  const removeInclude = (pkgId: string, idx: number) => {
    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkgId
          ? { ...p, includes: p.includes.filter((_, i) => i !== idx) }
          : p
      )
    );
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/supplier/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory || undefined,
          city: selectedCity || undefined,
          serviceAreas: selectedAreas.length > 0 ? selectedAreas : undefined,
          bioHe: bio || undefined,
        }),
      });

      for (const pkg of packages) {
        if (pkg.name && pkg.price) {
          await fetch("/api/supplier/packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nameHe: pkg.name,
              price: Number(pkg.price),
              hours: Number(pkg.hours) || undefined,
              includes: pkg.includes,
              isPopular: pkg.isPopular,
            }),
          });
        }
      }

      for (const [idx, url] of photos.entries()) {
        await fetch("/api/supplier/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            publicId: `join-${Date.now()}-${idx}`,
            type: idx === 0 ? "COVER" : idx === 1 ? "PROFILE" : "PORTFOLIO",
            sortOrder: idx,
          }),
        });
      }

      router.push("/supplier/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-black text-primary">
            פנוי
          </Link>
          <p className="text-text-muted text-sm mt-1">
            הצטרפו לקהילת הספקים
          </p>
        </div>

        {/* Step progress */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <StepProgress steps={STEPS} currentStep={step} />
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* ── Step 1: Contact ── */}
          {step === 1 && stage === "form" && (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  פרטי קשר 👋
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  נתחיל עם הפרטים הבסיסיים
                </p>
              </div>
              <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-4">
                <Input
                  label="שם מלא"
                  placeholder="שם מלא"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="מספר טלפון"
                  placeholder="05X-XXXXXXX"
                  type="text"
                  inputMode="tel"
                  ltr
                  className="pl-10"
                  helperText="ישלח קוד אימות ב-SMS"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
                <Input
                  label="מייל (אופציונלי)"
                  placeholder="tzalemet@gmail.com"
                  type="email"
                  ltr
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  המשיכו
                </Button>
              </form>
            </>
          )}

          {step === 1 && stage === "otp" && (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  אימות מספר טלפון 📱
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  שלחנו קוד למספר{" "}
                  <span dir="ltr" className="font-semibold">
                    {getValues("phone")}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 py-4">
                <OtpInput
                  value={otp}
                  onChange={handleOtpChange}
                  error={otpError}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => { setStage("form"); setOtp(""); }}
              >
                שנו מספר טלפון
              </Button>
            </>
          )}

          {/* ── Step 2: Profile ── */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  הפרופיל שלי 📸
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  ספרו לזוגות מי אתם
                </p>
              </div>

              <div className="space-y-5">
                {/* Category */}
                <div>
                  <label className="text-sm font-bold text-text-main block mb-2">
                    תחום עיסוק
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {JOIN_CATEGORIES.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedCategory(id)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border-2 text-right text-sm font-semibold transition-all",
                          selectedCategory === id
                            ? "border-primary bg-primary text-white"
                            : "border-border text-text-main hover:border-primary/40"
                        )}
                      >
                        {CATEGORY_LABELS[id]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="text-sm font-bold text-text-main block mb-2">
                    עיר מגורים
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full rounded-xl border border-border px-4 py-3 text-base text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">בחרו עיר...</option>
                    {ISRAELI_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Service areas */}
                <div>
                  <label className="text-sm font-bold text-text-main block mb-2">
                    אזורי שירות
                  </label>
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

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-text-main">
                      קצת עליי
                    </label>
                    <span className={cn("text-xs font-medium", bio.length > 450 ? "text-red-500" : "text-text-muted")}>
                      {bio.length}/500
                    </span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => e.target.value.length <= 500 && setBio(e.target.value)}
                    placeholder="ספרו לזוגות מי אתם, מה הסגנון שלכם, וכמה ניסיון יש לכם..."
                    rows={5}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-base text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 resize-none",
                      step2Attempted && bio.length < 20
                        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                        : "border-border focus:border-primary focus:ring-primary/20"
                    )}
                  />
                  {step2Attempted && bio.length < 20 && (
                    <p className="text-red-500 text-xs mt-1 font-medium">
                      {bio.length === 0
                        ? "חובה להוסיף תיאור עצמי"
                        : `התיאור קצר מדי — צריך לפחות 20 תווים (חסרים ${20 - bio.length})`}
                    </p>
                  )}
                </div>
              </div>

              {step2Attempted && !selectedCity && (
                <p className="text-red-500 text-xs -mt-3 font-medium">חובה לבחור עיר</p>
              )}
              {step2Attempted && selectedAreas.length === 0 && (
                <p className="text-red-500 text-xs -mt-3 font-medium">חובה לבחור לפחות אזור שירות אחד</p>
              )}

              {step2Attempted && !selectedCategory && (
                <p className="text-red-500 text-xs -mt-3 font-medium">חובה לבחור תחום עיסוק</p>
              )}
              <Button
                fullWidth
                size="lg"
                onClick={() => {
                  setStep2Attempted(true);
                  if (selectedCategory && selectedCity && selectedAreas.length > 0 && bio.length >= 20) {
                    setStep(3);
                  }
                }}
              >
                המשיכו
              </Button>
            </>
          )}

          {/* ── Step 3: Photos ── */}
          {step === 3 && (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  תמונות 🖼
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  הוסיפו תמונות מתיק העבודות שלכם
                </p>
              </div>

              {/* Direct upload (when Cloudinary is configured) */}
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

              {/* Import from existing website / landing page */}
              <div className="p-4 bg-primary-light/40 border border-primary/30 rounded-xl space-y-2">
                <p className="text-sm font-bold text-text-main">
                  יש לכם אתר או דף נחיתה? ייבאו ממנו תמונות ✨
                </p>
                <p className="text-xs text-text-muted">
                  הדביקו קישור ונמשוך אוטומטית את התמונות והפרטים מהאתר שלכם.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleImportLanding())
                    }
                    placeholder="https://your-site.com"
                    dir="ltr"
                    className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleImportLanding}
                    isLoading={importing}
                    disabled={!importUrl.trim() || photos.length >= 20}
                    size="sm"
                  >
                    ייבאו
                  </Button>
                </div>
                {importMsg && (
                  <p className="text-xs font-semibold text-primary-dark">{importMsg}</p>
                )}
              </div>

              {/* Manual URL input */}
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

              {/* Photo grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`תמונה ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder-supplier.svg")}
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 left-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && (
                <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center text-text-muted">
                  <p className="text-4xl mb-2">📷</p>
                  <p className="font-medium">הוסיפו תמונות מתיק העבודות</p>
                  <p className="text-sm mt-1">עד 20 תמונות</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button fullWidth size="lg" onClick={() => setStep(4)}>
                  המשיכו
                </Button>
              </div>

              <button
                onClick={() => setStep(4)}
                className="w-full text-center text-sm text-text-muted hover:text-primary transition-colors"
              >
                דלגו לעת עתה
              </button>
            </>
          )}

          {/* ── Step 4: Packages ── */}
          {step === 4 && (
            <>
              <div>
                <h1 className="text-2xl font-black text-text-main">
                  חבילות ומחירים 💰
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  הגדירו עד 3 חבילות
                </p>
              </div>

              <div className="space-y-6">
                {packages.map((pkg, pkgIdx) => (
                  <div
                    key={pkg.id}
                    className="border-2 border-border rounded-2xl p-5 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-muted uppercase tracking-wide">
                        חבילה {pkgIdx + 1}
                      </span>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pkg.isPopular}
                          onChange={(e) => updatePackage(pkg.id, "isPopular", e.target.checked)}
                          className="rounded accent-primary"
                        />
                        הכי פופולרי
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Input
                          label="שם החבילה"
                          placeholder="למשל: חבילת פרימיום"
                          value={pkg.name}
                          onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-text-main block mb-1.5">
                          מחיר (₪)
                        </label>
                        <input
                          type="number"
                          placeholder="5000"
                          value={pkg.price}
                          onChange={(e) => updatePackage(pkg.id, "price", e.target.value)}
                          dir="ltr"
                          className="w-full rounded-xl border border-border px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-text-main block mb-1.5">
                          שעות צילום
                        </label>
                        <input
                          type="number"
                          placeholder="8"
                          value={pkg.hours}
                          onChange={(e) => updatePackage(pkg.id, "hours", e.target.value)}
                          dir="ltr"
                          className="w-full rounded-xl border border-border px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Includes */}
                    <div>
                      <label className="text-sm font-semibold text-text-main block mb-2">
                        כולל
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pkg.includes.map((item, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 bg-primary-light text-primary-dark text-sm px-3 py-1 rounded-full font-medium"
                          >
                            {item}
                            <button onClick={() => removeInclude(pkg.id, i)}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="למשל: 500+ תמונות ערוכות"
                          value={includeInput[pkg.id] || ""}
                          onChange={(e) =>
                            setIncludeInput((prev) => ({ ...prev, [pkg.id]: e.target.value }))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addInclude(pkg.id))
                          }
                          className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => addInclude(pkg.id)}
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
                    onClick={addPackage}
                    className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-2xl text-text-muted hover:border-primary hover:text-primary transition-colors font-medium text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    הוסיפו חבילה
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(3)} className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  onClick={handleFinalSubmit}
                >
                  שלחו לאישור 🎉
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
