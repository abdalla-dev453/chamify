"""
Interest and penalty math (Section 4.1). Kept pure/stateless and outside
the models so they're trivially unit-testable and reusable from Celery
tasks (e.g. nightly penalty sweeps) as well as request-time blueprints.
"""
from decimal import Decimal, ROUND_HALF_UP


def reducing_balance_schedule(principal: Decimal, annual_rate: Decimal, term_months: int):
    """
    Returns a list of {month, principal_component, interest_component,
    total_due, balance_after} dicts using the reducing-balance method.
    """
    monthly_rate = annual_rate / Decimal(12)
    balance = Decimal(principal)
    principal_component = (Decimal(principal) / term_months).quantize(Decimal("0.01"), ROUND_HALF_UP)

    schedule = []
    
    for month in range(1, term_months + 1):
        interest_component = (balance * monthly_rate).quantize(Decimal("0.01"), ROUND_HALF_UP)
        this_principal = principal_component if month < term_months else balance
        total_due = (this_principal + interest_component).quantize(Decimal("0.01"), ROUND_HALF_UP)
        balance = (balance - this_principal).quantize(Decimal("0.01"), ROUND_HALF_UP)

        schedule.append({
            "month": month,
            "principal_component": str(this_principal),
            "interest_component": str(interest_component),
            "total_due": str(total_due),
            "balance_after": str(balance),
        })
    return schedule


def flat_rate_installment(principal: Decimal, annual_rate: Decimal, term_months: int) -> Decimal:
    total_interest = (Decimal(principal) * annual_rate * term_months) / Decimal(12)
    total_payable = Decimal(principal) + total_interest
    return (total_payable / term_months).quantize(Decimal("0.01"), ROUND_HALF_UP)


def max_loan_amount(total_savings: Decimal, multiplier: Decimal = Decimal("3")) -> Decimal:
    """Loan appraisal: loan limit = multiplier x savings (Section 4.1)."""
    return (Decimal(total_savings) * multiplier).quantize(Decimal("0.01"), ROUND_HALF_UP)


def late_payment_penalty(expected_amount: Decimal, penalty_rate: Decimal = Decimal("0.05")) -> Decimal:
    return (Decimal(expected_amount) * penalty_rate).quantize(Decimal("0.01"), ROUND_HALF_UP)

