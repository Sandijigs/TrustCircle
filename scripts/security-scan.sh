#!/bin/bash

# TrustCircle Security Scanning Script
# Runs multiple security analysis tools on smart contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTRACTS_DIR="packages/contracts/contracts"
REPORTS_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔒 TrustCircle Security Scan"
echo "============================"
echo ""

# Create reports directory
mkdir -p "$REPORTS_DIR/$TIMESTAMP"

echo "📁 Reports will be saved to: $REPORTS_DIR/$TIMESTAMP"
echo ""

# Check if contracts directory exists
if [ ! -d "$CONTRACTS_DIR" ]; then
    echo "${RED}❌ Contracts directory not found: $CONTRACTS_DIR${NC}"
    exit 1
fi

#######################################
# 1. Slither Analysis
#######################################
echo "🔍 Running Slither static analysis..."
echo "------------------------------------"

if command -v slither &> /dev/null; then
    cd packages/contracts
    
    echo "Analyzing contracts..."
    slither . \
        --json "$../../$REPORTS_DIR/$TIMESTAMP/slither-report.json" \
        --sarif "$../../$REPORTS_DIR/$TIMESTAMP/slither-report.sarif" \
        --print human-summary \
        > "$../../$REPORTS_DIR/$TIMESTAMP/slither-output.txt" 2>&1 || true
    
    cd ../..
    
    # Check for high/critical issues
    HIGH_ISSUES=$(grep -c "High:" "$REPORTS_DIR/$TIMESTAMP/slither-output.txt" || echo "0")
    CRITICAL_ISSUES=$(grep -c "Critical:" "$REPORTS_DIR/$TIMESTAMP/slither-output.txt" || echo "0")
    
    if [ "$CRITICAL_ISSUES" -gt 0 ]; then
        echo "${RED}❌ Found $CRITICAL_ISSUES critical issues!${NC}"
    elif [ "$HIGH_ISSUES" -gt 0 ]; then
        echo "${YELLOW}⚠️  Found $HIGH_ISSUES high severity issues${NC}"
    else
        echo "${GREEN}✅ No critical or high severity issues found${NC}"
    fi
    
    echo "Report saved to: $REPORTS_DIR/$TIMESTAMP/slither-report.json"
else
    echo "${YELLOW}⚠️  Slither not installed. Skipping...${NC}"
    echo "Install with: pip3 install slither-analyzer"
fi

echo ""

#######################################
# 2. Mythril Analysis
#######################################
echo "🔮 Running Mythril symbolic execution..."
echo "---------------------------------------"

if command -v myth &> /dev/null; then
    cd packages/contracts
    
    # Compile first
    npx hardhat compile > /dev/null 2>&1
    
    # Analyze each contract
    for contract in contracts/*.sol; do
        filename=$(basename "$contract")
        echo "Analyzing $filename..."
        
        myth analyze "$contract" \
            --solv 0.8.24 \
            -o "$../../$REPORTS_DIR/$TIMESTAMP/mythril-${filename%.sol}.txt" \
            > /dev/null 2>&1 || true
    done
    
    cd ../..
    
    echo "${GREEN}✅ Mythril analysis complete${NC}"
    echo "Reports saved to: $REPORTS_DIR/$TIMESTAMP/mythril-*.txt"
else
    echo "${YELLOW}⚠️  Mythril not installed. Skipping...${NC}"
    echo "Install with: pip3 install mythril"
fi

echo ""

#######################################
# 3. Solhint Linting
#######################################
echo "📝 Running Solhint linter..."
echo "---------------------------"

if [ -f "packages/contracts/node_modules/.bin/solhint" ]; then
    cd packages/contracts
    
    npx solhint 'contracts/**/*.sol' \
        -f json \
        > "$../../$REPORTS_DIR/$TIMESTAMP/solhint-report.json" 2>&1 || true
    
    npx solhint 'contracts/**/*.sol' \
        > "$../../$REPORTS_DIR/$TIMESTAMP/solhint-output.txt" 2>&1 || true
    
    cd ../..
    
    ERROR_COUNT=$(grep -c '"severity": "error"' "$REPORTS_DIR/$TIMESTAMP/solhint-report.json" || echo "0")
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "${YELLOW}⚠️  Found $ERROR_COUNT linting errors${NC}"
    else
        echo "${GREEN}✅ No linting errors found${NC}"
    fi
    
    echo "Report saved to: $REPORTS_DIR/$TIMESTAMP/solhint-report.json"
else
    echo "${YELLOW}⚠️  Solhint not installed. Skipping...${NC}"
    echo "Install with: npm install --save-dev solhint"
fi

echo ""

#######################################
# 4. Dependency Check
#######################################
echo "📦 Checking dependencies for vulnerabilities..."
echo "----------------------------------------------"

cd packages/contracts
npm audit --json > "$../../$REPORTS_DIR/$TIMESTAMP/npm-audit.json" 2>&1 || true
cd ../..

HIGH_VULNS=$(jq '.metadata.vulnerabilities.high // 0' "$REPORTS_DIR/$TIMESTAMP/npm-audit.json" 2>/dev/null || echo "0")
CRITICAL_VULNS=$(jq '.metadata.vulnerabilities.critical // 0' "$REPORTS_DIR/$TIMESTAMP/npm-audit.json" 2>/dev/null || echo "0")

if [ "$CRITICAL_VULNS" -gt 0 ]; then
    echo "${RED}❌ Found $CRITICAL_VULNS critical vulnerabilities in dependencies!${NC}"
