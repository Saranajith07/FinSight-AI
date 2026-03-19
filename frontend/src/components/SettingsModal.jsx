import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { X, Settings, DollarSign, Smartphone } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = "http://localhost:4000/api";

const SettingsModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [budgetLimit, setBudgetLimit] = useState(user?.budgetLimit || 0);
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [currency, setCurrency] = useState(user?.currency || "USD");
    const [currencySymbol, setCurrencySymbol] = useState(user?.currencySymbol || "$");
    const [categoryBudgets, setCategoryBudgets] = useState(user?.categoryBudgets || {});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("general"); // "general" or "categories"

    const expenseCategories = [
        "Food", "Housing", "Transport", "Shopping", "Entertainment", "Utilities", "Healthcare", "Other"
    ];

    const currencies = [
        { code: "USD", symbol: "$", name: "US Dollar" },
        { code: "INR", symbol: "₹", name: "Indian Rupee" },
        { code: "EUR", symbol: "€", name: "Euro" },
        { code: "GBP", symbol: "£", name: "British Pound" },
        { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    ];

    useEffect(() => {
        if (user) {
            setBudgetLimit(user.budgetLimit || 0);
            setPhoneNumber(user.phoneNumber || "");
            setCurrency(user.currency || "USD");
            setCurrencySymbol(user.currencySymbol || "$");
            setCategoryBudgets(user.categoryBudgets || {});
        }
    }, [user]);

    const handleCategoryBudgetChange = (cat, val) => {
        setCategoryBudgets(prev => ({
            ...prev,
            [cat]: Number(val)
        }));
    };

    const handleCurrencyChange = (code) => {
        const found = currencies.find(c => c.code === code);
        if (found) {
            setCurrency(found.code);
            setCurrencySymbol(found.symbol);
        }
    };

    const handleSave = async () => {
        try {
            if (budgetLimit < 0) {
                toast.error("Total budget cannot be negative");
                return;
            }

            if (phoneNumber && !/^\+?[\d\s-]{10,}$/.test(phoneNumber)) {
                toast.error("Invalid phone number format");
                return;
            }

            for (const [cat, limit] of Object.entries(categoryBudgets)) {
                if (limit < 0) {
                    toast.error(`Budget for ${cat} cannot be negative`);
                    return;
                }
            }

            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.put(`${API_BASE}/user/settings`, 
                { 
                    budgetLimit: Number(budgetLimit || 0), 
                    phoneNumber,
                    currency,
                    currencySymbol,
                    categoryBudgets
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success("Settings updated successfully!");
                onUpdate(res.data.user);
                onClose();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={{
                overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 },
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '16px',
                    padding: '0',
                    border: 'none',
                    width: '90%',
                    maxWidth: '480px',
                    maxHeight: '90vh',
                    overflow: 'hidden'
                }
            }}
        >
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-teal-600 p-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Preferences</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-teal-700 p-1 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex border-b border-gray-100 shrink-0">
                    <button 
                        onClick={() => setActiveTab("general")}
                        className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === "general" ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        General Settings
                    </button>
                    <button 
                        onClick={() => setActiveTab("categories")}
                        className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === "categories" ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/30" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Category Budgets
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                    {activeTab === "general" ? (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-teal-600" />
                                    Currency
                                </label>
                                <select
                                    value={currency}
                                    onChange={(e) => handleCurrencyChange(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                >
                                    {currencies.map(c => (
                                        <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-teal-600" />
                                    Total Monthly Budget
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={budgetLimit}
                                        onChange={(e) => setBudgetLimit(Math.max(0, e.target.value))}
                                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                    <span className="absolute right-4 top-3.5 text-gray-400 font-medium">{currency}</span>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Warning at 80%, critical alert at 100%.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-teal-600" />
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Set limits for individual categories to track spending more closely.</p>
                            <div className="grid grid-cols-1 gap-3">
                                {expenseCategories.map(cat => (
                                    <div key={cat} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-sm font-bold text-gray-700 w-24 shrink-0">{cat}</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={categoryBudgets[cat] || ""}
                                                onChange={(e) => handleCategoryBudgetChange(cat, Math.max(0, e.target.value))}
                                                className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all text-gray-800"
                                                placeholder="No limit"
                                                min="0"
                                            />
                                            <span className="absolute right-2 top-2 text-xs text-gray-400 font-bold">{currencySymbol}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-8 pt-0 shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-teal-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
