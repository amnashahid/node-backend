async function sendOtpSms(phone, otp) {
  if (process.env.OTP_DEBUG === "true") {
    console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`);
    return;
  }

  const url = process.env.VEEVO_SMS_URL;
  
  var data = {
  "apikey": process.env.VEEVO_HASH,
  "receivernum": phone,
  "sendernum": "Default",
  "textmessage": process.env.OTP_MESSAGE.replace("[OTP]", otp)
  };

  var response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
}

module.exports = { sendOtpSms };