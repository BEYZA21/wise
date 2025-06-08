import React, { useState } from "react";
import { Bell, Lock, User, Globe } from "lucide-react";

interface SettingsProps {
  userName: string;
  email: string;
  onUpdateProfile: (name: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
  userName,
  email,
  onUpdateProfile,
}) => {
  const [userData, setUserData] = useState({
    full_name: userName,
    email: email,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update the user name in the parent component
      onUpdateProfile(userData.full_name);
      setSuccess("Değişiklikler başarıyla kaydedildi.");
    } catch {
      setError("Değişiklikler kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ayarlar</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {userData.full_name}
              </h2>
              <p className="text-gray-600">{userData.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Hesap Bilgileri
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={userData.full_name}
                  onChange={(e) =>
                    setUserData({ ...userData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) =>
                    setUserData({ ...userData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Güvenlik</h2>
            </div>
            <button
              onClick={() =>
                setSuccess("Demo modunda şifre değiştirme devre dışı.")
              }
              className="text-primary hover:text-primary-dark font-medium"
            >
              Şifre Değiştir
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Bildirimler
              </h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary"
                  defaultChecked
                />
                <span className="text-gray-700">E-posta Bildirimleri</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary"
                  defaultChecked
                />
                <span className="text-gray-700">Haftalık Rapor</span>
              </label>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Dil</h2>
            </div>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {(error || success) && (
          <div
            className={`p-4 rounded-lg ${
              error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              setUserData({ full_name: userName, email: "demo@example.com" });
              setError(null);
              setSuccess(null);
            }}
          >
            İptal
          </button>
          <button
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
