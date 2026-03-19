import goalModel from "../models/goalModel.js";

// add goal
export async function addGoal(req, res) {
    const userId = req.user._id;
    const { name, targetAmount, targetDate, category } = req.body;

    try {
        if (!name || !targetAmount || !targetDate) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newGoal = new goalModel({
            userId,
            name,
            targetAmount,
            targetDate: new Date(targetDate),
            category: category || "Savings"
        });

        await newGoal.save();
        res.json({ success: true, message: "Goal added successfully!", goal: newGoal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// get all goals
export async function getGoals(req, res) {
    const userId = req.user._id;
    try {
        const goals = await goalModel.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, goals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// update goal progress
export async function updateGoalProgress(req, res) {
    const { id } = req.params;
    const { amount } = req.body;
    try {
        const goal = await goalModel.findById(id);
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });

        goal.currentAmount += parseFloat(amount);
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = "completed";
        }
        await goal.save();
        res.json({ success: true, message: "Goal updated!", goal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// delete goal
export async function deleteGoal(req, res) {
    const { id } = req.params;
    try {
        const goal = await goalModel.findByIdAndDelete(id);
        if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
        res.json({ success: true, message: "Goal deleted!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}
