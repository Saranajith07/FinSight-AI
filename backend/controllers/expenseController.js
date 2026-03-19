import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dateFilter.js";
import XLSX from 'xlsx';
import { sendBudgetNotification, sendWhatsAppNotification } from "../services/notificationService.js";
import User from "../models/userModel.js";

// add expense
export async function addExpense(req, res) {
    const user = req.user;
    const userId = user._id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0"
            });
        }
        const newExpense = new expenseModel({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });

        await newExpense.save()

        // Enhanced Budget Checking Logic
        if (user && ((user.budgetLimit && user.budgetLimit > 0) || (user.categoryBudgets && user.categoryBudgets.size > 0))) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);

            const monthStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`;

            // 1. Total Budget Check
            if (user.budgetLimit > 0) {
                const totalMonthlyExpenses = await expenseModel.aggregate([
                    { $match: { userId: user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);

                const total = totalMonthlyExpenses.length > 0 ? totalMonthlyExpenses[0].total : 0;
                
                // Check 100% threshold
                if (total >= user.budgetLimit) {
                    const alreadySent = user.budgetAlerts.some(a => a.month === monthStr && a.category === "Total" && a.threshold === 100);
                    if (!alreadySent) {
                        await sendBudgetNotification(user, total, user.budgetLimit, "Total", 100);
                        await sendWhatsAppNotification(user, total, user.budgetLimit, "Total", 100);
                        
                        // In-app notification
                        user.notifications.push({
                            title: "🚨 Monthly Budget Exceeded",
                            message: `You've spent ${user.currencySymbol || "$"}${total.toLocaleString()} which exceeds your monthly limit of ${user.currencySymbol || "$"}${user.budgetLimit.toLocaleString()}.`,
                            type: "error"
                        });

                        user.budgetAlerts.push({ month: monthStr, category: "Total", threshold: 100 });
                        await user.save();
                    }
                } 
                // Check 80% threshold
                else if (total >= user.budgetLimit * 0.8) {
                    const alreadySent = user.budgetAlerts.some(a => a.month === monthStr && a.category === "Total" && a.threshold === 80);
                    if (!alreadySent) {
                        await sendBudgetNotification(user, total, user.budgetLimit, "Total", 80);
                        await sendWhatsAppNotification(user, total, user.budgetLimit, "Total", 80);

                        // In-app notification
                        user.notifications.push({
                            title: "⚠️ Budget Warning",
                            message: `You've utilized 80% of your ${user.currencySymbol || "$"}${user.budgetLimit.toLocaleString()} monthly budget. Current spending: ${user.currencySymbol || "$"}${total.toLocaleString()}.`,
                            type: "warning"
                        });

                        user.budgetAlerts.push({ month: monthStr, category: "Total", threshold: 80 });
                        await user.save();
                    }
                }
            }

            // 2. Category Budget Check
            if (user.categoryBudgets && user.categoryBudgets.has(category)) {
                const categoryLimit = user.categoryBudgets.get(category);
                if (categoryLimit > 0) {
                    const categoryMonthlyExpenses = await expenseModel.aggregate([
                        { $match: { userId: user._id, category: category, date: { $gte: startOfMonth, $lte: endOfMonth } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]);

                    const catTotal = categoryMonthlyExpenses.length > 0 ? categoryMonthlyExpenses[0].total : 0;

                    // Check 100% threshold
                    if (catTotal >= categoryLimit) {
                        const alreadySent = user.budgetAlerts.some(a => a.month === monthStr && a.category === category && a.threshold === 100);
                        if (!alreadySent) {
                            await sendBudgetNotification(user, catTotal, categoryLimit, category, 100);
                            await sendWhatsAppNotification(user, catTotal, categoryLimit, category, 100);

                            // In-app notification
                            user.notifications.push({
                                title: `🚨 ${category} Budget Exceeded`,
                                message: `Your spending in ${category} (${user.currencySymbol || "$"}${catTotal.toLocaleString()}) has reached its limit of ${user.currencySymbol || "$"}${categoryLimit.toLocaleString()}.`,
                                type: "error"
                            });

                            user.budgetAlerts.push({ month: monthStr, category: category, threshold: 100 });
                            await user.save();
                        }
                    }
                    // Check 80% threshold
                    else if (catTotal >= categoryLimit * 0.8) {
                        const alreadySent = user.budgetAlerts.some(a => a.month === monthStr && a.category === category && a.threshold === 80);
                        if (!alreadySent) {
                            await sendBudgetNotification(user, catTotal, categoryLimit, category, 80);
                            await sendWhatsAppNotification(user, catTotal, categoryLimit, category, 80);

                            // In-app notification
                            user.notifications.push({
                                title: `⚠️ ${category} Budget Warning`,
                                message: `You've used 80% of your ${category} budget (${user.currencySymbol || "$"}${catTotal.toLocaleString()} / ${user.currencySymbol || "$"}${categoryLimit.toLocaleString()}).`,
                                type: "warning"
                            });

                            user.budgetAlerts.push({ month: monthStr, category: category, threshold: 80 });
                            await user.save();
                        }
                    }
                }
            }
        }

        res.json({
            success: true,
            message: "Expense added successfully!"
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to all expense
export async function getAllExpense(req, res) {
    const userId = req.user._id;
    try {
        const expense = await expenseModel.find({ userId }).sort({ date: -1 });
        res.json(expense);
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to update the expense
export async function updateExpense(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const description = req.body.description?.trim();
    const { amount } = req.body;

    if (description === "") {
        return res.status(400).json({
            success: false,
            message: "Description cannot be empty"
        });
    }

    if (amount !== undefined && amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than 0"
        });
    }

    try {
        const updatedExpense = await expenseModel.findOneAndUpdate(
            { _id: id, userId },
            { description, amount },
            { new: true }
        );

        if (!updatedExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.json({
            success: true, message: "Expense updated successfully.", data:
                updatedExpense
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// delete an expense
export async function deleteExpense(req, res) {
    try {
        const expense = await expenseModel.findByIdAndDelete({ _id: req.params.id });
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }
        return res.json({
            success: true,
            message: "Expense deleted successfully!"
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// download excel for expense
export async function downloadExpenseExcel(req, res) {
    const userId = req.user._id;
    const { range = "all" } = req.query;
    try {
        let query = { userId };
        if (range !== "all") {
            const { start, end } = getDateRange(range);
            query.date = { $gte: start, $lte: end };
        }

        const expense = await expenseModel.find(query).sort({ date: -1 });
        const plainData = expense.map((exp) => ({
            Description: exp.description,
            Amount: exp.amount,
            Category: exp.category,
            Date: new Date(exp.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=expense_${range}.xlsx`);
        res.end(buffer);
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to get overview of expense
export async function getExpenseOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        const expense = await expenseModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });


        const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
        const averageExpense =
            expense.length > 0 ? totalExpense / expense.length : 0;
        const numberOfTransactions = expense.length;
        const recentTransactions = expense.slice(0, 5);

        res.json({
            success: true,
            data: {
                totalExpense,
                averageExpense,
                numberOfTransactions,
                recentTransactions,
                range
            }
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}