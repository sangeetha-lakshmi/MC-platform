const express = require("express");
const router = express.Router();
const controller = require("../controller/product.controller");
const auth = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

router.post(
  "/",
  auth,
  controller.create
);
// only logged-in vendor can access


router.get("/template", auth, controller.getProductTemplate);
router.get("/", auth, controller.getAll);
router.patch("/:id/toggle-live", auth, controller.toggleLiveStatus);
router.get("/:id", auth, controller.getOne);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.remove);

router.post("/admin/:vendorId",auth,adminMiddleware,controller.addProductByAdmin);
// ADMIN EDIT PRODUCT
router.put(
  "/admin/:id",
  auth,
  adminMiddleware,
  controller.updateProductByAdmin
);

// ADMIN DELETE PRODUCT
router.delete(
  "/admin/:id",
  auth,
  adminMiddleware,
  controller.deleteProductByAdmin
);




module.exports = router;
