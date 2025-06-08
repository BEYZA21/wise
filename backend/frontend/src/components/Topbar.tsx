import React from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TopbarProps {
  userIcon: React.ReactNode;
  logoutIcon: React.ReactNode;
  onLogout: () => void;
  userName?: string;
}

const Topbar: React.FC<TopbarProps> = ({ userIcon, logoutIcon, onLogout, userName }) => {
  const today = format(new Date(), 'dd MMMM yyyy', { locale: tr });

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <span className="text-gray-600">{today}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            {userIcon}
          </button>
          {userName && (
            <span className="text-gray-700 font-medium">{userName}</span>
          )}
        </div>
        <button 
          onClick={onLogout}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
        >
          {logoutIcon}
        </button>
      </div>
    </div>
  );
};

export default Topbar;