# TrustCircle Bug Bounty Program

## 🎯 Program Overview

TrustCircle rewards security researchers who help us identify and fix vulnerabilities. We believe in responsible disclosure and fair compensation for valuable contributions.

## 💰 Reward Structure

### Critical (9.0 - 10.0) - Up to $50,000
- Direct loss of user funds
- Unauthorized access to user funds
- Privilege escalation to admin
- Contract takeover
- Critical reentrancy enabling fund theft

### High (7.0 - 8.9) - Up to $10,000
- Temporary freezing of funds
- Griefing attacks affecting availability
- Smart contract fails to deliver promised returns
- Flash loan attacks affecting protocol solvency
- Price oracle manipulation

### Medium (4.0 - 6.9) - Up to $2,000
- Smart contract function incorrect behavior
- Integer overflow/underflow (context-dependent)
- Denial of service (with specific conditions)
- Front-running exploitation
- Gas manipulation attacks

### Low (1.0 - 3.9) - Up to $500
- Smart contract fails to deliver promised returns (limited impact)
- Contract griefing with no economic impact
- Best practice violations
- Informational findings with security implications

### Informational (0.1 - 0.9) - Up to $100
- Code quality issues
- Gas optimization suggestions
- Best practices recommendations

## 🎓 Scope

### In Scope

#### Smart Contracts (Primary)
```
Celo Alfajores Testnet (ChainID: 44787)

LendingPool.sol          - 0x[deployed address]
LoanManager.sol          - 0x[deployed address]
LendingCircle.sol        - 0x[deployed address]
CreditScore.sol          - 0x[deployed address]
CollateralManager.sol    - 0x[deployed address]
VerificationSBT.sol      - 0x[deployed address]
```

#### Frontend (Secondary)
- Web application: https://testnet.trustcircle.finance
- API endpoints: https://api.trustcircle.finance
- Wallet integration components

#### Infrastructure (Limited)
- RPC endpoint security
- API rate limiting
- Authentication mechanisms

### Out of Scope

The following are **NOT eligible** for rewards:
- ❌ Issues already known/reported
- ❌ Social engineering attacks
- ❌ Physical attacks
- ❌ Denial of service attacks requiring massive resources
- ❌ Issues in third-party contracts (WalletConnect, etc.)
- ❌ Best practices without security impact
- ❌ Issues in development/staging environments
- ❌ Vulnerabilities in outdated browsers
- ❌ Self-XSS attacks
- ❌ Clickjacking on non-sensitive pages
- ❌ Missing rate limiting (without demonstrable impact)
- ❌ Missing HTTP security headers (without exploitable vulnerability)
- ❌ SSL/TLS configuration issues
- ❌ SPF/DMARC/DKIM issues
- ❌ Open redirects (without additional security impact)
- ❌ Information disclosure with no security impact

## 📋 Submission Guidelines

### How to Report

1. **Email**: bounty@trustcircle.io
2. **Subject**: `[Bug Bounty] Brief Description`
3. **Encryption**: Use our PGP key (optional but encouraged)

### Required Information

```markdown
## Vulnerability Report

### Summary
[Brief description of the vulnerability]

### Severity
[Your assessment: Critical/High/Medium/Low]

### Description
[Detailed technical description]

### Proof of Concept
[Step-by-step reproduction steps]

### Impact
[Potential damage/exploitation scenario]

### Affected Components
- Contract: [Name and address]
- Function: [Function name]
- Lines of code: [If applicable]

### Recommended Fix
[Your suggested remediation]

### Researcher Info
- Name/Pseudonym: [Your name]
- Email: [Contact email]
- Ethereum Address: [For rewards]
- Twitter/GitHub: [Optional]
```

### Proof of Concept Requirements

**DO:**
- ✅ Test on **Alfajores testnet** only
- ✅ Provide transaction hashes
- ✅ Include code snippets
- ✅ Show actual exploitation
- ✅ Document environment setup

**DON'T:**
- ❌ Test on mainnet
- ❌ Exploit actual user funds
- ❌ Perform excessive transactions (DoS testing)
- ❌ Publicly disclose before resolution
- ❌ Attempt to social engineer team members

## 🔄 Process Timeline

### 1. Submission (Day 0)
- You submit vulnerability report
- We acknowledge receipt within **24 hours**

### 2. Validation (Days 1-3)
- We verify the vulnerability
- Assess severity and impact
- May request additional information

### 3. Remediation (Days 4-30)
- Critical: 7 days max
- High: 14 days max
- Medium: 30 days max
- Low: As resources allow

### 4. Reward Decision (After Fix)
- Severity confirmed
- Reward amount determined
- You receive notification

### 5. Payment (Within 7 days)
- Payment in stablecoin (cUSD) or ETH
- Sent to your provided address
- Public acknowledgment (if you agree)

### 6. Public Disclosure (After 90 days)
- Coordinated disclosure
- Credit given (with your permission)
- Technical write-up published

## 💳 Payment Methods

We pay rewards in:
1. **Celo cUSD** (preferred)
2. **USDC** (on Celo)
3. **ETH** (if requested)

Minimum payout: $100 USD equivalent

## 🏆 Hall of Fame

We publicly recognize researchers (with permission):

### 2025
- [Researcher Name] - Critical vulnerability in [Component]
- [Researcher Name] - High severity issue in [Component]

Want your name here? Find a vulnerability!

## 📜 Rules and Terms

### Eligibility
- Open to anyone, anywhere (subject to local laws)
- TrustCircle team members **not eligible**
- Immediate family of team members **not eligible**
- Must be 18+ or have parental consent

