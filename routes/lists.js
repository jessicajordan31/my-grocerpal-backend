// routes/lists.js
const express = require('express');
const router = express.Router();
const List = require('../models/Lists');
const authMiddleware = require('../middleware/auth');
// const { Configuration, OpenAIApi } = require('openai');
// const groceryPrompt = require('../services/groceryPrompt');

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);

// POST /api/lists - create a new list for logged-in user
router.post('/lists', authMiddleware, async (req, res) => {
  try {
    const { listName, dietType, allergies, maxCost, servingSize, duration, createdAt } = req.body;

    const newList = new List({
      userId: req.userId,
      listName,
      dietType,
      allergies,
      maxCost,
      servingSize,
      duration,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    });

    const savedList = await newList.save();
    res.status(201).json(savedList);
  } catch (error) {
    console.error('Error saving list:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/lists', authMiddleware, async (req, res) => {
  try {
    const userLists = await List.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(userLists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/lists - get all lists for logged-in user
router.get('/lists', authMiddleware, async (req, res) => {
  try {
    const lists = await List.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/lists/:id', authMiddleware, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, userId: req.userId });
    if (!list) return res.status(404).json({ message: 'List not found' });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/lists/:id', authMiddleware, async (req, res) => {
  try {
    const { listName } = req.body;
    if (!listName) return res.status(400).json({ message: 'List name is required.' });

    const list = await List.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { listName },
      { new: true }
    );

    if (!list) return res.status(404).json({ message: 'List not found.' });

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});



module.exports = router;
