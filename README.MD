🗄️ Notehub Backend — Node.js, Express & MongoDB API

This is the backend service for Notehub, providing a secure API for user authentication, profile management, and personal notes.
Built with Node.js, Express, and MongoDB, the backend supports all core operations needed by the Notehub frontend.

✨ Core Features
🔐 Authentication & Authorization

User registration

Login with JWT authentication

Logout (token invalidation / cookie clearing)

Route protection via middleware

👤 User Profile

Update user profile data

Upload / change profile image

Secure handling of user information

📝 Notes Management

Create new notes

Edit existing notes

Delete notes

Fetch all user notes

Full CRUD operations

🛠️ Tech Stack

Node.js

Express.js

MongoDB (Mongoose)

JWT authentication

Multer / Cloud storage (якщо ти використовуєш для зображень)

HTTP-only cookies

📑 API Overview (short version)
Auth

POST /auth/register — register user

POST /auth/login — login

POST /auth/logout — logout

GET /auth/current — get current user

User

PATCH /user/avatar — update profile image

PATCH /user — update user data

Notes

GET /notes — get all notes

POST /notes — create note

PATCH /notes/:id — update note

DELETE /notes/:id — delete note
