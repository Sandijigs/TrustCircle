// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title InterestCalculator
 * @notice Library for advanced interest calculations in TrustCircle
 * @dev Provides utility functions for loan calculations
 *
 * FEATURES:
 * - Amortization calculations (equal installment loans)
 * - Simple interest calculations
 * - Compound interest calculations
 * - APR/APY conversions
 * - Early payment calculations
 */
library InterestCalculator {
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant PRECISION = 1e18;

    /**
     * @notice Calculates simple interest
     * @param principal Principal amount
     * @param rateBPS Annual interest rate in basis points
     * @param duration Duration in seconds
     * @return interest Interest amount
     *
     * Formula: I = P * r * t
     */
    function calculateSimpleInterest(
        uint256 principal,
        uint256 rateBPS,
        uint256 duration
    ) internal pure returns (uint256 interest) {
        uint256 rate = (rateBPS * PRECISION) / BASIS_POINTS;
        uint256 timeFactor = (duration * PRECISION) / SECONDS_PER_YEAR;
        
        interest = (principal * rate * timeFactor) / (PRECISION * PRECISION);
    }

    /**
     * @notice Calculates compound interest
     * @param principal Principal amount
     * @param rateBPS Annual interest rate in basis points
     * @param duration Duration in seconds
     * @param compoundingFrequency Number of times interest compounds per year
     * @return totalAmount Final amount with interest
     *
     * Formula: A = P(1 + r/n)^(nt)
     */
    function calculateCompoundInterest(
        uint256 principal,
        uint256 rateBPS,
        uint256 duration,
        uint256 compoundingFrequency
    ) internal pure returns (uint256 totalAmount) {
        if (compoundingFrequency == 0) {
            compoundingFrequency = 1;
        }

        uint256 rate = (rateBPS * PRECISION) / BASIS_POINTS;
        uint256 ratePerPeriod = rate / compoundingFrequency;
        uint256 periods = (duration * compoundingFrequency) / SECONDS_PER_YEAR;

        // A = P * (1 + r/n)^(n*t)
        uint256 multiplier = PRECISION + ratePerPeriod;
        uint256 result = PRECISION;

        // Power calculation using binary exponentiation
        for (uint256 i = 0; i < periods; i++) {
            result = (result * multiplier) / PRECISION;
        }

        totalAmount = (principal * result) / PRECISION;
    }

    /**
     * @notice Calculates amortized installment amount
     * @param principal Loan principal
     * @param rateBPS Annual interest rate in basis points
     * @param duration Loan duration in seconds
     * @param numInstallments Number of installments
     * @return installmentAmount Amount per installment
     *
     * Formula: A = P * [r(1+r)^n] / [(1+r)^n - 1]
     */
    function calculateAmortizedInstallment(
        uint256 principal,
        uint256 rateBPS,
        uint256 duration,
        uint256 numInstallments
    ) internal pure returns (uint256 installmentAmount) {
        if (numInstallments == 0) {
            return principal;
        }

        // Calculate per-period rate
        uint256 periodsPerYear = (SECONDS_PER_YEAR * numInstallments) / duration;
        uint256 periodRateBPS = rateBPS / periodsPerYear;
        uint256 periodRate = (periodRateBPS * PRECISION) / BASIS_POINTS;

        // Calculate (1 + r)^n
        uint256 factor = _pow(PRECISION + periodRate, numInstallments, PRECISION);

        // A = P * r * (1+r)^n / ((1+r)^n - 1)
        uint256 numerator = principal * periodRate * factor / PRECISION;
        uint256 denominator = factor - PRECISION;

        if (denominator == 0) {
            return principal / numInstallments;
        }

        installmentAmount = (numerator * PRECISION) / denominator / PRECISION;
    }

    /**
     * @notice Calculates remaining balance using amortization
     * @param principal Original principal
     * @param rateBPS Annual interest rate in basis points
     * @param duration Original duration in seconds
     * @param numInstallments Total number of installments
     * @param paidInstallments Installments already paid
     * @return remainingBalance Remaining loan balance
     */
    function calculateRemainingBalance(
        uint256 principal,
        uint256 rateBPS,
        uint256 duration,
        uint256 numInstallments,
        uint256 paidInstallments
    ) internal pure returns (uint256 remainingBalance) {
        if (paidInstallments >= numInstallments) {
            return 0;
        }

        // Simple calculation: remaining principal proportional to remaining payments
        uint256 remainingInstallments = numInstallments - paidInstallments;
        
        // More accurate: calculate using amortization formula
        uint256 installmentAmount = calculateAmortizedInstallment(
            principal,
            rateBPS,
            duration,
            numInstallments
        );

        // Calculate interest on remaining principal
        uint256 paymentInterval = duration / numInstallments;
        uint256 periodsPerYear = SECONDS_PER_YEAR / paymentInterval;
        uint256 periodRateBPS = rateBPS / periodsPerYear;

        // Estimate remaining balance
        uint256 paidPrincipal = (principal * paidInstallments) / numInstallments;
        remainingBalance = principal - paidPrincipal;

        // Adjust for interest
        uint256 periodicInterest = (remainingBalance * periodRateBPS) / BASIS_POINTS;
        remainingBalance += (periodicInterest * remainingInstallments);
    }

    /**
     * @notice Converts APR to APY (accounts for compounding)
     * @param aprBPS APR in basis points
     * @param compoundingFrequency Number of times interest compounds per year
     * @return apyBPS APY in basis points
     *
     * Formula: APY = (1 + APR/n)^n - 1
     */
    function convertAPRtoAPY(
        uint256 aprBPS,
        uint256 compoundingFrequency
    ) internal pure returns (uint256 apyBPS) {
        if (compoundingFrequency == 0) {
            return aprBPS;
        }

        uint256 rate = (aprBPS * PRECISION) / BASIS_POINTS;
        uint256 ratePerPeriod = rate / compoundingFrequency;
        
        uint256 multiplier = PRECISION + ratePerPeriod;
        uint256 result = _pow(multiplier, compoundingFrequency, PRECISION);
        
        uint256 apy = result - PRECISION;
        apyBPS = (apy * BASIS_POINTS) / PRECISION;
    }

    /**
     * @notice Calculates effective interest rate for a loan
     * @param principal Principal amount
     * @param totalRepayment Total amount to be repaid
     * @param duration Duration in seconds
     * @return effectiveRateBPS Effective annual rate in basis points
     */
    function calculateEffectiveRate(
        uint256 principal,
        uint256 totalRepayment,
        uint256 duration
    ) internal pure returns (uint256 effectiveRateBPS) {
        if (principal == 0 || duration == 0) {
            return 0;
        }

        uint256 interest = totalRepayment - principal;
        uint256 rate = (interest * PRECISION) / principal;
        uint256 annualizedRate = (rate * SECONDS_PER_YEAR) / duration;
        
        effectiveRateBPS = (annualizedRate * BASIS_POINTS) / PRECISION;
    }

    /**
     * @notice Calculates early payoff amount with interest discount
     * @param principal Original principal
     * @param paidAmount Amount already paid
     * @param totalAmount Total amount to be repaid
     * @param discountBPS Discount rate in basis points (e.g., 5000 = 50% off)
     * @return payoffAmount Amount needed for early payoff
     */
    function calculateEarlyPayoff(
        uint256 principal,
        uint256 paidAmount,
        uint256 totalAmount,
        uint256 discountBPS
    ) internal pure returns (uint256 payoffAmount) {
        uint256 totalInterest = totalAmount - principal;
        uint256 remainingAmount = totalAmount - paidAmount;
        
        // Calculate remaining principal
        uint256 paidPrincipal = paidAmount > totalInterest 
            ? paidAmount - (totalInterest * paidAmount / totalAmount)
            : 0;
        uint256 remainingPrincipal = principal - paidPrincipal;
        
        // Calculate remaining interest
        uint256 remainingInterest = remainingAmount - remainingPrincipal;
        
        // Apply discount to remaining interest
        uint256 discountedInterest = (remainingInterest * (BASIS_POINTS - discountBPS)) / BASIS_POINTS;
        
        payoffAmount = remainingPrincipal + discountedInterest;
    }

    /**
     * @notice Calculates late payment penalty
     * @param installmentAmount Regular installment amount
     * @param daysLate Number of days payment is late
     * @param penaltyRateBPS Weekly penalty rate in basis points
     * @return penalty Penalty amount
     */
    function calculateLatePenalty(
        uint256 installmentAmount,
        uint256 daysLate,
        uint256 penaltyRateBPS
    ) internal pure returns (uint256 penalty) {
        uint256 weeksLate = daysLate / 7;
        if (weeksLate == 0) {
            return 0;
        }

        penalty = (installmentAmount * penaltyRateBPS * weeksLate) / BASIS_POINTS;
    }

    /**
     * @notice Power function for fixed-point arithmetic
     * @param base Base value (scaled by precision)
     * @param exponent Exponent
     * @param precision Scaling precision
     * @return result Base raised to exponent
     */
    function _pow(
        uint256 base,
        uint256 exponent,
        uint256 precision
    ) private pure returns (uint256 result) {
        if (exponent == 0) {
            return precision;
        }

        result = precision;
        
        // Binary exponentiation for efficiency
        uint256 tempBase = base;
        uint256 tempExp = exponent;

        while (tempExp > 0) {
            if (tempExp % 2 == 1) {
                result = (result * tempBase) / precision;
            }
            tempBase = (tempBase * tempBase) / precision;
            tempExp /= 2;
        }
    }

    /**
     * @notice Calculates total cost of a loan
     * @param principal Principal amount
     * @param rateBPS Interest rate in basis points
     * @param duration Duration in seconds
     * @param feesBPS Additional fees in basis points
     * @return totalCost Total cost including principal, interest, and fees
     */
    function calculateTotalLoanCost(
        uint256 principal,
        uint256 rateBPS,
        uint256 duration,
        uint256 feesBPS
    ) internal pure returns (uint256 totalCost) {
        uint256 interest = calculateSimpleInterest(principal, rateBPS, duration);
        uint256 fees = (principal * feesBPS) / BASIS_POINTS;
        
        totalCost = principal + interest + fees;
    }
}
