const express = require("express");
const router = express.Router();
const CrownScore = require("../models/CrownRanking");
const User = require("../models/User");
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/update-crown-score", async (req, res) => {
  try {
    const { deviceid, username, country = "PL" } = req.body;

    if (!deviceid || !username) {
      return res.status(400).json({ 
        error: "Something is missing",
        received: req.body
      });
    }

    const user = await User.findOne({ deviceID: deviceid });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const existingScore = await CrownScore.findOne({ deviceid });
    let crowns = 1;

    if (existingScore) {
      existingScore.crowns += 1;
      existingScore.username = username;
      existingScore.country = country;
      existingScore.lastUpdated = new Date();
      crowns = existingScore.crowns;
      await existingScore.save();
    } else {
      const newScore = new CrownScore({
        deviceid,
        username,
        crowns: 1,
        country
      });
      await newScore.save();
    }

    const ranking = await CrownScore.find().sort({ crowns: -1 }).limit(100);

    return res.json({
      message: "Ranking was updated rn",
      crowns,
      ranking
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Internal Error." });
  }
});


router.get("/user-crown-score/:deviceid", async (req, res) => {
  try {
    const score = await CrownScore.findOne({ deviceid: req.params.deviceid });
    
    if (!score) {
      return res.status(404).json({ error: "User crown score not found." });
    }

    res.json({
      username: score.username,
      crowns: score.crowns,
      country: score.country,
      position: "To be calculated"
    });
  } catch (err) {
    res.status(500).json({ error: "Server Internal Error." });
  }
});

router.get("/highscore/crowns/list", async (req, res) => {
  try {
    const scores = await CrownScore.find()
      .sort({ crowns: -1 })
      .select("username crowns country deviceid -_id");

    res.json({
      total: scores.length,
      scores: scores.map(score => ({
        user: {
          username: score.username,
          crowns: score.crowns.toString(),
          country: score.country,
          deviceid: score.deviceid
        }
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Server Internal Error." });
  }
});

module.exports = router;
