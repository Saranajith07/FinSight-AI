import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";
import XLSX from 'xlsx';
import getDateRange from "../utils/dateFilter.js";

export async function getDashboardOverview(req, res) {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const incomes = await incomeModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        const expenses = await expenseModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now },
        }).lean();

        const monthlyIncome = incomes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const monthlyExpense = expenses.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
        const savings = monthlyIncome - monthlyExpense;
        const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

        const recentTransactions = [
            ...incomes.map((i) => ({ ...i, type: "income" })),
            ...expenses.map((e) => ({ ...e, type: "expense" })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const spendByCategory = {};
        for (const exp of expenses) {
            const cat = exp.category || "Other";
            spendByCategory[cat] = (spendByCategory[cat] || 0) + Number(exp.amount || 0);
        }

        const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
            category,
            amount,
            percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
        }));//for chart

        return res.status(200).json({
            success: true,
            data: {
                monthlyIncome,
                monthlyExpense,
                savings,
                savingsRate,
                recentTransactions,
                spendByCategory,
                expenseDistribution
            }
        })
    }

    catch (err) {
        console.error("GetDashboardOverview Error:", err);
        return res.status(500).json({
            success: false,
            message: "Dashboard Fetch failed"
        });
    }
}

export async function downloadDashboardExcel(req, res) {
    const userId = req.user._id;
    const { range = "monthly" } = req.query;
    try {
        const { start, end } = getDateRange(range);
        const query = { userId, date: { $gte: start, $lte: end } };

        const [incomes, expenses] = await Promise.all([
            incomeModel.find(query).sort({ date: -1 }).lean(),
            expenseModel.find(query).sort({ date: -1 }).lean()
        ]);

        const combinedData = [
            ...incomes.map(i => ({ Date: new Date(i.date).toLocaleDateString(), Type: 'Income', Category: i.category, Description: i.description, Amount: i.amount })),
            ...expenses.map(e => ({ Date: new Date(e.date).toLocaleDateString(), Type: 'Expense', Category: e.category, Description: e.description, Amount: e.amount }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        const workbook = XLSX.utils.book_new();
        
        const incomeWS = XLSX.utils.json_to_sheet(incomes.map(i => ({ Date: new Date(i.date).toLocaleDateString(), Category: i.category, Description: i.description, Amount: i.amount })));
        XLSX.utils.book_append_sheet(workbook, incomeWS, "Income");
        
        const expenseWS = XLSX.utils.json_to_sheet(expenses.map(e => ({ Date: new Date(e.date).toLocaleDateString(), Category: e.category, Description: e.description, Amount: e.amount })));
        XLSX.utils.book_append_sheet(workbook, expenseWS, "Expenses");

        const summaryWS = XLSX.utils.json_to_sheet(combinedData);
        XLSX.utils.book_append_sheet(workbook, summaryWS, "All Transactions");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report_${range}.xlsx`);
        res.end(buffer);
    } catch (err) {
        console.error("DownloadDashboardExcel Error:", err);
        return res.status(500).json({ success: false, message: "Report generation failed" });
    }
}