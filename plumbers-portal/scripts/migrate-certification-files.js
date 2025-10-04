#!/usr/bin/env node

/**
 * Migration script to move certification files from the old structure:
 *   certifications/<userId>/<certificationId>/<filename>
 * to the new structure:
 *   certifications/<body>/<userId>/<certificationId>/<filename>
 *
 * The script looks up each certification document in Firestore at:
 *   users/{userId}/certifications/{certificationId}
 * and expects a `body` field specifying the governing body.
 */

const admin = require("firebase-admin");

// Initialise Firebase Admin using the default credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function migrate() {
  console.log("🔄 Starting certification file migration...");
  const [files] = await bucket.getFiles({ prefix: "certifications/" });

  for (const file of files) {
    const parts = file.name.split("/");
    // Expecting: certifications/<userId>/<certificationId>/<filename>
    if (parts.length < 4) continue;

    const userId = parts[1];
    const certificationId = parts[2];
    const fileName = parts.slice(3).join("/");

    try {
      const doc = await db.doc(`users/${userId}/certifications/${certificationId}`).get();
      const data = doc.data();
      if (!doc.exists || !data?.body) {
        console.warn(`⚠️  Skipping ${file.name} - certification body not found`);
        continue;
      }
      const body = data.body;
      const newPath = `certifications/${body}/${userId}/${certificationId}/${fileName}`;
      await bucket.file(file.name).move(newPath);
      console.log(`✅ Moved ${file.name} -> ${newPath}`);
    } catch (err) {
      console.error(`❌ Failed to migrate ${file.name}`, err);
    }
  }

  console.log("🎉 Migration complete");
}

migrate().catch(err => {
  console.error("Migration failed", err);
  process.exit(1);
});
