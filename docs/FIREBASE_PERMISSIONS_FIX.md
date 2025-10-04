# Firebase Permissions Fix Guide

## 🚨 The Error You're Seeing

\`\`\`
Caller does not have required permission to use project my-firebase-playground-5db22.
Grant the caller the roles/serviceusage.serviceUsageConsumer role
\`\`\`

## 🔧 **Quick Fix Steps:**

### **Step 1: Enable Required APIs**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `my-firebase-playground-5db22`
3. Go to **APIs & Services** → **Library**
4. Search for and **ENABLE** these APIs:
   - **Identity and Access Management (IAM) API**
   - **Firebase Authentication API**
   - **Cloud Firestore API**
   - **Firebase Management API**

### **Step 2: Fix Service Account Permissions**

#### **Option A: Use Firebase Console (Recommended)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-firebase-playground-5db22`
3. Go to **Project Settings** → **Service accounts**
4. Click **Generate new private key**
5. **Download the NEW JSON file**
6. Replace your environment variables with the new values

#### **Option B: Fix Permissions Manually**

1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam)
2. Select your project: `my-firebase-playground-5db22`
3. Find your service account (looks like `firebase-adminsdk-xxxxx@...`)
4. Click **Edit** (pencil icon)
5. **Add these roles:**
   - `Firebase Admin SDK Administrator Service Agent`
   - `Service Usage Consumer`
   - `Firebase Authentication Admin`
   - `Cloud Datastore User`

### **Step 3: Wait for Propagation**

- **Wait 5-10 minutes** for permissions to propagate
- Google services need time to update permissions

### **Step 4: Update Your Environment Variables**

Make sure your `.env.local` has the correct format:

\`\`\`bash

# Firebase Admin Configuration (Private)

FIREBASE_PROJECT_ID=my-firebase-playground-5db22
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@my-firebase-playground-5db22.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...your full private key here...
...
-----END PRIVATE KEY-----"

# Make sure the private key is wrapped in quotes and includes the newlines

\`\`\`

### **Step 5: Restart Your Development Server**

\`\`\`bash

# Stop your server (Ctrl+C)

# Then restart

npm run dev
\`\`\`

## 🔍 **Common Issues:**

### **1. Private Key Format**

❌ **Wrong:**
\`\`\`bash
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQ...
\`\`\`

✅ **Correct:**
\`\`\`bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
\`\`\`

### **2. Missing APIs**

Make sure these APIs are enabled in Google Cloud Console:

- Identity and Access Management (IAM) API
- Firebase Authentication API
- Cloud Firestore API

### **3. Wrong Project ID**

Double-check that your `FIREBASE_PROJECT_ID` matches your actual Firebase project ID.

## 🧪 **Test Your Fix:**

1. **Restart your dev server:** `npm run dev`
2. **Visit:** `http://localhost:3000/firebase-test`
3. **Look for:** ✅ Firebase Connected Successfully!

## 🆘 **Still Having Issues?**

### **Nuclear Option - Create New Service Account:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **IAM & Admin** → **Service Accounts**
3. **Create Service Account**
4. Name: `firebase-admin-dev`
5. **Grant roles:**
   - `Firebase Admin SDK Administrator Service Agent`
   - `Service Usage Consumer`
6. **Create Key** → **JSON**
7. Download and use the new credentials

### **Alternative - Use Firebase Admin SDK Default:**

If you're still having issues, try using the default Firebase Admin SDK initialization:

1. Download your service account JSON file
2. Set environment variable:
   \`\`\`bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-file.json
   \`\`\`
3. Remove the individual Firebase env vars temporarily

## 🎯 **Expected Success:**

When working, you should see:
\`\`\`
🔥 Using Firebase Auth Service
✅ Firebase Admin Auth connected
✅ Firebase Admin Firestore connected
🔥 Firebase Connection Test: ✅ SUCCESS
