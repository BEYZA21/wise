import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { API_URL } from "../config";
// veya '../config.js'

const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

type Summary = {
  total: number;
  waste: number;
  noWaste: number;
  percent: number;
};

const Dashboard: React.FC = () => {
  // Menü yükleme
  const [menuUploaded, setMenuUploaded] = useState<boolean>(false);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);

  // Fotoğraf yükleme
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gün seçimi
  const [selectedDay, setSelectedDay] = useState<string>(days[0]);

  // Genel özet
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    waste: 0,
    noWaste: 0,
    percent: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  // Günlük analiz sonuçları
  type AnalysisResult = {
    photo_day: string;
    is_waste: boolean;
    // Add other fields as needed based on your API response
  };

  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);

  // GENEL ÖZETİ VE TÜM ANALİZLERİ ÇEK
  const fetchDashboardSummary = async () => {
    setLoadingSummary(true);
    // Genel özet
    const res = await fetch(`http://${API_URL}/api/dashboard-summary/`);
    const data = await res.json();
    setSummary(data);

    // Günlük analizler
    const res2 = await fetch(`http://${API_URL}/api/analysis-results/`);
    const data2 = await res2.json();
    setAnalysisResults(data2);

    setLoadingSummary(false);
  };

  useEffect(() => {
    fetchDashboardSummary();
    // eslint-disable-next-line
  }, [menuUploaded]);

  // MENÜ YÜKLEME
  const handleMenuUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!menuFile) return;
    setMenuLoading(true);
    const formData = new FormData();
    formData.append("file", menuFile);

    const res = await fetch(`http://${API_URL}/api/weekly-menu-upload/`, {
      method: "POST",
      body: formData,
    });
    setMenuLoading(false);
    if (res.ok) setMenuUploaded(true);
  };

  // FOTOĞRAF SEÇME
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploadedImages(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // FOTOĞRAF KALDIRMA
  const removeImage = (idx: number) => {
    setUploadedImages((imgs) => imgs.filter((_, i) => i !== idx));
  };

  // FOTOĞRAF YÜKLEME (gün seçimi ile!)
  const handlePhotoUpload = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);
    if (uploadedImages.length < 1) {
      setError("Lütfen en az bir fotoğraf seçin.");
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    uploadedImages.forEach((file) => formData.append("photos", file));
    formData.append("day", selectedDay);

    // 1. Fotoğrafları yükle
    const res = await fetch(`http://${API_URL}/api/upload/`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      setIsUploading(false);
      setError("Yükleme hatası!");
      return;
    }
    const data = await res.json();
    const uploadedUrls: string[] = data.uploaded_urls || [];

    // 2. Yüklenen her fotoğraf için analiz isteği at
    for (const url of uploadedUrls) {
      await fetch(`http://${API_URL}/api/analysis/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: url,
          photo_day: selectedDay, // GÜN BİLGİSİ BURADA DA GİDİYOR!
        }),
      });
    }

    await fetchDashboardSummary(); // özet güncelle
    setUploadedImages([]);
    setIsUploading(false);
  };

  // --- GÜNLÜK ANALİZ ÖZETİ ---
  // Seçilen günün analizlerini filtrele
  const dailyResults = analysisResults.filter(
    (r) =>
      (r.photo_day || "").trim().toLowerCase() ===
      selectedDay.trim().toLowerCase()
  );
  const dailyTotal = dailyResults.length;
  const dailyWaste = dailyResults.filter((r) => r.is_waste === true).length;
  const dailyNoWaste = dailyResults.filter((r) => r.is_waste === false).length;
  const dailyPercent =
    dailyTotal > 0 ? Math.round((dailyWaste / dailyTotal) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* MENÜ YÜKLEME */}
      <div className="mb-8">
        {menuUploaded ? (
          <div className="bg-green-50 border border-green-400 rounded-lg p-4 flex items-center justify-center min-h-[100px]">
            <span className="text-green-700 font-semibold">
              Menü başarıyla yüklendi!
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleMenuUpload}
            className="bg-gray-50 border rounded-lg p-4 flex flex-col items-center min-h-[100px]"
          >
            <label className="text-sm font-medium mb-1">
              Menü Yükle (.txt veya .csv)
            </label>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={(e) =>
                setMenuFile(e.target.files ? e.target.files[0] : null)
              }
              className="mb-2"
              required
            />
            <button
              type="submit"
              disabled={menuLoading || !menuFile}
              className="bg-[#7BC47F] text-white px-3 py-1 rounded hover:bg-[#6AB36E] text-sm"
            >
              {menuLoading ? "Yükleniyor..." : "Menüyü Kaydet"}
            </button>
          </form>
        )}
      </div>

      {/* FOTOĞRAF YÜKLEME */}
      <div className="bg-white rounded-xl shadow-lg p-6 border flex flex-col gap-6">
        {/* GÜN SEÇİMİ */}
        <div className="flex gap-4 items-center">
          <span className="font-semibold text-gray-700">Gün Seç:</span>
          <select
            className="border rounded px-2 py-1"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* FOTOĞRAF INPUT ve GÖRÜNTÜLEME */}
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

        {/* GENEL VE GÜNLÜK ÖZET KUTULARI */}
        <div className="mt-2 flex flex-col md:flex-row gap-4">
          {/* GENEL ÖZET */}
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center">
            {loadingSummary ? (
              <span className="text-gray-400 flex gap-2 items-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Yükleniyor...
              </span>
            ) : summary.total > 0 ? (
              <>
                <span className="font-semibold text-lg text-blue-800">
                  Genel İsraf Oranı
                </span>
                <span className="text-4xl font-bold text-green-700">
                  {summary.percent}%
                </span>

                <div className="flex flex-col text-sm gap-1 mt-2">
                  <span>
                    Toplam analiz: <b>{summary.total}</b>
                  </span>
                  <span>
                    İsraf var: <b className="text-red-600">{summary.waste}</b>
                  </span>
                  <span>
                    İsraf yok:{" "}
                    <b className="text-green-600">{summary.noWaste}</b>
                  </span>
                </div>
              </>
            ) : (
              <span className="text-gray-400">Henüz analiz yapılmadı</span>
            )}
          </div>
          {/* GÜNLÜK ÖZET */}
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center">
            {loadingSummary ? (
              <span className="text-gray-400 flex gap-2 items-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Yükleniyor...
              </span>
            ) : dailyTotal > 0 ? (
              <>
                <span className="font-semibold text-lg text-blue-800">
                  {selectedDay} Analiz Özeti
                </span>
                <span className="text-4xl font-bold text-green-700">
                  {dailyPercent}%
                </span>

                <div className="flex flex-col text-sm gap-1 mt-2">
                  <span>
                    Toplam analiz: <b>{dailyTotal}</b>
                  </span>
                  <span>
                    İsraf var: <b className="text-red-600">{dailyWaste}</b>
                  </span>
                  <span>
                    İsraf yok: <b className="text-green-600">{dailyNoWaste}</b>
                  </span>
                </div>
              </>
            ) : (
              <span className="text-gray-400">
                {selectedDay} için henüz analiz yapılmadı
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
