import { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  User, 
  Zap, 
  Save, 
  GitMerge, 
  Loader2,
  Hash
} from 'lucide-react';

// --- IMPORTACIONES FIREBASE ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from "firebase/auth";

// --- 1. CONFIGURACIÓN FIREBASE (TUS CREDENCIALES) ---
const firebaseConfig = {
  apiKey: "AIzaSyDt-FcP9BaNMbMpg6dKrQ7wO1eNBykLANA",
  authDomain: "detencion-planta---1702.firebaseapp.com",
  projectId: "detencion-planta---1702",
  storageBucket: "detencion-planta---1702.firebasestorage.app",
  messagingSenderId: "825709887477",
  appId: "1:825709887477:web:cad4e25b764e59eb8f2abc"
};

// Inicialización Singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// NOMBRE DE LA COLECCIÓN (V19: Versión final limpia y corregida)
const COLLECTION_NAME = "tasks_prod_v19";

// --- 2. CONFIGURACIÓN DE FECHAS ---
const d = (day: number, hour: number, minute: number) => new Date(2026, 1, day, hour, minute);

const safeDate = (val: any): Date => {
  if (!val) return new Date(); 
  if (val.toDate && typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
};

const formatTime = (date: Date) => {
  if (!date || isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute:'2-digit', hour12: false });
};

const formatDay = (date: Date) => {
  if (!date || isNaN(date.getTime())) return "---";
  return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
};

