// src/services/sms.service.js

const sendSms = async (phone, message) => {

    // TODO:
    // Connect your SMS provider here.

    console.log("SMS");
    console.log("To:", phone);
    console.log("Message:", message);

    return true;
};

module.exports = {
    sendSms
};