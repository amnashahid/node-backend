const jwt = require("jsonwebtoken");

const generateToken = (userId, options = {}) => {


    console.log("Generating token for userId:", userId);
  return jwt.sign(
    {
      userId: userId.toString(),
      ...options
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1y"// options.purpose === "complete-profile"
      //   ? "15m"
      //   : "30d"
    }
  );
};

module.exports = generateToken;