const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const List = require('../models/Lists');
const authMiddleware = require('../middleware/auth');
const { OpenAI } = require('openai');
const groceryPrompt = require('../services/groceryPrompt');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Retry with exponential backoff for 429 errors
async function callWithRateLimitHandling(apiFunc, args, maxRetries = 5) {
  let delayMs = 1100; // Start with a 1.1 second delay by default
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await delay(delayMs); // Add this delay before each attempt
      return await apiFunc(...args);
    } catch (err) {
      if (err.status === 429 && attempt < maxRetries - 1) {
        // Exponential backoff: double the wait each retry
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error('Exceeded retry limit for OpenAI rate limiting.');
}

router.post('/generate', authMiddleware, async (req, res) => {
  const { listName, dietType, allergies, maxCost, servingSize, duration, createdAt } = req.body;

  try {
    // 1. Build the full prompt string
    const systemPrompt = groceryPrompt.description;
    const userPrompt = `
        You are an API generator. Respond ONLY with raw JSON — NO markdown, NO explanations, NO headings, and NO extra text.

        Your output must exactly match this structure:

        {
          "Produce": [{ "Item": "string", "Quantity": number, "Price": number }],
          "Dairy": [],
          "MeatProtein": [],
          "FreezerGoods": [],
          "CannedGoods": [],
          "OtherGroceryItems": [],
          "recipes": [
            {
              "title": "string",
              "description": "string",
              "ingredients": [{ "item": "string", "quantity": "string" }],
              "instructions": ["string"],
              "prepTimeMinutes": number,
              "cookTimeMinutes": number,
              "servings": number
            }
          ]
        }

        Using:
        - Diet type: ${dietType}
        - Allergies: ${allergies.join(', ') || 'None'}
        - Max cost: $${maxCost}
        - Serving size: ${servingSize}
        - Duration: ${duration} days

        ⚠️ Output only the JSON object. Do NOT include \`\`\`, ###, or any other markdown. Do NOT include trailing commas. The object must be parsable by \`JSON.parse()\`.
        `;


    // 2. Call OpenAI
    const aiResponse = await callWithRateLimitHandling(
      (...apiArgs) => openai.chat.completions.create(...apiArgs),
      [{
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      }]
    );

    // 3. Parse AI response
    const content = aiResponse.choices[0].message.content.trim();
    const parsed = JSON.parse(content); // Assume the output is JSON-formatted JS object

 
    // 4. Save to MongoDB
    const newList = new List({
      userId: req.userId,
      listName,
      dietType,
      allergies,
      maxCost,
      servingSize,
      duration,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      generatedData: parsed 
    });

    const savedList = await newList.save();
    res.status(201).json(savedList);

  } catch (err) {
    console.error('Error generating list:', err);
    res.status(500).json({ message: 'Failed to generate list' });
  }
});


// POST / - create a new list for logged-in user
router.post('/', authMiddleware, async (req, res) => {
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

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userLists = await List.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(userLists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /:id - get a specific list by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.userId) });
    if (!list) return res.status(404).json({ message: 'List not found' });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { listName } = req.body;
    if (!listName) return res.status(400).json({ message: 'List name is required.' });

    console.log('PUT /:id body:', req.body);
    console.log('PUT /:id user:', req.userId);

    const list = await List.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.userId) },
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
