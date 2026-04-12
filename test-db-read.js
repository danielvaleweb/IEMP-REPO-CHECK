import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDocs(collection(db, "members"));
    console.log("Members:", snap.docs.map(d => d.data()));
    
    const snap2 = await getDocs(collection(db, "notifications"));
    console.log("Notifications:", snap2.docs.map(d => d.data()));
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
