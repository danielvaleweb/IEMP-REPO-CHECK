import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

console.log("Testing Client SDK with Project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const snap = await getDocs(query(collection(db, "members"), limit(1)));
    console.log("SUCCESS: Found", snap.size, "members");
  } catch (error: any) {
    console.error("FAILURE:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
  }
}

run();
