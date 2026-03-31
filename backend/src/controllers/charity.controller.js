const Charity = require('../models/charity.model');
const User    = require('../models/user.model');

async function getCharities(req, res) {
    try {
    const { search, category } = req.query;

    // Build query dynamically based on what filters were sent
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      // Case-insensitive search across name and description
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const charities = await Charity.find(query)
      .select('-totalReceived') // hide internal financials from public
      .sort({ isFeatured: -1, name: 1 }); // featured first, then alphabetical

    res.json({ charities });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch charities', error: err.message });
  }
}

async function getFeaturedCharity(req, res) {
    try {
    const charity = await Charity.findOne({ isFeatured: true, isActive: true });

    if (!charity) {
      return res.status(404).json({ message: 'No featured charity set' });
    }

    res.json({ charity });

  } catch (err) {
    res.status(500).json({ message: 'Could not fetch featured charity', error: err.message });
  }
}

async function getSingleCharity(req,res){
     try {
        const charity = await Charity.findOne({ _id: req.params.id, isActive: true });
    
        if (!charity) {
          return res.status(404).json({ message: 'Charity not found' });
        }
    
        res.json({ charity });
    
      } catch (err) {
        res.status(500).json({ message: 'Could not fetch charity', error: err.message });
      }
}

async function selectCharity(req,res){
    try {
        const { charityId, percentage } = req.body;
    
        // Validate charity exists
        const charity = await Charity.findOne({ _id: charityId, isActive: true });
        if (!charity) {
          return res.status(404).json({ message: 'Charity not found' });
        }
    
        // Validate percentage — minimum 10%, maximum 100%
        const contrib = Number(percentage) || 10;
        if (contrib < 10 || contrib > 100) {
          return res.status(400).json({ message: 'Contribution must be between 10% and 100%' });
        }
    
        const user = await User.findByIdAndUpdate(
          req.user.userId,
          {
            selectedCharity:   charityId,
            charityPercentage: contrib,
          },
          { new: true }
        ).populate('selectedCharity', 'name imageUrl'); // return charity name + image
    
        res.json({
          message:           'Charity selection saved',
          selectedCharity:   user.selectedCharity,
          charityPercentage: user.charityPercentage,
        });
    
      } catch (err) {
        res.status(500).json({ message: 'Could not save selection', error: err.message });
      }
}

async function IndependentDonation(req,res){
    try {
        const { charityId, amount } = req.body;
    
        if (!charityId || !amount || amount <= 0) {
          return res.status(400).json({ message: 'charityId and a positive amount are required' });
        }
    
        const charity = await Charity.findOne({ _id: charityId, isActive: true });
        if (!charity) {
          return res.status(404).json({ message: 'Charity not found' });
        }
    
        // In a full build this triggers a Razorpay order just like subscription
        // For now we record the intent and return an order placeholder
        // You will wire this to Razorpay the same way as subscription
    
        res.json({
          message:   'Donation initiated',
          charity:   charity.name,
          amount,
          // orderId: <razorpay order id will go here>
        });
    
      } catch (err) {
        res.status(500).json({ message: 'Donation failed', error: err.message });
      }
}

async function createCharity(req,res){
    try {
        const { name, description, imageUrl, website, category, isFeatured } = req.body;
    
        if (!name || !description) {
          return res.status(400).json({ message: 'name and description are required' });
        }
    
        // If this one is featured, unfeature all others first
        if (isFeatured) {
          await Charity.updateMany({}, { isFeatured: false });
        }
    
        const charity = await Charity.create({
          name, description, imageUrl, website, category,
          isFeatured: isFeatured || false,
        });
    
        res.status(201).json({ message: 'Charity created', charity });
    
      } catch (err) {
        res.status(500).json({ message: 'Could not create charity', error: err.message });
      }
}

async function editCharity(req,res){
    try {
        const updates = req.body;
    
        // If setting as featured, unfeature all others first
        if (updates.isFeatured) {
          await Charity.updateMany({}, { isFeatured: false });
        }
    
        const charity = await Charity.findByIdAndUpdate(
          req.params.id,
          updates,
          { new: true, runValidators: true }
        );
    
        if (!charity) {
          return res.status(404).json({ message: 'Charity not found' });
        }
    
        res.json({ message: 'Charity updated', charity });
    
      } catch (err) {
        res.status(500).json({ message: 'Could not update charity', error: err.message });
      }
    }

async function removeCharity(req,res){
    try {
        const charity = await Charity.findByIdAndUpdate(
          req.params.id,
          { isActive: false },
          { new: true }
        );
    
        if (!charity) {
          return res.status(404).json({ message: 'Charity not found' });
        }
    
        res.json({ message: 'Charity deactivated', charity });
    
      } catch (err) {
        res.status(500).json({ message: 'Could not deactivate charity', error: err.message });
      }
}

async function addEvent(req,res){
    try {
    const { title, date, location, description } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: 'title and date are required' });
    }

    const charity = await Charity.findById(req.params.id);
    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    charity.upcomingEvents.push({ title, date, location, description });
    await charity.save();

    res.status(201).json({ message: 'Event added', events: charity.upcomingEvents });

  } catch (err) {
    res.status(500).json({ message: 'Could not add event', error: err.message });
  }
}

module.exports = {
    getCharities,
    getFeaturedCharity,
    getSingleCharity,
    selectCharity,
    IndependentDonation,
    removeCharity,
    createCharity,
    editCharity,
    addEvent
}


