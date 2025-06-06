import React, { useState } from "react";
import { Leaf } from "lucide-react";

interface AuthProps {
  mode: "login" | "register";
  onClose: () => void;
  onLogin: (
    username: string,
    password: string
  ) => Promise<string | null | void>;
  onRegister: (
    username: string,
    email: string,
    password: string,
    fullName: string
  ) => Promise<string | null | void>;
}

const Auth: React.FC<AuthProps> = ({ mode, onClose, onLogin, onRegister }) => {
  // Login için ayrı, register için ayrı state'ler
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === "login") {
      const result = await onLogin(loginUsername, loginPassword);
      if (result) setError(result);
    } else if (mode === "register") {
      const result = await onRegister(
        regUsername,
        regEmail,
        regPassword,
        regFullName
      );
      if (result) setError(result);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo ve başlık kısmı */}
        <div className="flex flex-col items-center">
          <Leaf className="w-12 h-12 text-[#7BC47F]" />
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            WISE
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sürdürülebilir Beslenme Sistemi
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative bg-white rounded-lg shadow-md p-8 mt-6"
        >
          {/* Çarpı butonu */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-[#7BC47F] text-2xl font-bold focus:outline-none"
            aria-label="Kapat"
          >
            ✕
          </button>

          <h2 className="mb-6 text-2xl font-bold text-center">
            {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </h2>
          <div className="space-y-4">
            {mode === "register" ? (
              <>
                <input
                  placeholder="Kullanıcı Adı"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7BC47F] focus:border-[#7BC47F] sm:text-sm"
                />
                <input
                  placeholder="E-posta"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7BC47F] focus:border-[#7BC47F] sm:text-sm"
                />
                <input
                  placeholder="Ad Soyad"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7BC47F] focus:border-[#7BC47F] sm:text-sm"
                />
                <input
                  type="password"
                  placeholder="Şifre"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7BC47F] focus:border-[#7BC47F] sm:text-sm"
                />
              </>
            ) : (
              <>
                <input
                  placeholder="Kullanıcı Adı"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7BC47F] focus:border-[#7BC47F] sm:text-sm"
                />
                <input
                  type="password"
                  placeholder="Şifre"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#7BC47F] focus:border-[#7BC47F] sm:text-sm"
                />
              </>
            )}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-2 rounded bg-[#7BC47F] text-white font-medium hover:bg-[#6AB36E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7BC47F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "İşleniyor..."
                : mode === "login"
                ? "Giriş Yap"
                : "Kayıt Ol"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;