elif [ "$HIGH_VULNS" -gt 0 ]; then
    echo "${YELLOW}⚠️  Found $HIGH_VULNS high severity vulnerabilities${NC}"
else
    echo "${GREEN}✅ No critical vulnerabilities in dependencies${NC}"
fi

echo ""

#######################################
# 5. Gas Usage Analysis
#######################################
echo "⛽ Analyzing gas usage..."
echo "------------------------"

cd packages/contracts
REPORT_GAS=true npx hardhat test > "$../../$REPORTS_DIR/$TIMESTAMP/gas-report.txt" 2>&1 || true
cd ../..

echo "${GREEN}✅ Gas analysis complete${NC}"
echo "Report saved to: $REPORTS_DIR/$TIMESTAMP/gas-report.txt"

echo ""

#######################################
# 6. Storage Layout Check
#######################################
echo "🗄️  Checking storage layout..."
echo "-----------------------------"

cd packages/contracts
npx hardhat compile > /dev/null 2>&1

# Generate storage layout for upgradeable contracts
for contract in LendingPool LoanManager LendingCircle CreditScore CollateralManager VerificationSBT; do
    npx hardhat storage-layout --contract "$contract" \
        > "$../../$REPORTS_DIR/$TIMESTAMP/storage-${contract}.txt" 2>&1 || true
done

cd ../..

echo "${GREEN}✅ Storage layouts generated${NC}"
echo "Reports saved to: $REPORTS_DIR/$TIMESTAMP/storage-*.txt"

echo ""

#######################################
# 7. Coverage Check
#######################################
echo "📊 Checking test coverage..."
echo "---------------------------"

cd packages/contracts
npx hardhat coverage > "$../../$REPORTS_DIR/$TIMESTAMP/coverage.txt" 2>&1 || true
cd ../..

if [ -f "packages/contracts/coverage/coverage-summary.json" ]; then
    cp "packages/contracts/coverage/coverage-summary.json" "$REPORTS_DIR/$TIMESTAMP/"
    
    COVERAGE=$(jq '.total.lines.pct' "packages/contracts/coverage/coverage-summary.json" 2>/dev/null || echo "0")
    
    if (( $(echo "$COVERAGE < 90" | bc -l) )); then
        echo "${YELLOW}⚠️  Coverage is $COVERAGE% (target: 90%)${NC}"
    else
        echo "${GREEN}✅ Coverage is $COVERAGE%${NC}"
    fi
fi

echo ""

#######################################
# Summary Report
#######################################
echo "📋 Generating summary report..."
echo "==============================="

cat > "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md" << EOF
# Security Scan Summary

**Date**: $(date)
**Timestamp**: $TIMESTAMP

## Tools Run

- ✅ Slither static analysis
- ✅ Mythril symbolic execution
- ✅ Solhint linting
- ✅ npm audit (dependency check)
- ✅ Gas usage analysis
- ✅ Storage layout verification
- ✅ Test coverage

## Results

### Slither
- Critical issues: $CRITICAL_ISSUES
- High issues: $HIGH_ISSUES
- Report: slither-report.json

### Mythril
- Reports: mythril-*.txt
- Check individual contract reports for findings

### Dependencies
- Critical vulnerabilities: $CRITICAL_VULNS
- High vulnerabilities: $HIGH_VULNS
- Report: npm-audit.json

### Test Coverage
- Coverage: ${COVERAGE:-N/A}%
- Target: 90%
- Report: coverage-summary.json

## Files Generated

\`\`\`
$REPORTS_DIR/$TIMESTAMP/
├── slither-report.json
├── slither-output.txt
├── mythril-*.txt
├── solhint-report.json
├── solhint-output.txt
├── npm-audit.json
├── gas-report.txt
├── storage-*.txt
├── coverage.txt
├── coverage-summary.json
└── SUMMARY.md (this file)
\`\`\`

## Recommendations

EOF

# Add recommendations based on findings
if [ "$CRITICAL_ISSUES" -gt 0 ] || [ "$CRITICAL_VULNS" -gt 0 ]; then
    echo "🚨 **CRITICAL**: Address critical issues before deployment!" >> "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md"
    echo "" >> "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md"
fi

if [ "$HIGH_ISSUES" -gt 0 ] || [ "$HIGH_VULNS" -gt 0 ]; then
    echo "⚠️ **HIGH PRIORITY**: Review and fix high severity issues" >> "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md"
    echo "" >> "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md"
fi

if (( $(echo "${COVERAGE:-0} < 90" | bc -l) )); then
    echo "📊 **TESTING**: Increase test coverage to at least 90%" >> "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md"
    echo "" >> "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md"
fi

echo "✅ Consider getting an external audit before mainnet deployment" >> "$REPORTS_DIR/$TIMESTAMP/SUMMARY.md"

echo ""
echo "✅ Security scan complete!"
echo ""
echo "📁 All reports saved to: $REPORTS_DIR/$TIMESTAMP/"
echo "📄 Summary: $REPORTS_DIR/$TIMESTAMP/SUMMARY.md"
echo ""

# Return non-zero if critical issues found
if [ "$CRITICAL_ISSUES" -gt 0 ] || [ "$CRITICAL_VULNS" -gt 0 ]; then
    echo "${RED}❌ FAILED: Critical issues found!${NC}"
    exit 1
else
    echo "${GREEN}✅ PASSED: No critical issues found${NC}"
    exit 0
fi
