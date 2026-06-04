import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Compass, 
  PlusCircle, 
  Trophy, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Bell, 
  Coins, 
  Zap, 
  Terminal,
  ChevronDown
} from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types';

interface NavigationProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Monitor real-time notifications for the signed-in user
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: Notification[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Notification);
      });
      // Sort newest first
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    });
    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    for (const n of notifications) {
      if (!n.read) {
        try {
          await updateDoc(doc(db, 'notifications', n.notificationId), { read: true });
        } catch (error) {
          console.error("Notif update failed: ", error);
        }
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Echos Grid', icon: Compass },
    { id: 'create', label: 'DM Forge', icon: PlusCircle },
    { id: 'bazaar', label: 'Premium Marketplace', icon: ShoppingBag },
    { id: 'leaderboard', label: 'Investigators Ledger', icon: Trophy },
  ];

  if (!user) return null;

  return (
    <nav id="app-navbar" className="sticky top-0 z-50 bg-[#0D0D10]/95 border-b border-white/5 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo & Atmosphere Info */}
      <div 
        id="nav-logo" 
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <div className="w-9 h-9 bg-teal-500/20 border border-teal-500/40 rounded flex items-center justify-center text-teal-400 font-bold group-hover:rotate-12 transition-transform duration-300">
          EV
        </div>
        <div>
          <h1 className="font-sans font-medium text-base tracking-tight text-white flex items-center gap-1.5">
            ECHO<span className="text-teal-400 font-bold">VERSE</span>
            <span className="text-[9px] text-amber-500 font-mono px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 uppercase font-medium tracking-widest hidden sm:inline">
              LIVE ARCHIVE
            </span>
          </h1>
          <p className="text-[9px] text-slate-500 font-mono tracking-wider -mt-1 uppercase">Asynchronous Mystery Grid</p>
        </div>
      </div>

      {/* Nav Actions / Categories */}
      <div id="nav-routes" className="hidden md:flex items-center gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              id={`nav-link-${item.id}`}
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-sans text-xs font-medium tracking-wide transition-all ${
                isActive 
                  ? 'text-teal-400 bg-white/5 border border-white/5' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Profile, Wallet & Notifications stats */}
      <div id="nav-user-panel" className="flex items-center gap-4">
        {/* Wallet Indicators */}
        <div id="nav-wallet" className="flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-md text-xs font-mono">
          <div className="flex items-center gap-1 text-amber-500 font-semibold" title="Coins balance">
            <Coins className="w-3.5 h-3.5" />
            <span>{user.coins || 0}</span>
          </div>
          <div className="w-px h-3 bg-white/10"></div>
          <div className="flex items-center gap-1 text-teal-400 font-semibold" title="Current Level & XP">
            <Zap className="w-3.5 h-3.5" />
            <span>Lvl {user.level || 1}</span>
          </div>
        </div>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            id="nav-bell-btn"
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
              if (!showNotifMenu) handleMarkAllRead();
            }}
            className="p-1.5 rounded-md border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span id="unread-badge" className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[9px] font-bold font-mono rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Log Overlay */}
          {showNotifMenu && (
            <div id="notif-dropdown-menu" className="absolute right-0 mt-2.5 w-72 bg-[#121216] border border-white/10 rounded-lg shadow-2xl p-3.5 z-50">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Logs</span>
                <span className="text-[10px] text-teal-400 cursor-pointer hover:underline" onClick={handleMarkAllRead}>Dismiss all</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-xs text-center text-slate-500 py-6 font-mono">No communication logs recorded.</p>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.notificationId} 
                      className={`p-2 rounded border border-white/5 text-[11px] ${
                        n.read ? 'bg-transparent text-slate-400' : 'bg-teal-500/5 text-slate-200 border-l-2 border-l-teal-500'
                      }`}
                    >
                      <h4 className="font-semibold">{n.title}</h4>
                      <p className="text-slate-400 mt-0.5">{n.body}</p>
                      <span className="text-[9px] text-slate-500 font-mono block mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card Trigger */}
        <div className="relative">
          <button
            id="nav-profile-btn"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-1.5 p-1 rounded-md hover:bg-white/5 border border-transparent hover:border-white/5 transition"
          >
            <img 
              src={user.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} 
              alt={user.username} 
              className="w-7 h-7 rounded bg-[#121216] border border-white/10 p-0.5"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div id="profile-dropdown-menu" className="absolute right-0 mt-2.5 w-56 bg-[#121216] border border-white/10 rounded-lg shadow-2xl p-3 z-50">
              <div className="pb-3 border-b border-white/5 flex items-center gap-2 mb-2">
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-10 h-10 rounded bg-[#0d0d10] border border-white/10 p-0.5"
                />
                <div className="overflow-hidden text-left">
                  <h3 className="text-xs font-bold text-white truncate">@{user.username}</h3>
                  <span className="text-[9px] text-amber-500 font-mono uppercase bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/20 inline-block mt-1">
                    {user.rank}
                  </span>
                </div>
              </div>

              <div className="space-y-1 block md:hidden mb-2 pb-2 border-b border-white/5">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left font-sans text-xs text-slate-400 py-1.5 px-1.5 rounded hover:bg-white/5 hover:text-white block"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                id="profile-dropdown-settings"
                onClick={() => {
                  setView('settings');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded font-sans text-xs text-slate-400 hover:text-white hover:bg-white/5 text-left transition"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Settings & Cosmetics
              </button>

              <button
                id="profile-dropdown-logout"
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 py-1.5 px-2 mt-1 rounded font-sans text-xs text-red-400 hover:bg-red-500/10 text-left transition"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                Log Off Frequency
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );;
};
