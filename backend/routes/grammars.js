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

module.exports = router;
