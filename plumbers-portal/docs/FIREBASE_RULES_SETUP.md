# Firebase Security Rules Setup Guide

## 🔥 Overview

This guide will help you set up Firebase Security Rules for both Firestore Database and Cloud Storage to secure your authentication boilerplate.

## 📋 Prerequisites

- Firebase project created and configured
- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated with Firebase CLI (`firebase login`)

## 🗄️ Firestore Database Rules

### Step 1: Navigate to Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**

### Step 2: Replace Default Rules

Replace the default rules with the content from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Copy the entire content from firestore.rules file
  }
}
```

### Notifications Collection

Add rules for the notifications collection so users can read their own notifications and mark them as read:

```javascript
match /notifications/{notificationId} {
  allow read, update: if request.auth != null && request.auth.uid == resource.data.userId;
}
```

Notifications are written by the server using the Admin SDK, so only authenticated users are permitted to read or update their own documents.
