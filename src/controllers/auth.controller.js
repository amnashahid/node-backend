// src/controllers/auth.controller.js

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const {
    createOtp,
    verifyOtp
} = require("../services/otp.service");

const {
    sendSms
} = require("../services/sms.service");

const {
    normalizePakistaniPhone
} = require("../utils/phone");

const register = async (req, res, next) => {

    try {

        const {
            phone,
            language
        } = req.body;

        if (!phone || !language) {
            return res.status(400).json({
                success: false,
                message: "Phone and language are required"
            });
        }

        if (!["en", "ur"].includes(language)) {
            return res.status(400).json({
                success: false,
                message: "Invalid language"
            });
        }

        const normalizedPhone =
            normalizePakistaniPhone(phone);

        let user = await User.findOne({
            phone: normalizedPhone
        });
        if (user && user.phoneVerified) {
            return res.status(409).json({
                success: false,
                message: "Phone number is already registered"
            });
        }

        const otp = await createOtp(normalizedPhone);

        if (!user) {
            user = await User.create({
                phone: normalizedPhone,
                language,
                otp
            });
        } else {
            user.language = language;
            user.otp = otp;
            await user.save();
        }

        await sendSms(
            normalizedPhone,
            `Your verification code is ${otp}`
        );

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            data: {
                phone: normalizedPhone
            }
        });

    } catch (error) {
        next(error);
    }
};


const verifyPhoneOtp = async (req, res, next) => {

    try {

        const {
            phone,
            otp
        } = req.body;

        const normalizedPhone =
            normalizePakistaniPhone(phone);

        await verifyOtp(
            normalizedPhone,
            otp
        );

        const user = await User.findOneAndUpdate(
            {
                phone: normalizedPhone
            },
            {
                phoneVerified: true
            },
            {
                new: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Phone verified successfully",
            data: {
                userId: user._id,
                phoneVerified: true,
                profileCompleted: user.profileCompleted,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        next(error);
    }
};
const completeProfile = async (req, res, next) => {

    try {

const id = req.user._id;
        const {
            name,
            email,
            location,
            latitude,
            longitude,
            addresses,
            
        } = req.body;

        const userId = id;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        
        const completeProfile = await  User.findOne({
        _id: req.user._id
        });

        await User.updateOne(
            {
                _id: req.user._id
            },
            {
                name,
                email,
                location,
                latitude,
                longitude,
                addresses
            }
        );
        const updatedProfile = await  User.findOne({
                _id: req.user._id
        }).select("-__v");
           var user = {
                userId: userId,
                name: updatedProfile.name,
                latitude: updatedProfile.latitude,
                longitude: updatedProfile.longitude,
                phone: updatedProfile.phone,
                profileCompleted: true,
                addresses : updatedProfile.addresses.map(address => 
                {
                    return {
                        addressId: address._id,
                    address: address.adddress,
                    latitude: address.latitude,
                    longitude: address.longitude,
                    isDefault: address.isDefault,
                    label: address.label,
                    
                        
                    }
                })
            }
        return res.status(200).json({
            success: true,
            message: "Profile completed successfully",
            data: user
        });

    } catch (error) {
        next(error);
    }
};

const adminLogin = async (req, res, next) => {

    try {


        const {
            phone
        } = req.body;

         let user = await User.findOne({
            phone: phone
        });

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token: generateToken(user._id)
        });

    } catch (error) {
        next(error);
    }
};
module.exports = {
    register,
    verifyPhoneOtp,
    completeProfile,
    adminLogin
};