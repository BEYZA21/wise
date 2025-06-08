import React from "react";
import { Leaf } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  menuItems: MenuItem[];
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  menuItems,
  currentPage,
  onPageChange,
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Leaf className="w-8 h-8 text-[#7BC47F]" />
          <span className="text-2xl font-bold text-gray-800">WISE</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Sürdürülebilir Beslenme</p>
      </div>

      <nav className="flex-1 px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-2 transition-colors ${
              currentPage === item.id
                ? "bg-[#7BC47F] bg-opacity-10 text-[#7BC47F]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
