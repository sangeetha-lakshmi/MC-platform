const router = require("express").Router();
const { vendorLogin } = require("./auth.controller");

router.post("/vendor/login", vendorLogin);

module.exports = router;
