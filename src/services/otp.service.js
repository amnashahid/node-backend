// src/services/otp.service.js

const crypto = require("crypto");
const Otp = require("../models/Otp");

const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

const createOtp = async (phone) => {

    const existing = await Otp.findOne({ phone });

    if (existing && existing.attempts >= 5) {
        throw new Error("Maximum OTP attempts reached");
    }

    const otp = generateOtp();

    const otpHash = hashOtp(otp);

    await Otp.findOneAndUpdate(
        { phone },
        {
            phone,
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            $inc: {
                attempts: 1
            }
        },
        {
            upsert: true,
            new: true
        }
    );

    return otp;
};

const verifyOtp = async (phone, otp) => {

    const record = await Otp.findOne({ phone });

    if (!record) {
        throw new Error("OTP not found");
    }

    if (record.expiresAt < new Date()) {
        throw new Error("OTP has expired");
    }

    const otpHash = hashOtp(otp);

    if (otpHash !== record.otpHash) {
        throw new Error("Invalid OTP");
    }

    await Otp.deleteOne({ _id: record._id });

    return true;
};

module.exports = {
    createOtp,
    verifyOtp
};