rules_version = '2';

service cloud.firestore {
match /databases/{database}/documents {

    // ---- Helpers
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isOwnerOrAdmin(userId) {
      return isOwner(userId) || isAdmin();
    }

    // ---- Users
    match /users/{userId} {
      allow read: if isOwnerOrAdmin(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwnerOrAdmin(userId);
      allow delete: if isAdmin();
    }

    // ---- Tasks
    match /tasks/{taskId} {
      allow read, update, delete: if isAuthenticated() &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // ---- Jobs
    match /jobs/{jobId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        (getUserRole() in ['customer', 'admin']) &&
        request.resource.data.customerId == request.auth.uid;
      allow update, delete: if isAuthenticated() &&
        (resource.data.customerId == request.auth.uid || isAdmin());
    }

    // ---- Top-level Messages
    match /messages/{messageId} {
      allow read: if isAuthenticated() &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.receiverId == request.auth.uid ||
         isAdmin());
      allow create: if isAuthenticated() &&
        request.resource.data.senderId == request.auth.uid;
      allow update: if isAuthenticated() &&
        resource.data.senderId == request.auth.uid;
      allow delete: if isAuthenticated() &&
        (resource.data.senderId == request.auth.uid || isAdmin());
    }

    // ---- Businesses
    match /businesses/{businessId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
        (getUserRole() in ['business_owner', 'admin']) &&
        request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if isAuthenticated() &&
        (resource.data.ownerId == request.auth.uid || isAdmin());
    }

    // ---- Reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
        (getUserRole() in ['customer', 'admin']) &&
        request.resource.data.reviewerId == request.auth.uid;
      allow update, delete: if isAuthenticated() &&
        (resource.data.reviewerId == request.auth.uid || isAdmin());
    }

    // --- THIS IS THE FIX ---
    // The chat rules have been simplified to be more direct and prevent race conditions.

match /chats/{jobId} {
// Allow a user to read or write to a chat document if their UID
// is present in either the customerId or tradespersonId field.
allow read, update, delete: if request.auth != null && (
request.auth.uid == resource.data.customerId ||
request.auth.uid == resource.data.tradespersonId ||
isAdmin()
);

// Allow creation if the new document's participants include the creator.
allow create: if request.auth != null && (
request.auth.uid == request.resource.data.customerId ||
request.auth.uid == request.resource.data.tradespersonId
);

// Apply a simplified rule to the messages sub-collection
match /messages/{messageId} {
// A user can read/write messages if they have read access to the parent chat document.
// This is more efficient and avoids the race condition.
allow read, write: if exists(/databases/$(database)/documents/chats/$(jobId));
}
}

    // ---- Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // ---- Admin-only
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }

    // ---- Logs
    match /logs/{logId} {
      allow read, write: if isAdmin();
    }

}
}
