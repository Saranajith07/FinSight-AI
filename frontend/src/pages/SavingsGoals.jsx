import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  PlusCircle,
  ArrowRight,
  TrendingDown,
  Clock,
  Circle
} from "lucide-react";
import axios from "axios";
import { goalStyles as s, cn } from "../assets/dummyStyles";
import { toast } from "react-toastify";

const API_URL = "https://finsight-ai-uu55.onrender.com/api";

const SavingsGoals = ({ user }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    category: "Savings"
  });

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setGoals(res.data.goals);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/goals/add`, newGoal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Goal added successfully!");
        setGoals([res.data.goal, ...goals]);
        setShowAddModal(false);
        setNewGoal({ name: "", targetAmount: "", targetDate: "", category: "Savings" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding goal");
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`${API_URL}/api/goals/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(goals.filter(g => g._id !== id));
      toast.info("Goal removed");
    } catch (err) {
      toast.error("Error deleting goal");
    }
  };

  const handleUpdateProgress = async (id, amount) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/goals/update/${id}`, { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setGoals(goals.map(g => g._id === id ? res.data.goal : g));
      }
    } catch (err) {
      toast.error("Error updating progress");
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className={s.container}>
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={s.headerCard}
      >
        <div className={s.headerOverlay} />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
          <div>
            <h1 className={s.title}>Savings Goals</h1>
            <p className={s.subtitle}>Turning your dreams into achievable milestones</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center min-w-[200px]">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-100">Total Saved</span>
            <div className="text-4xl font-black mt-1">
              {user.currencySymbol || "$"}{totalSaved.toLocaleString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goals Grid */}
      <div className={s.grid}>
        {goals.map((goal) => {
          const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = goal.status === "completed";

          return (
            <motion.div 
              key={goal._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={s.goalCard}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-4 rounded-2xl",
                  isCompleted ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"
                )}>
                  <Target size={32} />
                </div>
                <div className={s.goalInfo}>
                  <div className="flex justify-between items-start">
                    <h3 className={s.goalName}>{goal.name}</h3>
                    <button 
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className={s.targetDate}>
                    <Clock size={14} /> 
                    by {new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className={s.amountStatus}>
                  <div>
                    <span className={s.currentAmount}>{user.currencySymbol || "$"}{goal.currentAmount.toLocaleString()}</span>
                    <span className={s.targetAmount}> / {goal.targetAmount.toLocaleString()}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-black",
                    isCompleted ? "text-green-500" : "text-indigo-400"
                  )}>{Math.round(percent)}%</span>
                </div>
                
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      isCompleted ? "bg-green-500" : "bg-indigo-500"
                    )}
                  />
                </div>
              </div>

              {!isCompleted && (
                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => {
                        const amt = prompt("How much would you like to add to this goal?");
                        if (amt && !isNaN(amt)) handleUpdateProgress(goal._id, amt);
                    }}
                    className="flex-1 bg-gray-50 hover:bg-indigo-50 text-indigo-600 py-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Funds
                  </button>
                </div>
              )}

              {isCompleted && (
                <div className="mt-6 flex items-center justify-center gap-2 bg-green-50 text-green-600 py-3 rounded-xl font-bold">
                  <CheckCircle size={20} /> GOAL ACHIEVED!
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Add Goal Button Placeholder inside Grid */}
        <motion.div 
          onClick={() => setShowAddModal(true)}
          whileHover={{ scale: 1.02 }}
          className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-gray-50 transition-all group"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
            <Plus size={24} />
          </div>
          <span className="text-gray-500 font-bold">Create New Goal</span>
        </motion.div>
      </div>

      {/* Floating Add Button for Mobile/Easier Access */}
      <motion.button 
        onClick={() => setShowAddModal(true)}
        className={s.addButton}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <PlusCircle size={32} />
      </motion.button>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-10 -mt-10" />
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <PlusCircle size={28} className="text-indigo-600" />
                New Savings Goal
              </h2>
              
              <form onSubmit={handleAddGoal} className="space-y-5 relative">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Goal Name</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. New Gaming PC"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Target ({user.currencySymbol || "$"})</label>
                    <input 
                      required
                      type="number"
                      placeholder="0"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Deadline</label>
                    <input 
                      required
                      type="date"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight size={20} /> CREATE GOAL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavingsGoals;
