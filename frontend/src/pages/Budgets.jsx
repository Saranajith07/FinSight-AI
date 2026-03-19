import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PieChart, 
  Plus, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Save,
  RefreshCcw,
  PlusCircle,
  Trash2
} from "lucide-react";
import axios from "axios";
import { budgetStyles as s, cn } from "../assets/dummyStyles";
import { toast } from "react-toastify";

const API_URL = "http://localhost:4000";

const Budgets = ({ user, onUpdateUser, transactions }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState({
    budgetLimit: 0,
    categoryBudgets: {}
  });

  // Unique categories from transactions
  const categories = [...new Set(transactions.map(t => t.category))].filter(Boolean);

  useEffect(() => {
    if (user) {
      setBudgets({
        budgetLimit: user.budgetLimit || 0,
        categoryBudgets: user.categoryBudgets || {}
      });
    }
  }, [user]);

  const calculateSpent = (category) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d >= startOfMonth && (category ? t.category === category : true);
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/user/settings`, budgets, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        onUpdateUser(res.data.user);
        toast.success("Budgets updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating budgets");
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = calculateSpent();
  const totalPercent = budgets.budgetLimit > 0 
    ? Math.min((totalSpent / budgets.budgetLimit) * 100, 100) 
    : 0;

  const getProgressColor = (percent) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-orange-500";
    return "bg-teal-500";
  };

  return (
    <div className={s.container}>
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={s.headerCard}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={s.title}>Budget Management</h1>
            <p className={s.subtitle}>Plan your spending and stay on track</p>
          </div>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md",
              isEditing ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            {loading ? <RefreshCcw className="animate-spin" size={20} /> : (isEditing ? <Save size={20} /> : <Settings size={20} />)}
            {isEditing ? "Save Changes" : "Configure Budgets"}
          </button>
        </div>

        {/* Total Budget Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-gray-600 font-medium">Monthly Limit</span>
              <span className="text-3xl font-black text-gray-900">
                {user.currencySymbol || "$"}{totalSpent.toLocaleString()} 
                <span className="text-lg text-gray-400 font-normal"> / {budgets.budgetLimit.toLocaleString()}</span>
              </span>
            </div>
            <div className={s.progressBarContainer}>
              <motion.div 
                className={s.progressBar(totalPercent, getProgressColor(totalPercent))}
                initial={{ width: 0 }}
                animate={{ width: `${totalPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className={cn("font-bold", totalSpent > budgets.budgetLimit ? "text-red-500" : "text-teal-600")}>
                {totalSpent > budgets.budgetLimit ? "Limit Exceeded!" : `${(budgets.budgetLimit - totalSpent).toLocaleString()} remaining`}
              </span>
              <span className="text-gray-400">{Math.round((totalSpent / budgets.budgetLimit) * 100 || 0)}% used</span>
            </div>
          </div>

          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-teal-50 p-6 rounded-2xl border border-teal-100"
            >
              <label className="block text-sm font-bold text-teal-800 mb-2 uppercase tracking-wider">Set Total Budget</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 font-bold">{user.currencySymbol || "$"}</span>
                <input 
                  type="number"
                  value={budgets.budgetLimit}
                  onChange={(e) => setBudgets({...budgets, budgetLimit: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white border-2 border-teal-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-teal-500 text-xl font-bold text-teal-800 transition-all"
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Category Budgets Grid */}
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <PieChart size={24} className="text-teal-500" />
        Category Specific Budgets
      </h2>

      <div className={s.grid}>
        {categories.map((cat) => {
          const catSpent = calculateSpent(cat);
          const catLimit = budgets.categoryBudgets[cat] || 0;
          const catPercent = catLimit > 0 ? Math.min((catSpent / catLimit) * 100, 100) : 0;
          const isOver = catLimit > 0 && catSpent > catLimit;

          return (
            <motion.div 
              key={cat}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={s.budgetCard}
            >
              <div className={s.cardHeader}>
                <span className={s.categoryName}>{cat}</span>
                {catPercent >= 100 && <AlertTriangle className="text-red-500" size={20} />}
                {catPercent > 0 && catPercent < 100 && <CheckCircle2 className="text-teal-500" size={20} />}
              </div>

              {isEditing ? (
                <div className="space-y-2 mt-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Limit ({user.currencySymbol || "$"})</label>
                  <input 
                    type="number"
                    value={catLimit}
                    onChange={(e) => {
                      const newCatBudgets = { ...budgets.categoryBudgets, [cat]: parseFloat(e.target.value) || 0 };
                      setBudgets({...budgets, categoryBudgets: newCatBudgets});
                    }}
                    className={s.input}
                    placeholder="Set limit..."
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-gray-800">
                      {user.currencySymbol || "$"}{catSpent.toLocaleString()}
                      <span className="text-xs text-gray-400 font-normal ml-1">Spent</span>
                    </span>
                    <span className="text-xs text-gray-500">Limit: {catLimit.toLocaleString()}</span>
                  </div>
                  
                  <div className={s.progressBarContainer}>
                    <motion.div 
                      className={s.progressBar(catPercent, getProgressColor(catPercent))}
                      initial={{ width: 0 }}
                      animate={{ width: `${catPercent}%` }}
                    />
                  </div>

                  <div className={s.statText}>
                    <span className={s.remainingText(isOver)}>
                      {catLimit > 0 ? (isOver ? "Over Budget" : `${(catLimit - catSpent).toLocaleString()} left`) : "No Limit Set"}
                    </span>
                    <span className="text-gray-400">{Math.round(catPercent)}%</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Empty State / Add Category info */}
        {categories.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <PlusCircle className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500 font-medium">Add some expenses to see category budget options!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {loading ? <RefreshCcw className="animate-spin" /> : <Save />}
              CONFIRM BUDGET CHANGES
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Budgets;
