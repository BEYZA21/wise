import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  ArrowRight,
  Utensils,
  LineChart,
  Calendar,
  X,
  Menu,
} from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navRef = useRef<HTMLDivElement>(null);

  // ... (diğer kodlar olduğu gibi)

  // Sayfa yüklendiğinde ve scroll olayında aktif bölümü takip et
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "0px 0px -80% 0px",
      }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Navbar'ı tıklama dışında bir yere tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsNavOpen(false);
      }
    };

    if (isNavOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNavOpen]);

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b" ref={navRef}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-[#7BC47F]" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                WISE
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="#features"
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  activeSection === "features" ? "font-semibold" : ""
                }`}
              >
                Özellikler
              </a>
              <a
                href="#about"
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  activeSection === "about" ? "font-semibold" : ""
                }`}
              >
                Hakkında
              </a>
              <a
                href="#contact"
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  activeSection === "contact" ? "font-semibold" : ""
                }`}
              >
                İletişim
              </a>
              {/* GİRİŞ YAP ve KAYIT OL butonlarını yan yana koyduk */}
              <Link
                to="/auth?mode=login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#7BC47F] hover:bg-[#6AB36E] transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                to="/auth?mode=register"
                className="inline-flex items-center px-4 py-2 border border-[#7BC47F] text-sm font-medium rounded-md text-[#7BC47F] hover:bg-[#f0fdf4] transition-colors"
              >
                Kayıt Ol
              </Link>
            </div>
            {/* Mobil Menü Butonu */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#7BC47F]"
                aria-expanded={isNavOpen}
              >
                <span className="sr-only">Open menu</span>
                {isNavOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobil Menü */}
        <AnimatePresence>
          {isNavOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="pt-2 pb-3 space-y-1">
                <a
                  href="#features"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsNavOpen(false)}
                >
                  Özellikler
                </a>
                <a
                  href="#about"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsNavOpen(false)}
                >
                  Hakkında
                </a>
                <a
                  href="#contact"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsNavOpen(false)}
                >
                  İletişim
                </a>
                <Link
                  to="/auth?mode=login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-[#7BC47F] hover:bg-[#6AB36E] transition-colors"
                  onClick={() => setIsNavOpen(false)}
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#7BC47F] border border-[#7BC47F] hover:bg-[#f0fdf4] transition-colors"
                  onClick={() => setIsNavOpen(false)}
                >
                  Kayıt Ol
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative bg-white overflow-hidden">
        <div className="w-full mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto w-full px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <motion.h1
                  className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl ml-12"
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <span className="block">Sürdürülebilir</span>
                  <span className="block text-[#7BC47F]">Beslenme Sistemi</span>
                </motion.h1>
                <motion.p
                  className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 lg:ml-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut", delay: 0.3 }}
                >
                  WISE ile yemek israfını azaltın, sürdürülebilir beslenmeyi
                  destekleyin ve maliyetlerinizi optimize edin.
                </motion.p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start ml-12">
                  <motion.div
                    className="rounded-md shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link
                      to="/auth?mode=login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#7BC47F] hover:bg-[#6AB36E] md:py-4 md:text-lg md:px-10 transition-colors"
                    >
                      Hemen Başla
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <motion.img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg"
            alt="Sustainable Food"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 bg-gray-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-[#7BC47F] font-semibold">
              Özellikler
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Daha İyi Bir Beslenme Sistemi
            </p>
          </div>

          <motion.div
            className="mt-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div
                className="flex flex-col items-center p-6 bg-white rounded-lg shadow transition-shadow hover:shadow-lg"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Utensils className="h-12 w-12 text-[#7BC47F]" />
                <h3 className="mt-5 text-lg leading-6 font-medium text-gray-900">
                  Akıllı Menü Planlaması
                </h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Yapay zeka destekli menü önerileri ile israfı minimize edin.
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col items-center p-6 bg-white rounded-lg shadow transition-shadow hover:shadow-lg"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <LineChart className="h-12 w-12 text-[#7BC47F]" />
                <h3 className="mt-5 text-lg leading-6 font-medium text-gray-900">
                  Detaylı Analiz
                </h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Görsel analiz ile yemek israfını takip edin ve raporlayın.
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col items-center p-6 bg-white rounded-lg shadow transition-shadow hover:shadow-lg"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Calendar className="h-12 w-12 text-[#7BC47F]" />
                <h3 className="mt-5 text-lg leading-6 font-medium text-gray-900">
                  Haftalık Planlama
                </h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Optimize edilmiş haftalık menüler ile maliyetleri düşürün.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 bg-white">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-[#7BC47F] font-semibold">Hakkında</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Neden WISE?
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              WISE, yapay zeka teknolojisini kullanarak yemek israfını azaltmayı
              ve sürdürülebilir beslenmeyi desteklemeyi amaçlar.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 bg-gray-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-[#7BC47F] font-semibold">İletişim</h2>
            <h2 className="text-3xl font-extrabold text-gray-900">
              İletişime Geçin
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Sorularınız için bize ulaşın
            </p>
          </div>
          <div className="mt-8 max-w-lg mx-auto">
            <form className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Ad Soyad
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7BC47F] focus:ring-[#7BC47F] sm:text-sm h-8"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7BC47F] focus:ring-[#7BC47F] sm:text-sm h-8"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mesaj
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#7BC47F] focus:ring-[#7BC47F] sm:text-s"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#7BC47F] hover:bg-[#6AB36E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7BC47F]"
                >
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="w-full mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <Leaf className="h-8 w-8 text-[#7BC47F]" />
              <span className="ml-2 text-xl font-bold text-gray-900">WISE</span>
            </div>
            <p className="text-gray-500 text-center sm:text-right">
              © 2024 WISE. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
