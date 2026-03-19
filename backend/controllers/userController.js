import User from '../models/userModel.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_here';
const TOKEN_EXPIRES = '24h';

const createToken = (userId) =>
    jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

// REGISTER A USER
export async function registerUser(req, res) {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const { password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email"
        });
    }
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be atleast of 8 characters."
        })
    }

    try {
        if (await User.findOne({ email })) {
            return res.status(409).json({
                success: false,
                message: "User already present"
            });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashed });
        const token = createToken(user._id);
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to login a user
export async function loginUser(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Both fields are required."
        });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = createToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to get login user details
export async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.json({ success: true, user });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to update a user profile
export async function updateProfile(req, res) {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();

    if (!name || !email || !validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Valid email and name are required."
        });
    }

    try {
        const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
        if (exists) {
            return res.status(409).json({
                success: false,
                message: "Email already in use."
            });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { new: true, runValidators: true, select: "name email" }
        );
        res.json({
            success: true,
            user
        })
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// to change user password
export async function updatePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password invalid or too short."
        });
    }
    try {
        const user = await User.findById(req.user.id).select("password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Current Password is incorrect."
            });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({
            success: true,
            message: "Password changed"
        });
    }

    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// update settings (budget limit, currency, category budgets)
export async function updateSettings(req, res) {
    const { budgetLimit, phoneNumber, currency, currencySymbol, categoryBudgets } = req.body;
    
    // Validation
    if (budgetLimit !== undefined && budgetLimit < 0) {
        return res.status(400).json({
            success: false,
            message: "Budget limit cannot be negative"
        });
    }

    if (phoneNumber && !/^\+?[\d\s-]{10,}$/.test(phoneNumber)) {
        return res.status(400).json({
            success: false,
            message: "Invalid phone number format"
        });
    }

    if (categoryBudgets) {
        for (const [cat, limit] of Object.entries(categoryBudgets)) {
            if (limit < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Budget for ${cat} cannot be negative`
                });
            }
        }
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { budgetLimit, phoneNumber, currency, currencySymbol, categoryBudgets },
            { new: true, runValidators: true, select: "name email budgetLimit phoneNumber currency currencySymbol categoryBudgets" }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Settings updated successfully",
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// mark all notifications as read for the logged-in user
export async function markNotificationsRead(req, res) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (Array.isArray(user.notifications)) {
            user.notifications.forEach((n) => {
                n.read = true;
            });
        }

        await user.save();

        res.json({
            success: true,
            message: "Notifications marked as read",
            notifications: user.notifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// delete a single notification by its id
export async function deleteNotification(req, res) {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { notifications: { _id: id } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Notification deleted",
            notifications: user.notifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

