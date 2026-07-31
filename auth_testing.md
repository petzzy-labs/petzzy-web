# PETZZY Auth Testing

Uses BOTH JWT email/password + Emergent Google Auth (unified `/api/auth/me` endpoint).

## JWT Flow
```
API=$REACT_APP_BACKEND_URL

# Register
curl -c cookies.txt -X POST $API/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@petzzy.com","password":"pass1234","name":"New User"}'

# Login
curl -c cookies.txt -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@petzzy.com","password":"petzzyadmin123"}'

# Me
curl -b cookies.txt $API/api/auth/me
```

## Google Auth Flow
- Frontend: `window.location.href = https://auth.emergentagent.com/?redirect=<origin>/dashboard`
- After Google login, user is redirected back with `#session_id=xxx` in URL fragment
- Frontend calls `POST /api/auth/google/session` with `{session_id}` → backend exchanges via emergentagent's session-data endpoint, sets `access_token` cookie, returns user

## Admin Excel Export
```
curl -b cookies.txt $API/api/admin/users/export -o users.xlsx
```

Login as admin@petzzy.com first, then the cookie authorises the download.
