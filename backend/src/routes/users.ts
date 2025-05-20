import express from "express";
import { AuthenticatedRequest } from "../types/api";

const router = express.Router();

/* GET users listing. */
router.get("/", (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    message: "Users API",
    data: [],
  });
});

export default router;
