// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDU88CUe9IoRkQnm83w-vqM04p2L2Hn8-8",
  authDomain: "exampro-app-e1336.firebaseapp.com",
  projectId: "exampro-app-e1336",
  storageBucket: "exampro-app-e1336.firebasestorage.app",
  messagingSenderId: "23770370872",
  appId: "1:23770370872:web:1438ae5674cad8170fe7cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDU88CUe9IoRkQnm83w-vqM04p2L2Hn8-8",
  authDomain: "exampro-app-e1336.firebaseapp.com",
  projectId: "exampro-app-e1336",
  storageBucket: "exampro-app-e1336.firebasestorage.app",
  messagingSenderId: "23770370872",
  appId: "1:23770370872:web:1438ae5674cad8170fe7cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);