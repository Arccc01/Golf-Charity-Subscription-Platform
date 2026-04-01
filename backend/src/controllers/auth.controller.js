const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

async function userRegisterController(req, res) {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    // Hash the password — never store plain text
    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, password: hashed });

    // Create JWT — this is what the frontend stores and sends with every request
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role,
              subscription: user.subscription }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role,
              subscription: user.subscription }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}


async function getme(req,res){
  try{
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('selectedCharity', 'name imageUrl');
     if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });

  }catch(err){
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = {userRegisterController,userLoginController,getme}