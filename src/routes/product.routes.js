const express = require("express");
const router = express.Router();
const controller = require("../controller/product.controller");
const auth = require("../middlewares/auth.middleware");

// only logged-in vendor can access
const upload = require("../middlewares/upload.middleware");

router.post(
  "/",
  auth,
  upload.single("image"),   // 👈 VERY IMPORTANT
  controller.create
);

router.get("/template", auth, controller.getProductTemplate);
router.get("/", auth, controller.getAll);
router.get("/:id", auth, controller.getOne);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.remove);
router.patch("/:id/live", controller.updateLiveStatus);

module.exports = router;
