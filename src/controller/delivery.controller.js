const deliveryService = require("../modules/delivery/delivery.service");

const registerDeliveryPartner = async (req, res) => {
  try {
    await deliveryService.register(req.body);

    res.status(201).json({
      message: "Delivery partner registered successfully. Await admin approval."
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

module.exports = { registerDeliveryPartner };
