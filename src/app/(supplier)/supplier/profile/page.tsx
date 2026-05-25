"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, X, Check, CheckCircle, Upload } from "lucide-react";
import SupplierDashboardLayout from "@/components/common/SupplierDashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MOCK_SUPPLIERS } from "@/lib/mock-data";
import { ISRAELI_CITIES, formatPrice, cn } from "@/lib/utils";

const SUPPLIER = MOCK_SUPPLIERS[0];

const SERVICE_AREAS = [
  "גוש דן", "תל אביב", "ירושלים", "חיפה",
  "הצפון", "הדרום", "השרון", "שפלה", "אילת", "מרכז",
];

export default function SupplierProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "photos" | "packages">("info");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Info tab state
  const [name, setName] = useState(SUPPLIER.name);
  const [city, setCity] = useState(SUPPLIER.city);
  const [bio, setBio] = useState(SUPPLIER.bio);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(SUPPLIER.areas);
  const [priceFrom, setPriceFrom] = useState(SUPPLIER.priceFrom.toString());
  const [priceTo, setPriceTo] = useState(SUPPLIER.priceTo.toString());

  // Photos tab state
  const [photos, setPhotos] = useState<string[]>(SUPPLIER.portfolio);
  const [profilePhotoIdx, setProfilePhotoIdx] = useState(0);
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  // Packages tab state
  const [packages, setPackages] = useState(
    SUPPLIER.packages.map((p) => ({
      ...p,
      includeInput: "",
    }))
  );

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSaveInfo = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addPhoto = () => {
    const url = photoUrlInput.trim();
    if (url && photos.length < 20) {
      setPhotos((prev) => [...prev, url]);
      setPhotoUrlInput("");
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    if (profilePhotoIdx >= idx) {
      setProfilePhotoIdx(Math.max(0, profilePhotoIdx - 1));
    }
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "info", label: "מידע כללי" },
    { id: "photos", label: "תמונות" },
    { id: "packages", label: "חבילות" },
  ];

  return (
    <SupplierDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-text-main">
            הפרופיל שלי
          </h1>
          <p className="text-text-muted text-sm mt-1">
            עדכני את הפרטים שמוצגים לכלות
          </p>
        </div>

        {/* Success */}
        {saveSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold">
            <CheckCircle className="h-5 w-5" />
            השינויים נשמרו בהצלחה!
          </div>
        )}

        {/* Tabs */}
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
            <Input
              label="שם מלא"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-text-main">עיר</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-3 text-base text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ISRAELI_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Service areas */}
            <div>
              <label className="text-sm font-semibold text-text-main block mb-2">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-text-main">
                  תיאור עצמי
                </label>
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

            {/* Price range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-main block mb-1.5">
                  מחיר מינימלי (₪)
                </label>
                <input
                  type="number"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-border px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-main block mb-1.5">
                  מחיר מקסימלי (₪)
                </label>
                <input
                  type="number"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-border px-4 py-3 text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              isLoading={isLoading}
              onClick={handleSaveInfo}
            >
              שמרי שינויים
            </Button>
          </div>
        )}

        {/* ── Photos tab ── */}
        {activeTab === "photos" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-border p-6">
              <p className="text-sm font-semibold text-text-main mb-3">
                הוסיפי תמונה (קישור URL)
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhoto())}
                  placeholder="https://..."
                  dir="ltr"
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button onClick={addPhoto} disabled={!photoUrlInput.trim() || photos.length >= 20} size="sm">
                  <Plus className="h-4 w-4" />
                  הוסיפי
                </Button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                {photos.length}/20 תמונות · לחצי על תמונה לבחירתה כתמונת פרופיל
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden cursor-pointer group",
                    idx === profilePhotoIdx && "ring-4 ring-primary"
                  )}
                  onClick={() => setProfilePhotoIdx(idx)}
                >
                  <Image
                    src={url}
                    alt={`תמונה ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    {idx === profilePhotoIdx && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                        תמונת פרופיל
                      </span>
                    )}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                    className="absolute top-2 left-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add more placeholder */}
              {photos.length < 20 && (
                <div className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">הוסיפי</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Packages tab ── */}
        {activeTab === "packages" && (
          <div className="space-y-5">
            {packages.map((pkg, pkgIdx) => (
              <div
                key={pkg.id}
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
                    <label className="text-sm font-semibold text-text-main block mb-1.5">
                      מחיר (₪)
                    </label>
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
                    <label className="text-sm font-semibold text-text-main block mb-1.5">
                      שעות
                    </label>
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

                {/* Includes */}
                <div>
                  <label className="text-sm font-semibold text-text-main block mb-2">
                    כולל
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pkg.includes.map((item, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 bg-primary-light text-primary-dark text-sm px-3 py-1 rounded-full"
                      >
                        {item}
                        <button
                          onClick={() => {
                            const updated = [...packages];
                            updated[pkgIdx].includes = updated[pkgIdx].includes.filter((_, ii) => ii !== i);
                            setPackages(updated);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="הוסיפי פריט..."
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

            <Button
              fullWidth
              size="lg"
              isLoading={isLoading}
              onClick={async () => {
                setIsLoading(true);
                await new Promise((r) => setTimeout(r, 800));
                setIsLoading(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
              }}
            >
              שמרי שינויים
            </Button>
          </div>
        )}
      </div>
    </SupplierDashboardLayout>
  );
}
