# Firebase Firestore Index Setup

This guide helps you set up the required Firestore indexes for the Plumbers Portal application.

## Required Indexes

### 1. Jobs Collection Index

For querying open jobs with sorting by creation date:

**Collection:** `jobs`
**Fields:**

- `status` (Ascending)
- `createdAt` (Descending)

### How to Create the Index

#### Option 1: Automatic Creation (Recommended)

1. Run the application and try to browse jobs as a tradesperson
2. The error message will contain a direct link to create the index
3. Click the link in the console logs that looks like:
