const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Please add a title'], 
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: { 
    type: String, 
    required: [true, 'Please add content'] 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  tags: [String],
}, { 
  timestamps: true 
});

postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);