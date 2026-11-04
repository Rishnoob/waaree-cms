from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    hash_token,
    new_refresh_token,
    verify_password,
)


def test_password_hash_roundtrip():
    h = hash_password("correct horse battery")
    assert h.startswith("$argon2id$")
    assert verify_password(h, "correct horse battery")
    assert not verify_password(h, "wrong password!!")


def test_verify_without_hash_is_false():
    assert not verify_password(None, "anything-at-all")


def test_access_token_roundtrip_and_tamper():
    token, ttl = create_access_token(42)
    assert ttl > 0
    assert decode_access_token(token) == 42
    assert decode_access_token(token[:-2] + "xx") is None
    assert decode_access_token("not-a-token") is None


def test_refresh_token_only_hash_is_stored():
    raw, token_hash = new_refresh_token()
    assert len(raw) > 40
    assert token_hash == hash_token(raw)
    assert raw not in token_hash
