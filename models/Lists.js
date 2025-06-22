const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listName: String,
  dietType: String,
  allergies: [String],
  maxCost: Number,
  servingSize: Number,
  duration: Number,

  // ✅ This was previously outside — now it's correctly inside the schema
  generatedData: {
    type: Object,
    required: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('List', listSchema);
