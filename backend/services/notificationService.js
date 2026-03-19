import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create a transporter using environment variables
// Note: For production, use actual SMTP secrets. For now, it logs to console if credentials missing.
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendBudgetNotification(user, totalSpent, limit, category = "Total", threshold = 100) {
    const userEmail = user.email;
    const userName = user.name;
    const isTotal = category === "Total";
    const currency = user.currencySymbol || "$";
    
    const subject = threshold === 100 
        ? `🚨 Budget Exceeded: ${category} Limit Reached!` 
        : `⚠️ Budget Warning: ${category} at ${threshold}%`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; color: #333;">
                <h2 style="color: ${threshold === 100 ? '#e53e3e' : '#ff9800'};">Hello ${userName},</h2>
                <p>This is a notification for your ${isTotal ? 'overall monthly' : `monthly <b>${category}</b>`} budget.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${threshold === 100 ? '#e53e3e' : '#ff9800'};">
                    <p style="margin: 5px 0;"><strong>Budget Limit:</strong> ${currency}${limit.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Current Spending:</strong> ${currency}${totalSpent.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> ${threshold}% reached</p>
                </div>
                <p>Consider reviewing your expenses to stay within your financial goals.</p>
                <br>
                <p>Best Regards,<br><strong>TrackExpense Team</strong></p>
            </div>
        `,
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('--- EMAIL MOCK (Credentials missing in .env) ---');
            console.log(`To: ${userEmail}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: User ${userName} utilized ${threshold}% of ${category} budget (${currency}${totalSpent} / ${currency}${limit})`);
            console.log('-----------------------------------------------');
            return true;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent (${threshold}%): ` + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

export async function sendWhatsAppNotification(user, totalSpent, limit, category = "Total", threshold = 100) {
    const phoneNumber = user.phoneNumber;
    if (!phoneNumber) {
        console.log(`[WHATSAPP MOCK] No phone number for user ${user.name}. Skipping.`);
        return false;
    }

    const isTotal = category === "Total";
    const currency = user.currencySymbol || "$";
    const message = threshold === 100 
        ? `🚨 TrackExpense ALERT: Your ${category} budget of ${currency}${limit} has been reached! Current: ${currency}${totalSpent}. Stay on track! 🚀`
        : `⚠️ TrackExpense WARNING: You've used ${threshold}% of your ${category} budget (${currency}${totalSpent} / ${currency}${limit}). Plan ahead! 🚀`;

    console.log('--- WHATSAPP MOCK (Service simulation) ---');
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log('-----------------------------------------');
    return true;
}
