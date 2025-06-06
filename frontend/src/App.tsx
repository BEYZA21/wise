import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  Leaf,
  BarChart3,
  PieChart,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  User,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";
import Statistics from "./pages/Statistics";
import Menu from "./pages/Menu";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";

// Route'da query parametrelerini okuyabilmek için özel bir wrapper component
interface AuthPageWrapperProps {
  onLogin: (username: string, password: string) => Promise<string | null>;
  onRegister: (
    username: string,
    email: string,
    password: string,
    fullName: string
  ) => Promise<string>;
  isAuthenticated: boolean;
}

function AuthPageWrapper({
  onLogin,
  onRegister,
  isAuthenticated,
}: AuthPageWrapperProps) {
  const location = useLocation();
  // mode parametresi login/register (varsayılan login)
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") === "register" ? "register" : "login";
  // Auth componentine mode'u gönder
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Auth
      onLogin={onLogin}
      onRegister={onRegister}
      mode={mode}
      onClose={() => {}}
    />
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userName, setUserName] = useState<string>("Demo User");

  // Kayıt fonksiyonu (API)
  const handleRegister = async (
    username: string,
    email: string,
    password: string,
    fullName: string
  ) => {
    try {
      const response = await fetch("${API_URL}/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          fullName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        return "Kayıt başarılı! Şimdi giriş yapabilirsiniz.";
      } else {
        return data.error || "Kayıt sırasında bir hata oluştu.";
      }
    } catch {
      return "Sunucuya ulaşılamadı.";
    }
  };

  // Giriş fonksiyonu (API)
  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch("${API_URL}/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        setIsAuthenticated(true);
        setUserName(username);
        return null;
      } else {
        return data.error || "Kullanıcı adı veya şifre yanlış!";
      }
    } catch {
      return "Sunucuya ulaşılamadı.";
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName("Demo User");
    setCurrentPage("dashboard");
  };

  const menuItems = [
    { id: "dashboard", label: "Ana Menü", icon: <Leaf className="w-5 h-5" /> },
    {
      id: "results",
      label: "Sonuçlar",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: "stats",
      label: "İstatistikler",
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      id: "menu",
      label: "Menü Oluştur",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: "settings",
      label: "Ayarlar",
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  // Dashboard layoutu
  const DashboardLayout = () => {
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }

    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          menuItems={menuItems}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            userIcon={<User className="w-6 h-6" />}
            logoutIcon={<LogOut className="w-6 h-6" />}
            onLogout={handleLogout}
            userName={userName}
          />
          <main className="flex-1 overflow-y-auto p-6">
            {(() => {
              switch (currentPage) {
                case "dashboard":
                  return <Dashboard />;
                case "results":
                  return <Results />;
                case "stats":
                  return <Statistics />;
                case "menu":
                  return <Menu />;
                case "settings":
                  return (
                    <Settings
                      userName={userName}
                      onUpdateProfile={(name: string) => setUserName(name)}
                      email={""}
                    />
                  );
                default:
                  return <Dashboard />;
              }
            })()}
          </main>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* /auth yönlendirmesi: query string ile mode okuma */}
        <Route
          path="/auth"
          element={
            <AuthPageWrapper
              onLogin={handleLogin}
              onRegister={handleRegister}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route path="/dashboard/*" element={<DashboardLayout />} />
        {/* Bilinmeyen route için ana sayfa */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
