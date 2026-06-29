'use client';

import React, { useState } from 'react';
import { useStore, AppNotification } from 'src/store/useStore';
import { Bell, BellRing, Check, Trash2, X, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notifications, clearNotification, clearAllNotifications, markAllAsRead } = useStore();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-500" />;
      default:
        return <Info size={16} className="text-sky-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/20 border border-white/20 text-purple-950/70 hover:text-purple-950 hover:bg-white/30 transition-all relative cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#B998D2]"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing size={18} className="text-purple-600 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-sans font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell size={18} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/90 border border-white/20 shadow-2xl backdrop-blur-md z-40 overflow-hidden flex flex-col max-h-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-950/5">
              <span className="text-xs font-sans font-bold text-purple-950">Notifications</span>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[10px] font-sans font-medium text-purple-600 hover:text-purple-800 cursor-pointer"
                  >
                    <Check size={10} />
                    Read all
                  </button>
                  <span className="text-purple-950/20 text-[10px]">|</span>
                  <button
                    onClick={clearAllNotifications}
                    className="flex items-center gap-1 text-[10px] font-sans font-medium text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 size={10} />
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-purple-950/5">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Bell size={24} className="text-purple-950/20 mb-2" />
                  <p className="text-xs font-sans font-semibold text-purple-950/50">All quiet here</p>
                  <p className="text-[10px] font-sans text-purple-950/30 mt-0.5">We'll alert you when tasks finish.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 transition-colors ${
                      !n.read ? 'bg-purple-950/5' : 'hover:bg-purple-950/[0.02]'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-sans font-semibold text-purple-950 truncate">{n.title}</p>
                      <p className="text-[10px] font-sans text-purple-950/60 mt-0.5 break-words">{n.message}</p>
                      <span className="text-[8px] font-sans text-purple-950/30 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={() => clearNotification(n.id)}
                      className="shrink-0 text-purple-950/20 hover:text-purple-950/60 transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default NotificationCenter;
