#!/bin/bash

echo "🔍 Starting contract verification on Celo Sepolia..."
echo "================================================"
echo ""

# Implementation addresses extracted from .openzeppelin/unknown-11142220.json
# These are the actual contract implementations behind the proxies

echo "1️⃣ Verifying CreditScore implementation..."
echo "   Implementation: 0xc174678cc24B372a509A08dFA8d00f7AC678c459"
npx hardhat verify --network celoSepolia 0xc174678cc24B372a509A08dFA8d00f7AC678c459 2>&1 | grep -E "(Successfully|already verified|Error)"
echo ""

echo "2️⃣ Verifying VerificationSBT implementation..."
echo "   Implementation: 0x105003a5f52eA5D7d3a0872A467971bC31675376"
npx hardhat verify --network celoSepolia 0x105003a5f52eA5D7d3a0872A467971bC31675376 2>&1 | grep -E "(Successfully|already verified|Error)"
echo ""

echo "3️⃣ Verifying LendingPool implementation..."
echo "   Implementation: 0xe1819a138D693365A89672547AA367b9cAE53f8A"
npx hardhat verify --network celoSepolia 0xe1819a138D693365A89672547AA367b9cAE53f8A 2>&1 | grep -E "(Successfully|already verified|Error)"
echo ""

echo "4️⃣ Verifying CollateralManager implementation..."
echo "   Implementation: 0x6aE13c03b1d02AB11e175ca5E41EE3978164e007"
npx hardhat verify --network celoSepolia 0x6aE13c03b1d02AB11e175ca5E41EE3978164e007 2>&1 | grep -E "(Successfully|already verified|Error)"
echo ""

echo "5️⃣ Verifying LoanManager implementation..."
echo "   Implementation: 0x68C0f498e38743953E61c5C8570398E5eC30e9ac"
npx hardhat verify --network celoSepolia 0x68C0f498e38743953E61c5C8570398E5eC30e9ac 2>&1 | grep -E "(Successfully|already verified|Error)"
echo ""

echo "6️⃣ Verifying LendingCircle implementation..."
echo "   Implementation: 0xa12063512C4dB065C76e8E1CD5cfeBEe3E8E20e6"
npx hardhat verify --network celoSepolia 0xa12063512C4dB065C76e8E1CD5cfeBEe3E8E20e6 2>&1 | grep -E "(Successfully|already verified|Error)"
echo ""

echo "================================================"
echo "✅ Verification process completed!"
echo ""
echo "📝 View verified contracts on Blockscout:"
echo "   CreditScore: https://celo-sepolia.blockscout.com/address/0x72Bf1C4C09448FF83674902ADe69929068138c84"
echo "   VerificationSBT: https://celo-sepolia.blockscout.com/address/0x57B54527C6d4847A08cf9Af74D1Aad933CA25A8F"
echo "   LendingPool: https://celo-sepolia.blockscout.com/address/0xFce2564f7085A26666410d9b173755fec7141333"
echo "   CollateralManager: https://celo-sepolia.blockscout.com/address/0x62B863Fe95D9Be0F39281419bD02A9D30d10FeF5"
echo "   LoanManager: https://celo-sepolia.blockscout.com/address/0x5C8D2d24f137C0488219BD528bD1bE0a05bcB5d0"
echo "   LendingCircle: https://celo-sepolia.blockscout.com/address/0xa50dc2936694D0628d8D8158D712143e4cBBb0C2"
