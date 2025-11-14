import * as dotenv from "dotenv";

dotenv.config();

console.log("Environment variables check:");
console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
console.log("PRIVATE_KEY starts with:", process.env.PRIVATE_KEY?.substring(0, 10));

if (process.env.PRIVATE_KEY) {
  console.log("✅ PRIVATE_KEY found");
} else {
  console.log("❌ PRIVATE_KEY not found");
}
