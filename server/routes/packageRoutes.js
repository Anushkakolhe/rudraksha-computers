const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addPackage,
  getAllPackages,
  getPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/packageController");

router.use(authMiddleware);

router.post("/", addPackage);
router.get("/", getAllPackages);
router.get("/:id", getPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

module.exports = router;
