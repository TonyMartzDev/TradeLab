const express = require('express');
const router = express.Router();
const { db, run, get, all } = require('../db/database');

// Get all trades
router.get('/', async (req, res) => {
  try {
    const trades = await all('SELECT * FROM trades ORDER BY date DESC');
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trades', error: err.message });
  }
});

// Get recent trades (last 10)
router.get('/recent', async (req, res) => {
  try {
    const trades = await all('SELECT * FROM trades ORDER BY date DESC LIMIT 10');
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recent trades', error: err.message });
  }
});

// Get single trade
router.get('/:id', async (req, res) => {
  try {
    // Try finding by trade_id first, then by database id
    let trade = await get('SELECT * FROM trades WHERE trade_id = ?', [req.params.id]);
    if (!trade) {
      trade = await get('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    }
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    res.json(trade);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trade', error: err.message });
  }
});

// Create new trade
router.post('/', async (req, res) => {
  const {
    trade_id, // Frontend-generated ID
    date,
    symbol,
    direction,
    market,
    entryPrice,
    exitPrice,
    quantity,
    investment,
    pnl,
    roi,
    notes
  } = req.body;

  try {
    // Check if trade_id already exists
    const existingTrade = await get('SELECT id FROM trades WHERE trade_id = ?', [trade_id]);
    if (existingTrade) {
      return res.status(409).json({ message: 'Trade with this ID already exists' });
    }

    const result = await run(
      `INSERT INTO trades (
        trade_id, date, symbol, direction, market, entryPrice, exitPrice,
        quantity, investment, pnl, roi, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [trade_id, date, symbol, direction, market, entryPrice, exitPrice, quantity, investment, pnl, roi, notes]
    );
    
    const newTrade = await get('SELECT * FROM trades WHERE id = ?', [result.id]);
    res.status(201).json(newTrade);
  } catch (err) {
    res.status(500).json({ message: 'Error creating trade', error: err.message });
  }
});

// Update trade
router.put('/:id', async (req, res) => {
  const {
    date,
    symbol,
    direction,
    market,
    entryPrice,
    exitPrice,
    quantity,
    investment,
    pnl,
    roi,
    notes
  } = req.body;

  try {
    await run(
      `UPDATE trades SET
        date = ?,
        symbol = ?,
        direction = ?,
        market = ?,
        entryPrice = ?,
        exitPrice = ?,
        quantity = ?,
        investment = ?,
        pnl = ?,
        roi = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [date, symbol, direction, market, entryPrice, exitPrice, quantity, investment, pnl, roi, notes, req.params.id]
    );
    
    const updatedTrade = await get('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    if (!updatedTrade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    res.json(updatedTrade);
  } catch (err) {
    res.status(500).json({ message: 'Error updating trade', error: err.message });
  }
});

// Delete trade
router.delete('/:id', async (req, res) => {
  try {
    const trade = await get('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    
    await run('DELETE FROM trades WHERE id = ?', [req.params.id]);
    res.json({ message: 'Trade deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting trade', error: err.message });
  }
});

module.exports = router;
