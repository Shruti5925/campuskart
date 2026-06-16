const UserDirectory = require('../models/UserDirectory');
const { adminOnly, default: protect } = require('../middleware/authMiddleware');

// Add a new user to the directory (admin only)
exports.addUserToDirectory = async (req, res) => {
  try {
    const { email, collegeId, firstName, lastName, gender, role, graduationYear } = req.body;
    // Basic validation
    if (!email || !collegeId || !firstName || !lastName || !gender) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const userRole = role || 'student';
    if (userRole === 'student' && !graduationYear) {
      return res.status(400).json({ message: 'Graduation year is required for students.' });
    }
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    // Check if email or collegeId already exists in directory
    const existingEmail = await UserDirectory.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'A user with this Email already exists in the directory.' });
    }
    const existingCollegeId = await UserDirectory.findOne({ collegeId: collegeId.trim() });
    if (existingCollegeId) {
      return res.status(400).json({ message: 'A user with this College ID already exists in the directory.' });
    }
    const newUser = new UserDirectory({
      email: normalizedEmail,
      collegeId: collegeId.trim(),
      firstName,
      lastName,
      gender,
      role: userRole,
      graduationYear: userRole === 'student' ? Number(graduationYear) : undefined
    });
    await newUser.save();
    res.status(201).json({ message: 'User added to directory successfully.', user: newUser });
  } catch (err) {
    console.error('Add User to Directory Error:', err);
    res.status(500).json({ message: 'Server error adding user.' });
  }
};
