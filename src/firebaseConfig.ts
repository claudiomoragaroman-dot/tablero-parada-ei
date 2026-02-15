// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDt-FcP9BaNMbMpg6dKrQ7wO1eNBykLANA',
  authDomain: 'detencion-planta---1702.firebaseapp.com',
  projectId: 'detencion-planta---1702',
  storageBucket: 'detencion-planta---1702.firebasestorage.app',
  messagingSenderId: '825709887477',
  appId: '1:825709887477:web:cad4e25b764e59eb8f2abc',
  measurementId: 'G-ZQEEDXL93H',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
