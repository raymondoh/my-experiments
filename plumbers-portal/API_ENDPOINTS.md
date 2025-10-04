# API Reference

This document provides comprehensive documentation for all API endpoints in the authentication boilerplate.

## 📋 Overview

The boilerplate provides RESTful API endpoints for:

- User authentication and registration
- Email verification
- Password reset
- User profile management
- Task management (example feature)

## 🔐 Authentication

All protected endpoints require authentication via NextAuth.js session cookies.

### Base URL

\`\`\`
Development: http://localhost:3000/api
Production: https://your-domain.com/api
\`\`\`

## 👤 User Management

### Register User

Create a new user account.

```http
POST /api/register
```

**Request Body:**

````json
{
"name": "John Doe",
"email": "[john@example.com](mailto:john@example.com)",
"password": "securePassword123"
}


**Response (Success):**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Registration successful. Please check your email for verification."
}
**Response (Error):**
```json
{
"error": "User already exists",
"details": "A user with this email address already exists"
}

**Status Codes:**
- `200` - Success
- `400` - Invalid input data
- `409` - User already exists
- `500` - Server error

---

### Update Profile

Update user profile information.

```http
PUT /api/profile

Headers:
Authorization: Bearer <session-token>
Content-Type: application/json

**Request Body:**
```json
{
"name": "John Smith",
"email": "[johnsmith@example.com](mailto:johnsmith@example.com)"
}


**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "user_123",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "emailVerified": true,
    "role": "user",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}

## Email Verification

### Verify Email

Verify user email address with token.

POST /api/auth/verify-email

**Request Body:**
```json
{
"token": "verification_token_here"
}

**Response (Success):**
\`\`\`json
{
  "success": true,
  "message": "Email verified successfully"
}
**Response (Error):**
```json
{
"error": "Invalid or expired token"
}


---

### Resend Verification Email

Resend email verification to authenticated user.

```http
POST /api/auth/resend-verification

Headers:
Authorization: Bearer <session-token>
**Response:**
```json
{
"success": true,
"message": "Verification email sent"
}

## 🔑 Password Reset

### Request Password Reset

Send password reset email.

```http
POST /api/auth/forgot-password
**Request Body:**
```json
{
"email": "[user@example.com](mailto:user@example.com)"
}

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Password reset email sent if account exists"
}

### Reset Password

Reset password with token.
POST /api/auth/reset-password
**Request Body:**
```json
{
"token": "reset_token_here",
"password": "newSecurePassword123"
}

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Password reset successfully"
}
### Verify Reset Token

Verify if password reset token is valid.

```plaintext
POST /api/auth/verify-reset-token
````

**Request Body:**

````json
{
"token": "reset_token_here"
}

```plaintext

**Response:**
\`\`\`json
{
  "valid": true,
  "email": "user@example.com"
}
````