### Responsible Disclosure
By participating, you agree to:
1. **Confidentiality**: Keep vulnerability confidential until resolved
2. **No exploitation**: Don't exploit beyond PoC
3. **Good faith**: Act in good faith, no extortion
4. **Coordination**: Work with us on disclosure timeline
5. **One report per issue**: Don't duplicate reports

### Our Commitments
We commit to:
1. **Acknowledgment**: Respond within 24 hours
2. **Fair assessment**: Evaluate all reports fairly
3. **Timely fixes**: Address critical issues ASAP
4. **Fair rewards**: Pay promised rewards promptly
5. **Recognition**: Credit you publicly (if you agree)
6. **No legal action**: No legal action against good-faith researchers

### Disqualifications
Reports will be **disqualified** if:
- Testing on mainnet
- Exploiting actual user funds
- Violating any laws or regulations
- Social engineering team/users
- Excessive resource consumption (DoS)
- Previously reported
- Out of scope
- Lack of sufficient detail
- Public disclosure before fix

### Reward Determination

Final reward based on:
1. **Severity**: Using CVSS 3.1 scoring
2. **Impact**: Potential damage
3. **Quality**: Report clarity and completeness
4. **Proof of concept**: Demonstrable exploit
5. **Fix suggestion**: Quality of recommended fix

We reserve the right to adjust rewards based on these factors.

## 🔐 Security Best Practices for Researchers

### Testing Environment
```bash
# Use Alfajores testnet
export NETWORK=alfajores
export RPC_URL=https://alfajores-forno.celo-testnet.org

# Never use mainnet
# RPC_URL=https://forno.celo.org # ❌ DON'T
```

### Safe Testing
1. **Create separate wallet** for testing
2. **Use testnet tokens** only
3. **Document everything** you do
4. **Limit scope** of testing
5. **Stop if you find critical issue**

### Example PoC Structure
```javascript
// Bug: Reentrancy in withdraw function
// File: LendingPool.sol
// Function: withdraw()

// Setup
const attack = await AttackContract.deploy(lendingPoolAddress);

// Execute
const tx = await attack.exploit();
await tx.wait();

// Result
// Expected: Can only withdraw once
// Actual: Withdrew twice before balance updated
// Impact: Can drain pool
```

## 📞 Contact

- **Email**: bounty@trustcircle.io
- **PGP Key**: [Link to key]
- **Twitter**: @TrustCircleSec
- **Discord**: TrustCircle #bug-bounty

## ❓ FAQ

### Q: What if I find something but I'm not sure if it's a vulnerability?
**A:** Report it anyway! We'll assess severity and respond accordingly.

### Q: Can I report multiple vulnerabilities?
**A:** Yes! Each unique vulnerability can be reported separately.

### Q: What if someone else found the same bug?
**A:** First valid report gets the reward. Duplicates noted but not rewarded.

### Q: How long until I get paid?
**A:** Within 7 days of fix deployment and reward confirmation.

### Q: Can I remain anonymous?
**A:** Yes, but we need an Ethereum address for payment.

### Q: What if we disagree on severity?
**A:** We'll explain our reasoning. You can provide counter-arguments.

### Q: Can I disclose after 90 days?
**A:** Yes, after coordinated disclosure timeline. We'll work with you.

### Q: What if it's a critical issue actively exploited?
**A:** Contact emergency@trustcircle.io immediately. Expedited process and bonus reward.

### Q: Do you offer rewards for improvements that aren't vulnerabilities?
**A:** Sometimes! Submit suggestions to security@trustcircle.io.

### Q: What blockchain knowledge do I need?
**A:** Familiarity with Solidity, ERC20, and DeFi concepts helpful.

## 📚 Resources

### Learn About Common Vulnerabilities
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [SWC Registry](https://swcregistry.io/)
- [DeFi Threat Matrix](https://github.com/manifoldfinance/defi-threat)

### Our Security Docs
- [SECURITY.md](./SECURITY.md) - Security policy
- [AUDIT_CHECKLIST.md](./AUDIT_CHECKLIST.md) - What we check
- [Contract Architecture](./ARCHITECTURE.md) - How it works

### Testing Tools
- [Hardhat](https://hardhat.org/) - Testing framework
- [Slither](https://github.com/crytic/slither) - Static analyzer
- [Echidna](https://github.com/crytic/echidna) - Fuzzer
- [Foundry](https://github.com/foundry-rs/foundry) - Testing toolkit

## 🎉 Recent Bounty Payouts

| Date | Researcher | Severity | Reward | Description |
|------|-----------|----------|--------|-------------|
| YYYY-MM-DD | [@researcher] | Critical | $10,000 | Reentrancy in withdraw |
| YYYY-MM-DD | [@researcher] | High | $3,000 | Integer overflow in interest calc |

Total paid out: $XX,XXX to XX researchers

## 🚀 Get Started

Ready to hunt for bugs?

1. **Read our security docs**: Understand the system
2. **Deploy test environment**: Set up local testing
3. **Review smart contracts**: Look for vulnerabilities
4. **Test your theory**: Prove the exploit
5. **Submit report**: Use our template
6. **Get rewarded**: Earn recognition and rewards!

---

**Program Status**: ✅ **ACTIVE**  
**Last Updated**: November 2025  
**Total Paid**: $XX,XXX  
**Version**: 1.0.0

Thank you for helping make TrustCircle more secure! 🛡️

---

*TrustCircle reserves the right to modify the bug bounty program terms at any time. Changes will be communicated via this document.*
