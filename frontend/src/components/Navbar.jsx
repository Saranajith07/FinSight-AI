import React, { useEffect, useRef, useState } from "react";
import { navbarStyles, cn } from "../assets/dummyStyles";
import img1 from "../assets/logo.png";
import { ChevronDown, LogOut, User, Settings, Bell, Trash2, Inbox, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "https://finsight-ai-uu55.onrender.com/api";

const Navbar = ({ user: propUser, onLogout, onUpdateUser, onOpenSettings }) => {
  const navigate = useNavigate();
  const menuRef = useRef();
  const notifyRef = useRef();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const user = propUser || {
    name: "",
    email: "",
  };

  //   to fetch the user data from server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(`${BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = response.data.user || response.data;
        setUser(userData);
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    if (!propUser) {
      fetchUserData();
    }
  }, [propUser]);

  const unreadCount = user?.notifications?.filter(n => !n.read).length || 0;

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${BASE_URL}/user/notifications/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        onUpdateUser?.(res.data.user);
      }
    } catch (err) {
      console.error("Error marking notifications as read", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${BASE_URL}/user/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        onUpdateUser?.(res.data.user);
      }
    } catch (err) {
      console.error("Error deleting notification", err);
    }
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleLogout = () => {
    setMenuOpen(false);
    localStorage.removeItem("token");
    onLogout?.();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setNotifyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>
        {/* logo */}
        <div
          onClick={() => navigate("/")}
          className={navbarStyles.logoContainer}
        >
          <div className={navbarStyles.logoImage}>
            <img src={img1} alt="logo" />
          </div>
          <span className={navbarStyles.logoText}>Smart Expense Tracker</span>
        </div>

        {/* if the user is present */}
        {user && (
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifyRef}>
              <button 
                onClick={() => setNotifyOpen(!notifyOpen)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all relative"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifyOpen && (
                <div className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto">
                    {user?.notifications?.length > 0 ? (
                      [...user.notifications].reverse().map((n) => (
                        <div 
                          key={n._id} 
                          className={cn(
                            "px-5 py-4 border-b border-gray-50 flex gap-3 group transition-colors",
                            !n.read ? "bg-teal-50/30" : "hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center",
                            n.type === 'budget_warning' ? "bg-orange-100 text-orange-600" : "bg-teal-100 text-teal-600"
                          )}>
                            <Bell size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm leading-tight", !n.read ? "font-bold text-gray-900" : "text-gray-600")}>
                              {n.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                              {new Date(n.date).toLocaleDateString()} • {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <button 
                            onClick={() => deleteNotification(n._id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <Inbox size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={navbarStyles.userContainer} ref={menuRef}>
            <button onClick={toggleMenu} className={navbarStyles.userButton}>
              <div className=" relative">
                <div className={navbarStyles.userAvatar}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className={navbarStyles.statusIndicator}></div>
              </div>
              <div className={navbarStyles.userTextContainer}>
                <p className={navbarStyles.userName}>{user?.name || "User"}</p>
                <p className={navbarStyles.userEmail}>
                  {user?.email || "user@finsightai.com"}
                </p>
              </div>

              <ChevronDown className={navbarStyles.chevronIcon(menuOpen)} />
            </button>

            {/* dropdown menu */}
            {menuOpen && (
              <div className={navbarStyles.dropdownMenu}>
                <div className={navbarStyles.dropdownHeader}>
                  <div className=" flex items-center gap-3">
                    <div className={navbarStyles.dropdownAvatar}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <div className={navbarStyles.dropdownName}>
                        {user?.name || "User"}
                      </div>
                      <div className={navbarStyles.dropdownEmail}>
                        {user?.email || "user@finsightai.com"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={navbarStyles.menuItemContainer}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                    className={navbarStyles.menuItem}
                  >
                    <User className=" w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings?.();
                    }}
                    className={navbarStyles.menuItem}
                  >
                    <Settings className=" w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>

                <div className={navbarStyles.menuItemBorder}>
                  <button
                    onClick={handleLogout}
                    className={navbarStyles.logoutButton}
                  >
                    <LogOut className=" w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
  );
};

export default Navbar;
