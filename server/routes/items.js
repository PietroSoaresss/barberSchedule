const express = require("express");
const Item = require("../models/Item");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: "Invalid item id" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, quantity } = req.body;
    const item = await Item.create({ name, description, quantity });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: "Invalid item data" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description, quantity } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { name, description, quantity },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: "Invalid item data" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Invalid item id" });
  }
});

module.exports = router;
