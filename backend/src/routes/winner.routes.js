const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const router = express.Router();
const User    = require('../models/user.model');
const upload  = require('../utils/upload');
const {
  getMyWins,
  uploadProof,
  getPendingVerifications,
  getAllWinners,
  approveWinner,
  markWinnerAsPaid,
} = require("../controllers/winner.controller");

//SUBSCRIBER: get my wins across all draws
router.get("/my-wins", requireAuth, getMyWins);

//  SUBSCRIBER: upload proof screenshot
router.post(
  "/upload-proof/:drawMonth/:winnerId",
  requireAuth,
  upload.single("proof"), // 'proof' must match the field name in the form
  uploadProof,
);

// ADMIN: get all winners pending verification
router.get(
  "/admin/pending",
  requireAuth,
  requireAdmin,
  getPendingVerifications,
);

// ADMIN: get ALL winners across all draws
router.get("/admin/all", requireAuth, requireAdmin, getAllWinners);

// ADMIN: approve a winner
router.patch(
  "/admin/verify/:drawMonth/:winnerId",
  requireAuth,
  requireAdmin,
  approveWinner,
);

// ADMIN: mark a winner as paid
router.patch(
  "/admin/mark-paid/:drawMonth/:winnerId",
  requireAuth,
  requireAdmin,
  markWinnerAsPaid,
);

module.exports = router;
