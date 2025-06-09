import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { API_URL } from "../config";

registerLocale("tr", tr);

type AnalysisResult = {
  analysis_date: string;
  food_category: string;
  food_type: string;
  is_waste: boolean;
};

const categories = ["Çorba", "Ana Yemek", "Yan Yemek", "Ek Yemek"];
const categoryMapping = {
  Çorba: "corba",
  "Ana Yemek": "ana-yemek",
  "Yan Yemek": "yan-yemek",
  "Ek Yemek": "ek-yemek",
} as Record<string, string>;

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "uploaded" | "analyzing"
  >("idle");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analysis-results/`);
      const data = await res.json();
      setAnalysisResults(data);
    } catch {
      setAnalysisResults([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploadedImages(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setUploadedImages((imgs) => imgs.filter((_, i) => i !== idx));
  };

  const handlePhotoUpload = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);

    if (uploadedImages.length < 1) {
      setError("Lütfen en az bir fotoğraf seçin.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");

    try {
      const formData = new FormData();
      uploadedImages.forEach((file) => formData.append("photos", file));
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      formData.append("date", formattedDate);

      const res = await fetch(`${API_URL}/api/upload/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Yükleme hatası!");

      setUploadStatus("uploaded");

      const data = await res.json();
      const uploadedUrls: string[] = data.uploaded_urls || [];

      setUploadStatus("analyzing");

      await Promise.all(
        uploadedUrls.map((url) =>
          fetch(`${API_URL}/api/analysis/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: url,
              analysis_date: formattedDate,
            }),
          })
        )
      );

      setUploadStatus("idle");
      await fetchData();
      setUploadedImages([]);
    } catch (err: unknown) {
      console.error(err);
      setError("Fotoğraflar yüklenirken veya analiz edilirken hata oluştu.");
      setUploadStatus("idle");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredResults = analysisResults.filter(
    (r) => r.analysis_date === format(selectedDate, "yyyy-MM-dd")
  );

  const getResultsByCategory = (category: string) => {
    const mapped = categoryMapping[category];
    return filteredResults.filter(
      (r) => (r.food_category || "").toLocaleLowerCase("tr") === mapped
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border flex flex-col gap-6">
        <div className="mb-4">
          <label className="font-semibold text-gray-700 mb-2 block">
            Tarih Seç:
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date as Date)}
            locale="tr"
            dateFormat="dd MMMM yyyy"
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          id="photoInput"
        />

        <div className="flex flex-wrap gap-2 mb-2">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={URL.createObjectURL(img)}
                className="w-24 h-24 object-cover rounded shadow"
                alt="preview"
              />
              <button
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                onClick={() => removeImage(idx)}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
            type="button"
          >
            <Upload className="w-8 h-8 text-gray-400" />
          </button>
        </div>

        <button
          disabled={isUploading || uploadedImages.length === 0}
          onClick={handlePhotoUpload}
          className="bg-[#7BC47F] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#6AB36E] flex items-center gap-2 justify-center"
          type="button"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            "Yükle ve Analiz Et"
          )}
        </button>

        {error && <div className="text-red-500 font-medium mt-2">{error}</div>}
        {uploadStatus === "uploaded" && (
          <div className="text-green-600 mt-2 font-medium">
            📸 Fotoğraflar yüklendi.
          </div>
        )}

        {uploadStatus === "analyzing" && (
          <div className="flex items-center gap-2 text-blue-600 mt-2 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analiz ediliyor…
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const data = getResultsByCategory(category);
            const waste = data.filter((d) => d.is_waste).length;
            const noWaste = data.length - waste;
            const percent =
              data.length > 0 ? Math.round((waste / data.length) * 100) : 0;

            return (
              <div
                key={category}
                className="bg-gray-50 border p-4 rounded-lg shadow"
              >
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  {category}
                </h4>
                <p className="text-sm">
                  Toplam: <b>{data.length}</b>
                </p>
                <p className="text-sm text-red-600">
                  İsraf Var: <b>{waste}</b>
                </p>
                <p className="text-sm text-green-600">
                  İsraf Yok: <b>{noWaste}</b>
                </p>
                <div className="mt-2 text-sm text-gray-700">
                  İsraf Oranı: <b>{percent}%</b>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-600 text-lg">
            Yükleniyor...
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
