import { useEffect, useState } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const categories = ["Çorba", "Ana Yemek", "Yan Yemek", "Ek Yemek"];
const categoryMapping = {
  Çorba: "corba",
  "Ana Yemek": "ana-yemek",
  "Yan Yemek": "yan-yemek",
  "Ek Yemek": "ek-yemek",
} as Record<string, string>;

const weekDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

const Results = () => {
  // Removed unused viewMode state
  const [currentDate, setCurrentDate] = useState(new Date());
  type AnalysisResult = {
    created_at: string;
    food_category: string;
    food_type: string;
    is_waste: boolean;
    image_url: string;
    photo_day?: string;
  };

  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/analysis-results/");
        const data = await res.json();
        setAnalysisResults(data);
      } catch {
        setAnalysisResults([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Haftanın başını bul (her zaman Pazartesi)
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });

  // Sabit gün ismi + tarih eşlemesiyle gün listesi oluştur
  const days = weekDays.map((gun, i) => ({
    label: gun,
    date: addDays(startDate, i),
  }));

  const handlePrevious = () => {
    setCurrentDate((prev) => addDays(prev, -7));
  };

  const handleNext = () => {
    setCurrentDate((prev) => addDays(prev, 7));
  };

  const getResultsForDayAndCategory = (dayLabel: string, category: string) => {
    const mappedCat = categoryMapping[category];
    // photo_day alanı ile kıyasla (büyük/küçük harfe duyarsız)
    return analysisResults.filter(
      (item) =>
        (item.photo_day || "").toLocaleLowerCase("tr").trim() ===
          dayLabel.toLocaleLowerCase("tr").trim() &&
        (item.food_category || "").toLocaleLowerCase("tr") === mappedCat
    );
  };

  const getSummaryForCategory = (category: string) => {
    const mappedCat = categoryMapping[category];
    const catResults = analysisResults.filter(
      (item) => (item.food_category || "").toLocaleLowerCase("tr") === mappedCat
    );
    const total = catResults.length;
    const wasteCount = catResults.filter(
      (item) => item.is_waste === true
    ).length;
    const avgWastePercent = "0";
    return { total, wasteCount, avgWastePercent };
  };

  // --- TABLOYA BASMA ---
  const renderDateCell = (gun: string, date: Date) => {
    return (
      <>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{gun}</span>
            <span className="text-sm text-gray-500">
              {format(date, "d MMMM", { locale: tr })}
            </span>
          </div>
        </td>
        {categories.map((category, idx) => {
          const dayData = getResultsForDayAndCategory(gun, category);
          return (
            <td key={idx} className="px-6 py-4">
              <div className="space-y-2">
                {dayData.length === 0 ? (
                  <span className="text-xs text-gray-400">Veri yok</span>
                ) : (
                  dayData.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      {item.is_waste ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-xs text-gray-500">
                        {item.food_type || "-"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </td>
          );
        })}
      </>
    );
  };

  // --- KATEGORİ ÖZETİ ---
  const getExtremeWastePerCategory = (
    category: string,
    type: "min" | "max"
  ) => {
    const mappedCat = categoryMapping[category];
    const catResults = analysisResults.filter(
      (item) => (item.food_category || "").toLocaleLowerCase("tr") === mappedCat
    );
    if (catResults.length === 0) return null;

    if (type === "min") {
      return (
        catResults.find((item) => item.is_waste === false) || catResults[0]
      );
    } else {
      return catResults.find((item) => item.is_waste === true) || catResults[0];
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Sonuçlar</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium">
              {format(currentDate, "MMMM yyyy", { locale: tr })}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Tarih
                </th>
                {categories.map((cat, i) => (
                  <th
                    key={i}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600"
                  >
                    {cat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(({ label, date }) => (
                <tr
                  key={label}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  {renderDateCell(label, date)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {categories.map((category) => {
          const summary = getSummaryForCategory(category);
          return (
            <div
              key={category}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                {category}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Toplam Analiz</span>
                  <span className="font-medium">{summary.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">İsraf Var Sayısı</span>
                  <span className="font-medium text-red-500">
                    {summary.wasteCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            En Az İsraf Edilen Yemekler
          </h3>
          <div className="space-y-4">
            {categories.map((category) => {
              const item = getExtremeWastePerCategory(category, "min");
              return (
                <div
                  key={category}
                  className="flex justify-between items-center"
                >
                  <div className="flex justify-start items-center space-x-2">
                    <span className="text-gray-600 font-semibold">
                      {category}:
                    </span>
                    {item ? (
                      <span className="text-gray-600">
                        {item.food_type || "-"}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Veri yok</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            En Çok İsraf Edilen Yemekler
          </h3>
          <div className="space-y-4">
            {categories.map((category) => {
              const item = getExtremeWastePerCategory(category, "max");
              return (
                <div
                  key={category}
                  className="flex justify-between items-center"
                >
                  <div className="flex justify-start items-center space-x-2">
                    <span className="text-gray-600 font-semibold">
                      {category}:
                    </span>
                    {item ? (
                      <span className="text-gray-600">
                        {item.food_type || "-"}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Veri yok</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-600 text-lg">
          Yükleniyor...
        </div>
      )}
    </div>
  );
};

export default Results;
