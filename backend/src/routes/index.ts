import express from "express";

const router = express.Router();

/* GET home page. */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Gamification CS API",
    version: "1.0.0",
    status: "operational",
  });
});

export default router;
