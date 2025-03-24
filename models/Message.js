const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add compound index for efficient room-based queries with timestamp sorting
messageSchema.index({ room: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);