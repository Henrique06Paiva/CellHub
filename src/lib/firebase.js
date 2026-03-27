import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDaCffAgXkUjUH7Zlw41e7Uv7Ysua0-GTQ",
  authDomain: "cellhub-henrique-dev.firebaseapp.com",
  projectId: "cellhub-henrique-dev",
  storageBucket: "cellhub-henrique-dev.firebasestorage.app",
  messagingSenderId: "163603271574",
  appId: "1:163603271574:web:8e2df804bf7368415d17b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Exported Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
