async function sendOtpSms(phone, otp) {
  if (process.env.OTP_DEBUG === "true") {
    console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`);
    return;
  }


}

module.exports = { sendOtpSms };