// --- 3. DATOS SEMILLA REALES (111 TAREAS E&I) ---
const INITIAL_TASKS_DATA = [
  // --- SECA ---
  { area: "Seca", id: "4", ot: "793212", parent: "MANTENCIÓN CHUTE 7 / POLEA MOTRIZ", name: "Bloqueo de equipo (Chancado Primario)", start: d(17,7,0), end: d(17,7,30), resp: "Rodrigo Muñoz" },
  { area: "Seca", id: "5", ot: "S/OT", parent: "MANTENCIÓN CHUTE 7 / POLEA MOTRIZ", name: "Retiro de sensor microondas chute 7", start: d(17,7,30), end: d(17,8,0), resp: "Rodrigo Muñoz" },
  { area: "Seca", id: "9", ot: "S/OT", parent: "MANTENCIÓN CHUTE 7 / POLEA MOTRIZ", name: "Instalación de sensores", start: d(17,9,30), end: d(17,12,30), resp: "Rodrigo Muñoz" },
  { area: "Seca", id: "10", ot: "792466", parent: "MANTENCIÓN CHUTE 7 / POLEA MOTRIZ", name: "Modificación posición sensor tilt switch", start: d(17,12,30), end: d(17,13,30), resp: "Rodrigo Muñoz" },
  { area: "Seca", id: "13", ot: "793212", parent: "CHUTE 4 - CAMBIO ELEMENTOS DESGASTE", name: "Desbloqueo", start: d(18,19,0), end: d(18,19,30), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "15", ot: "793212", parent: "CHUTE 4 - CAMBIO ELEMENTOS DESGASTE", name: "Bloqueo de equipo (Chute 4)", start: d(18,9,30), end: d(18,10,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "17", ot: "-", parent: "CHUTE 4 - CAMBIO ELEMENTOS DESGASTE", name: "Desbloqueo", start: d(18,19,0), end: d(18,19,30), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "19", ot: "-", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Bloqueo de equipo", start: d(17,7,0), end: d(17,7,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "21", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Desbloqueo", start: d(17,16,30), end: d(17,17,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "28", ot: "S/OT", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Desconexión de motor", start: d(17,7,0), end: d(17,7,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "33", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Bloqueo de CVB-002", start: d(17,7,0), end: d(17,7,30), resp: "Patricio Gutierrez" },
  { area: "Seca", id: "39", ot: "S/OT", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Pruebas de sentido de giro", start: d(17,14,18), end: d(17,14,48), resp: "Vicente Fuentes" },
  { area: "Seca", id: "41", ot: "-", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Pruebas de sentido de giro (Final)", start: d(17,15,48), end: d(17,16,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "42", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Desbloqueo Correa 2", start: d(17,16,0), end: d(17,17,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "45", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2", name: "Bloqueo Correa 2", start: d(18,9,0), end: d(18,9,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "48", ot: "798885", parent: "CAMBIO CORREA CVB-006 (GENERAL)", name: "Instalación de instrumentación", start: d(18,16,0), end: d(18,18,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "50", ot: "793212", parent: "CAMBIO CORREA CVB-006 (GENERAL)", name: "Desbloqueo", start: d(18,18,30), end: d(18,19,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "51", ot: "798885", parent: "CAMBIO CORREA CVB-006 (GENERAL)", name: "Pruebas funcionales", start: d(18,18,30), end: d(18,19,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "54", ot: "793212", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Bloqueo de equipo", start: d(17,7,0), end: d(17,7,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "55", ot: "798888", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección carbones motor M1", start: d(17,7,30), end: d(17,8,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "56", ot: "798888", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección partidor resistivo M1", start: d(17,8,0), end: d(17,9,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "57", ot: "798889", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección carbones motor M2", start: d(17,9,0), end: d(17,9,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "58", ot: "798889", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección partidor resistivo M2", start: d(17,9,30), end: d(17,10,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "59", ot: "793212", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Desbloqueo", start: d(17,10,30), end: d(17,11,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "61", ot: "793214", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Bloqueo de equipo", start: d(18,10,0), end: d(18,10,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "62", ot: "798890", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M1", start: d(18,10,30), end: d(18,11,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "63", ot: "798890", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M1", start: d(18,11,0), end: d(18,12,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "64", ot: "798892", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M2", start: d(18,12,0), end: d(18,12,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "65", ot: "798892", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M2", start: d(18,12,30), end: d(18,13,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "66", ot: "798894", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M3", start: d(18,13,30), end: d(18,14,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "67", ot: "798894", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M3", start: d(18,14,0), end: d(18,15,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "68", ot: "798897", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M4", start: d(18,15,0), end: d(18,15,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "69", ot: "798897", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M4", start: d(18,15,30), end: d(18,16,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "70", ot: "793214", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Desbloqueo", start: d(18,16,30), end: d(18,17,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "80", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Bloqueo de cinta OPE", start: d(17,7,0), end: d(17,7,30), resp: "Nicole Troncoso" },
  { area: "Seca", id: "82", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Desbloqueo de cinta OPE", start: d(17,9,30), end: d(17,10,0), resp: "Nicole Troncoso" },
  { area: "Seca", id: "89", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Aislación y bloqueo", start: d(17,10,42), end: d(17,11,12), resp: "Nicole Troncoso" },
  { area: "Seca", id: "93", ot: "S/OT", parent: "CAMBIO DE CINTA CVB-006", name: "Retiro de instrumentación", start: d(17,13,0), end: d(17,15,0), resp: "Osvaldo Sanhueza" },
  { area: "Seca", id: "112", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Desbloqueo para tensado", start: d(18,20,30), end: d(18,21,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "115", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Bloqueo", start: d(18,22,0), end: d(18,22,30), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "117", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Instalación instrumentación", start: d(18,22,30), end: d(19,0,30), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "119", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Desbloqueo y calibración", start: d(19,0,30), end: d(19,4,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "120", ot: "-", parent: "CAMBIO DE CINTA CVB-006", name: "Desbloqueo", start: d(19,0,30), end: d(19,1,0), resp: "Nicolas Gonzalez" },
  { area: "Seca", id: "121", ot: "S/OT", parent: "CAMBIO DE CINTA CVB-006", name: "Calibración cero y span (cadenas)", start: d(19,1,0), end: d(19,4,0), resp: "Nicolas Gonzalez" },

  // --- MOLIENDA ---
  { area: "Molienda", id: "124", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Bloqueo de equipo", start: d(17,7,0), end: d(17,7,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "131", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Bloqueo de equipo", start: d(17,10,12), end: d(17,10,42), resp: "Sergio Rojas" },
  { area: "Molienda", id: "145", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Desbloqueo", start: d(17,21,24), end: d(17,21,54), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "146", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Giro 1", start: d(17,21,54), end: d(17,22,18), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "147", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Bloqueo", start: d(17,22,18), end: d(17,22,48), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "151", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,0,36), end: d(18,1,6), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "152", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Giro 2", start: d(18,1,6), end: d(18,1,30), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "153", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,1,30), end: d(18,2,0), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "157", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,3,48), end: d(18,4,18), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "158", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Giro 3", start: d(18,4,18), end: d(18,4,42), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "159", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,4,42), end: d(18,5,12), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "163", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,7,0), end: d(18,7,30), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "164", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Giro 4", start: d(18,7,30), end: d(18,7,54), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "165", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,7,54), end: d(18,8,24), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "169", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,10,12), end: d(18,10,42), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "170", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Giro 5", start: d(18,10,42), end: d(18,11,6), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "171", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,11,6), end: d(18,11,36), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "181", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Montaje de caperuza", start: d(18,22,54), end: d(18,23,24), resp: "Osvaldo Sanhueza" },
  { area: "Molienda", id: "182", ot: "-", parent: "MOLINO SAG 1 - CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,23,24), end: d(18,23,54), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "186", ot: "798899", parent: "BOMBA PPS-011 - CAMBIO WET-END", name: "Bloqueo de equipo", start: d(17,7,30), end: d(17,8,0), resp: "Osvaldo Sanhueza" },
  { area: "Molienda", id: "187", ot: "-", parent: "BOMBA PPS-011 - CAMBIO WET-END", name: "Desacople ductos succion/descarga", start: d(17,8,0), end: d(17,12,0), resp: "Ronny Velasquez" },
  { area: "Molienda", id: "190", ot: "-", parent: "BOMBA PPS-011 - CAMBIO WET-END", name: "Acoplamiento de ductos", start: d(18,4,0), end: d(18,6,30), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "191", ot: "-", parent: "BOMBA PPS-011 - CAMBIO WET-END", name: "Desbloqueo", start: d(18,6,30), end: d(18,7,0), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "192", ot: "-", parent: "BOMBA PPS-011 - CAMBIO WET-END", name: "Cambio de ducto B02", start: d(17,7,0), end: d(18,3,0), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "199", ot: "798899", parent: "BOMBA PPS-012 - REPARACIÓN FUGAS", name: "Bloqueo de equipo (Bomba PPS-012)", start: d(17,7,0), end: d(17,7,30), resp: "Osvaldo Sanhueza" },
  { area: "Molienda", id: "203", ot: "798899", parent: "BOMBA PPS-012 - REPARACIÓN FUGAS", name: "Desbloqueo", start: d(18,11,30), end: d(18,12,0), resp: "Osvaldo Sanhueza" },
  { area: "Molienda", id: "206", ot: "798899", parent: "MOLINO BOLAS 1 - SISTEMA ENGRASE", name: "Bloqueo de equipo (Molino Bolas 1)", start: d(17,7,0), end: d(17,7,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "210", ot: "798899", parent: "MOLINO BOLAS 1 - SISTEMA ENGRASE", name: "Desbloqueo de equipo", start: d(18,17,30), end: d(18,18,0), resp: "Sergio Rojas" },
  { area: "Molienda", id: "212", ot: "798899", parent: "REFUERZO UNIÓN CANALETA", name: "Bloqueo equipo (Refuerzo Canaleta)", start: d(18,7,0), end: d(18,7,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "214", ot: "-", parent: "REFUERZO UNIÓN CANALETA", name: "Desbloqueo", start: d(18,19,30), end: d(18,20,0), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "217", ot: "-", parent: "MOLINO BOLAS 2 - REFUERZO CANALETA", name: "Bloqueo de equipo (Molino Bolas 2)", start: d(17,7,0), end: d(17,7,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "219", ot: "-", parent: "MOLINO BOLAS 2 - REFUERZO CANALETA", name: "Desbloqueo", start: d(17,19,30), end: d(17,20,0), resp: "Nicolas Gonzalez" },
  { area: "Molienda", id: "236", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Posicionamiento de molino", start: d(17,7,0), end: d(17,7,15), resp: "Jorge Garrido" },
  { area: "Molienda", id: "237", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Bloqueo de equipo", start: d(17,7,15), end: d(17,7,45), resp: "Sergio Rojas" },
  { area: "Molienda", id: "238", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Montaje andamios (3 y 9)", start: d(17,7,45), end: d(17,8,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "239", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Retiro de tapas (3 y 9)", start: d(17,8,45), end: d(17,9,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "240", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Inspección de polos", start: d(17,9,45), end: d(17,13,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "241", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Instalación de tapas (3 y 9)", start: d(17,13,45), end: d(17,14,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "242", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Retiro de andamios (3 y 9)", start: d(17,14,45), end: d(17,15,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "243", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Desbloqueo de equipos", start: d(17,15,45), end: d(17,16,15), resp: "Sergio Rojas" },
  { area: "Molienda", id: "245", ot: "794213", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Bloqueo sistema lubricación molino", start: d(17,11,0), end: d(17,11,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "246", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Instalación de andamios (ambos lados)", start: d(17,11,30), end: d(17,12,30), resp: "Jorge Garrido" },
  { area: "Molienda", id: "248", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Retiro de sensores", start: d(17,13,0), end: d(17,14,0), resp: "Jorge Ponce" },
  { area: "Molienda", id: "249", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Medición de MONCON (PAD)", start: d(17,14,0), end: d(17,14,30), resp: "Jorge Ponce" },
  { area: "Molienda", id: "250", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Revisión sensores temp. PAD", start: d(17,14,30), end: d(17,16,0), resp: "Jorge Ponce" },
  { area: "Molienda", id: "251", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Instalación de sensores", start: d(17,16,0), end: d(17,17,0), resp: "Jorge Ponce" },
  { area: "Molienda", id: "253", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Retiro de andamios", start: d(17,17,30), end: d(17,18,30), resp: "Jorge Garrido" },
  { area: "Molienda", id: "254", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Desbloqueo de equipo", start: d(17,18,30), end: d(17,19,0), resp: "Sergio Rojas" },

  // --- FLOTACIÓN ---
  { area: "Flotacion", id: "263", ot: "-", parent: "FLOTACIÓN - CAMBIO VÁLVULA 34", name: "Aislación y bloqueo de flujo", start: d(17,9,0), end: d(17,9,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "265", ot: "798900", parent: "FLOTACIÓN - CAMBIO VÁLVULA 34", name: "Retiro de instrumentación", start: d(17,11,30), end: d(17,12,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "266", ot: "798900", parent: "FLOTACIÓN - CAMBIO VÁLVULA 34", name: "Desarme de andamios", start: d(17,12,30), end: d(17,14,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "271", ot: "798900", parent: "FLOTACIÓN - CAMBIO VÁLVULA 34", name: "Armado de andamios", start: d(18,18,30), end: d(18,20,30), resp: "Nicolas Gonzalez" },
  { area: "Flotacion", id: "272", ot: "798900", parent: "FLOTACIÓN - CAMBIO VÁLVULA
