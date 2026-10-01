# JWT + RBAC Login & Posts Demo

A small experiment: username/password login with two buttons (Admin / Viewer), a signed JWT,
and role-based permissions over a list of posts.

## Run it in VS Code

1. Open this folder in VS Code.
2. In the terminal:

   ```bash
   npm install
   npm start
   ```

3. Open http://localhost:3000

Requires Node.js 18 or newer.

## Demo accounts

| Username | Password  | Role   |
| -------- | --------- | ------ |
| admin    | admin123  | admin  |
| viewer   | viewer123 | viewer |

Pressing "Login as Admin" with the viewer account is rejected by the server (403).

## What it demonstrates

- **JWT**: `POST /api/login` returns a token signed with HS256; the browser sends it as
  `Authorization: Bearer <token>` on every request.
- **RBAC**: `authenticate` verifies the token, `requireRole('admin')` guards create / edit / delete.
- **UI by role**: after login the form hides and shows `Welcome, <username>`.
  Admin sees Create / Edit Post / Delete Post. Viewer sees only "Read-only access".
- **Post count**: total number of posts is shown and updates after every change.
- **Logout**: clears the token and returns to the login form.

## API

| Method | Path             | Who         |
| ------ | ---------------- | ----------- |
| POST   | /api/login       | anyone      |
| GET    | /api/me          | logged in   |
| GET    | /api/posts       | logged in   |
| POST   | /api/posts       | admin only  |
| PUT    | /api/posts/:id   | admin only  |
| DELETE | /api/posts/:id   | admin only  |

Posts live in memory, so they reset when the server restarts.
