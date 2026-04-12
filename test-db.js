import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      title: "Test",
      message: "Test message",
      read: false
    });
    console.log("Success:", docRef.id);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
