"""
Password hashing. Isolated here so it's the ONE place bcrypt is touched —
if we ever rotate hashing schemes, this is the only file that changes.
"""

import bcrypt

def hash_password(raw_password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(raw_password.encode('utf-8'), salt).decode('utf-8')


def verify_password(raw_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(raw_password.encode('utf-8'), password_hash.encode('utf-8'))
    except (ValueError, TypeError):
        return False