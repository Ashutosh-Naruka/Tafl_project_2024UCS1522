const express = require('express');
const router = express.Router();
const Grammar = require('../models/Grammar');

// Get all grammars
router.get('/', async (req, res) => {
  try {
    const grammars = await Grammar.find().sort({ createdAt: -1 });
    res.json(grammars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a grammar
router.post('/', async (req, res) => {
  const grammar = new Grammar({
    name: req.body.name,
    description: req.body.description,
    rulesText: req.body.rulesText
  });
  try {
    const newGrammar = await grammar.save();
    res.status(201).json(newGrammar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a grammar
router.put('/:id', async (req, res) => {
  try {
    const updatedGrammar = await Grammar.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedGrammar) return res.status(404).json({ message: 'Grammar not found' });
    res.json(updatedGrammar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a grammar
router.delete('/:id', async (req, res) => {
  try {
    const deletedGrammar = await Grammar.findByIdAndDelete(req.params.id);
    if (!deletedGrammar) return res.status(404).json({ message: 'Grammar not found' });
    res.json({ message: 'Deleted grammar' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
