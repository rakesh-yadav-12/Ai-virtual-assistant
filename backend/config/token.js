import jwt from "jsonwebtoken";

const genToken = (userId) => {
  try {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
  } catch (error) {
    console.error("JWT sign error:", error.message);
    return null;
  }
};

export default genToken;