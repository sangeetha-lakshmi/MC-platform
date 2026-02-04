const express = require("express");
const router = express.Router();
const controller = require("../controller/product.controller");
const auth = require("../middlewares/auth.middleware");

// only logged-in vendor can access
router.get("/template", auth, controller.getProductTemplate);
router.get("/", auth, controller.getAll);
router.get("/:id", auth, controller.getOne);
router.post("/", auth, controller.create);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.remove);

module.exports = router;
