
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_register_login_me_logout():
    email = "scholargraph-test@example.com"
    password = "TemporaryTestPass123!"

    # Registration may return 409 if this test account already exists.
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "display_name": "Test Researcher",
        },
    )

    assert register_response.status_code in (201, 409)

    # If the account already exists, log in instead.
    if register_response.status_code == 201:
        assert register_response.json()["email"] == email
    else:
        login_response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_response.status_code == 200

    # TestClient retains cookies across requests.
    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 204

    me_after_logout = client.get("/api/auth/me")
    assert me_after_logout.status_code == 401
