import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDPDZjQfopFd-2zvJGE1cVBXqtuKP-KFBQ",
  authDomain: "lp-partner-platform.firebaseapp.com",
  projectId: "lp-partner-platform",
  storageBucket: "lp-partner-platform.firebasestorage.app",
  messagingSenderId: "1094363316017",
  appId: "1:1094363316017:web:6f1e54a83de95c2d693a10",
  measurementId: "G-X28LF3VLGY",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
