import React, { useEffect, useState } from "react";
import { API_URL } from "../config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";

const weekDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
const foodCategories = [
  { key: "corba", title: "Çorba Türleri" },
  { key: "ana-yemek", title: "Ana Yemek Türleri" },
  { key: "yan-yemek", title: "Yan Yemek Türleri" },
  { key: "ek-yemek", title: "Ek Yemek Türleri" },
];

const displayNames: Record<string, string> = {
  // Çorbalar
  "mercimek-corbasi": "Mercimek",
  "sehriye-corbasi": "Şehriye",
  "tarhana-corbasi": "Tarhana",
  "yayla-corbasi": "Yayla",
  // Ana yemekler
  barbunya: "Barbunya",

  bezelye: "Bezelye",
  "et-sote": "Et Sote",
  kabak: "Kabak",
  " kasarli-kofte": "Kaşarlı Köfte",
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

interface AnalysisResult {
  created_at: string;
  is_waste: boolean;
  food_category: string;
  food_type: string;
  photo_day?: string;
}

const Statistics = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://${API_URL}/api/analysis-results/`);
        const data = await res.json();
        setAnalysisResults(data);
      } catch {
        setAnalysisResults([]);
      }
    };
    fetchData();
  }, []);

  // Haftalık dağılım: photo_day ile!
  const getWeeklyStats = () => {
    return weekDays.map((gun) => {
      const dayResults = analysisResults.filter(
        (r) => (r.photo_day || "").toLowerCase() === gun.toLowerCase()
      );
      const waste = dayResults.filter((r) => r.is_waste).length;
      const noWaste = dayResults.filter((r) => !r.is_waste).length;
      return {
        name: gun,
        waste,
        noWaste,
      };
    });
  };

  // Aylık toplam (photo_day'e bakmadan ayda kaç israf, kaç normal)
  const getMonthlyStats = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthlyResults = analysisResults.filter((r) => {
      const d = new Date(r.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const waste = monthlyResults.filter((r) => r.is_waste).length;
    const noWaste = monthlyResults.filter((r) => !r.is_waste).length;
    return [
      { name: "İsraf Var", value: waste },
      { name: "İsraf Yok", value: noWaste },
    ];
  };

  // Kategori bazında: türlerin israf oranı
  function getFoodTypeStats(food_category: string) {
    const typeMap: Record<string, { waste: number; total: number }> = {};
    analysisResults
      .filter((r) => r.food_category === food_category)
      .forEach((r) => {
        if (!typeMap[r.food_type])
          typeMap[r.food_type] = { waste: 0, total: 0 };
        if (r.is_waste) typeMap[r.food_type].waste += 1;
        typeMap[r.food_type].total += 1;
      });
    return Object.entries(typeMap).map(([food_type, stats]) => ({
      name: displayNames[food_type] || food_type,
      waste:
        stats.total > 0 ? Math.round((stats.waste / stats.total) * 100) : 0,
    }));
  }

  const handlePreviousMonth = () =>
    setCurrentDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));

  // ---- BAŞLANGIÇ ----
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">İstatistikler</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {"<"}
          </button>
          <span className="font-medium">
            {format(currentDate, "MMMM yyyy", { locale: tr })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Haftalık İsraf Oranları
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart data={getWeeklyStats()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="waste" name="İsraf Var" fill="#EF4444" />
                <Bar dataKey="noWaste" name="İsraf Yok" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Aylık Toplam İsraf & İsraf Yok
          </h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer>
              <BarChart data={getMonthlyStats()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Adet" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Her kategori için ayrı bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {foodCategories.map((cat) => (
          <div
            key={cat.key}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {cat.title} İsraf Oranları (%)
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={getFoodTypeStats(cat.key)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Bar dataKey="waste" name="İsraf Oranı (%)" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Statistics;
