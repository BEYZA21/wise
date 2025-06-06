import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";

// Backend'den gelecek analiz sonuçları için örnek tip
interface AnalysisResult {
  food_category: string;
  food_type: string;
  is_waste: boolean;
}

type MenuDay = {
  soup: string;
  main: string;
  side: string;
  extra: string;
};

const displayNames: Record<string, string> = {
  // Çorbalar
  "mercimek-corbasi": "Mercimek Çorbası",
  "sehriye-corbasi": "Şehriye Çorbası",
  "tarhana-corbasi": "Tarhana Çorbası",
  "yayla-corbasi": "Yayla Çorbası",
  // Ana yemekler
  barbunya: "Barbunya",
  bezelye: "Bezelye",
  "et-sote": "Et Sote",
  kabak: "Kabak",
  "kuru-fasulye": "Kuru Fasulye",
  "sebzeli-tavuk": "Sebzeli Tavuk",
  // Yan yemekler
  "bulgur-pilavi": "Bulgur Pilavı",
  "burgu-makarna": "Burgu Makarna",
  eriste: "Erişte",
  fettucini: "Fettucini",
  "pirinc-pilavi": "Pirinç Pilavı",
  spagetti: "Spagetti",
  // Ek yemekler
  "havuc-salatasi": "Havuç Salatası",
  "mor-yogurt": "Mor Yoğurt",
  yogurt: "Yoğurt",
};

const Menu: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [, setLoading] = useState(false);
  const [menu, setMenu] = useState<MenuDay | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Analiz sonuçlarını backend'den çek
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/analysis-results/");
        const data = await res.json();
        setAnalysisResults(data);
      } catch {
        setError("Veriler alınamadı.");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Menü oluştur (her kategori için en az israf edilen tür)
  const handleGenerateMenu = () => {
    if (analysisResults.length === 0) {
      setError("Menü oluşturmak için analiz verisi yok.");
      return;
    }

    // Her kategori için türlerin israf oranlarını hesapla
    function getBestType(food_category: string) {
      const results = analysisResults.filter(
        (r) => r.food_category === food_category
      );
      if (results.length === 0) return "-";
      const typeStats: Record<string, { waste: number; total: number }> = {};
      results.forEach((r) => {
        if (!typeStats[r.food_type])
          typeStats[r.food_type] = { waste: 0, total: 0 };
        if (r.is_waste) typeStats[r.food_type].waste += 1;
        typeStats[r.food_type].total += 1;
      });
      // İsraf oranı en düşük olanı bul
      let best = null;
      let minRate = Infinity;
      for (const [type, stats] of Object.entries(typeStats)) {
        const rate =
          stats.total > 0
            ? stats.waste / stats.total
            : Number.POSITIVE_INFINITY;
        if (rate < minRate) {
          best = type;
          minRate = rate;
        }
      }
      return best && displayNames[best] ? displayNames[best] : best || "-";
    }

    const bestMenu: MenuDay = {
      soup: getBestType("corba"),
      main: getBestType("ana-yemek"),
      side: getBestType("yan-yemek"),
      extra: getBestType("ek-yemek"),
    };

    setMenu(bestMenu);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Menü Oluştur</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <button
              onClick={handleGenerateMenu}
              className="px-6 py-2 bg-[#7BC47F] text-white rounded-lg hover:bg-[#6AB36E] transition-colors"
            >
              Günlük En Az İsraf Edilen Menü Oluştur
            </button>
          </div>
          {error && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mt-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <div className="ml-3 text-sm text-amber-700">{error}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {menu && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <span className="font-semibold text-gray-700">
              Önerilen Günlük Menü
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Çorba
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Ana Yemek
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Yan Yemek
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Ek Yemek
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">{menu.soup}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{menu.main}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{menu.side}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {menu.extra}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Menu;
