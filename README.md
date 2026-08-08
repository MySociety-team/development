# MySociety

MySociety is a MERN-stack society management application for residents,
committee members and society administrators.

## Repository purpose

This is the development repository. All feature development, issues and pull
requests must be created here.

Stable releases are promoted to the separate production repository.

## Technology stack

### Frontend

- React
- Vite
- JavaScript

### Backend

- Node.js
- Express
- MongoDB
- Mongoose

## Requirements

- Node.js 24 LTS
- npm
- MongoDB
- Git

## Local setup

Clone the repository:

```bash
git clone <development-repository-url>
cd mysociety-development
```

## Api Routes

Auth Routes

- POST `VITE_BASE_API_URL/api/v1/auth/register` register a new user
- POST `VITE_BASE_API_URL/api/v1/auth/login` login an existing user
- POST `VITE_BASE_API_URL/api/v1/auth/logout` logout a logged in user
- GET `VITE_BASE_API_URL/api/v1/auth/me` get current logged in user information
