const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") });

const userSchema = new mongoose.Schema({
    role: String
}, { collection: 'users' });

const User = mongoose.model("UserCheck", userSchema);

async function checkRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuskart");
        console.log("Connected to MongoDB");
        const users = await User.find({}, 'role');
        const distribution = {};
        users.forEach(u => {
            distribution[u.role] = (distribution[u.role] || 0) + 1;
        });
        console.log("Role distribution:", JSON.stringify(distribution, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkRoles();
