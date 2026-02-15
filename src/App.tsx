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

// NOMBRE DE LA COLECCIÓN (V20: Versión limpia y verificada)
const COLLECTION_NAME = "tasks_prod_v21";

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
  // CHUTE 7 / SENSORES POLEA MOTRIZ
  { area: "Seca", id: "4", ot: "793212", parent: "CHUTE 7 / INSTALACION SENSORES POLEA MOTRIZ", name: "Bloqueo de equipo ", start: d(17,7,0), end: d(17,7,30), resp: "Rodrigo Muñoz" },
  { area: "Seca", id: "5", ot: "S/OT", parent: "CHUTE 7 / INSTALACION SENSORES POLEA MOTRIZ", name: "Retiro de sensor microondas chute 7", start: d(17,7,30), end: d(17,8,0), resp: "Rodrigo Muñoz" },
  { area: "Seca", id: "9", ot: "S/OT", parent: "CHUTE 7 / INSTALACION SENSORES POLEA MOTRIZ", name: "Instalación de sensores", start: d(17,9,30), end: d(17,12,30), resp: "Rodrigo Muñoz" },
  { area: "Seca", id: "10", ot: "792466", parent: "CHUTE 7 / INSTALACION SENSORES POLEA MOTRIZ", name: "Modificación posición sensor tilt switch", start: d(17,12,30), end: d(17,13,30), resp: "Rodrigo Muñoz" },  
  { area: "Seca", id: "13", ot: "793212", parent: "CHUTE 7 / INSTALACION SENSORES POLEA MOTRIZ", name: "Desbloqueo", start: d(18,19,0), end: d(18,19,30), resp: "Jose Avalos" },  
  { area: "Seca", id: "15", ot: "793212", parent: "CHUTE 7 / CAMBIO ELEMENTOS DESGASTE", name: "Bloqueo de equipo (Chute 4)", start: d(18,9,30), end: d(18,10,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "17", ot: "-", parent: "CHUTE 7 / CAMBIO ELEMENTOS DESGASTE", name: "Desbloqueo", start: d(18,19,0), end: d(18,19,30), resp: "Jose Avalos" },
  
// CHUTE 4
  { area: "Seca", id: "19", ot: "-", parent: "CHUTE 4", name: "Bloqueo de equipo", start: d(17,7,0), end: d(17,7,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "21", ot: "793212", parent: "CHUTE 4", name: "Desbloqueo", start: d(17,16,30), end: d(17,17,0), resp: "Vicente Fuentes" },

  // CAMBIO REDUCTOR G1-CORREA 2
  { area: "Seca", id: "28", ot: "S/OT", parent: "CAMBIO REDUCTOR G1-CORREA 2 / PREPARATIVOS", name: "Desconexión de motor", start: d(17,7,0), end: d(17,7,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "33", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Bloqueo de CVB-002", start: d(17,7,0), end: d(17,7,30), resp: "Patricio Gutierrez" },
  { area: "Seca", id: "39", ot: "S/OT", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Pruebas de sentido de giro", start: d(17,14,18), end: d(17,14,48), resp: "Vicente Fuentes" },
  { area: "Seca", id: "41", ot: "-", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Pruebas de sentido de giro", start: d(17,15,48), end: d(17,16,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "42", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Desbloqueo Correa 2", start: d(17,16,0), end: d(17,17,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "45", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Bloqueo Correa 2", start: d(18,9,0), end: d(18,9,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "48", ot: "798885", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Instalación de instrumentación", start: d(18,16,0), end: d(18,18,0), resp: "Francis Torres" },
  { area: "Seca", id: "50", ot: "793212", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Desbloqueo", start: d(18,18,30), end: d(18,19,0), resp: "Jose Avalos" },
  { area: "Seca", id: "51", ot: "798885", parent: "CAMBIO REDUCTOR G1-CORREA 2 / MONTAJE", name: "Pruebas funcionales", start: d(18,18,30), end: d(18,19,0), resp: "Jose Avalos" },
   
  // INSPECCIÓN MOTORES CVB-001
  { area: "Seca", id: "54", ot: "793212", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Bloqueo de equipo", start: d(17,7,0), end: d(17,7,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "55", ot: "798888", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección carbones motor M1", start: d(17,7,30), end: d(17,8,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "56", ot: "798888", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección partidor resistivo M1", start: d(17,8,0), end: d(17,9,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "57", ot: "798889", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección carbones motor M2", start: d(17,9,0), end: d(17,9,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "58", ot: "798889", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Inspección partidor resistivo M2", start: d(17,9,30), end: d(17,10,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "59", ot: "793212", parent: "INSPECCIÓN MOTORES CORREA CVB-001", name: "Desbloqueo", start: d(17,10,30), end: d(17,11,0), resp: "Vicente Fuentes" },

  // INSPECCIÓN MOTORES CVB-002
  { area: "Seca", id: "61", ot: "793214", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Bloqueo de equipo", start: d(18,10,0), end: d(18,10,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "62", ot: "798890", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M1", start: d(18,10,30), end: d(18,11,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "63", ot: "798890", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M1", start: d(18,11,0), end: d(18,12,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "64", ot: "798892", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M2", start: d(18,12,0), end: d(18,12,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "65", ot: "798892", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M2", start: d(18,12,30), end: d(18,13,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "66", ot: "798894", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M3", start: d(18,13,30), end: d(18,14,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "67", ot: "798894", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M3", start: d(18,14,0), end: d(18,15,0), resp: "Vicente Fuentes" },
  { area: "Seca", id: "68", ot: "798897", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección carbones motor M4", start: d(18,15,0), end: d(18,15,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "69", ot: "798897", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Inspección partidor resistivo M4", start: d(18,15,30), end: d(18,16,30), resp: "Vicente Fuentes" },
  { area: "Seca", id: "70", ot: "793214", parent: "INSPECCIÓN MOTORES CORREA CVB-002", name: "Desbloqueo", start: d(18,16,30), end: d(18,17,0), resp: "Jose Avalos" },

  // CAMBIO DE CINTA CVB-006
  { area: "Seca", id: "81", ot: "S/OT", parent: "CAMBIO DE CINTA CVB-006", name: "Bloqueo de cinta OPE", start: d(17,7,0), end: d(17,7,30), resp: "Nicole Troncoso" },
  { area: "Seca", id: "83", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Desbloqueo de cinta OPE", start: d(17,9,30), end: d(17,10,0), resp: "Nicole Troncoso" },
  { area: "Seca", id: "88", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Aislación y bloqueo", start: d(17,10,42), end: d(17,11,12), resp: "Nicole Troncoso" },
  { area: "Seca", id: "93", ot: "S/OT", parent: "CAMBIO DE CINTA CVB-006", name: "Retiro de instrumentación", start: d(17,13,0), end: d(17,15,0), resp: "Osvaldo Sanhueza / Ronny Velasquez" },
  { area: "Seca", id: "112", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Desbloqueo para tensado", start: d(18,20,30), end: d(18,21,0), resp: "Daniel Carrasco" },
  { area: "Seca", id: "115", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Bloqueo", start: d(18,22,0), end: d(18,22,30), resp: "Daniel Carrasco" },
  { area: "Seca", id: "117", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Instalación instrumentación", start: d(18,22,30), end: d(19,0,30), resp: "Cristopher Villalobos" },
  { area: "Seca", id: "120", ot: "798899", parent: "CAMBIO DE CINTA CVB-006", name: "Desbloqueo", start: d(19,0,30), end: d(19,1,0), resp: "Daniel Carrasco" },
  { area: "Seca", id: "121", ot: "S/OT", parent: "CAMBIO DE CINTA CVB-006", name: "Calibración cero y span (cadenas)", start: d(19,1,0), end: d(19,4,0), resp: "Cristopher Villalobos" },

  // MOLINO SAG 1 / MEDICION PERNOS
  { area: "Molienda", id: "124", ot: "-", parent: "MOLINO SAG 1 / MEDICION PERNOS", name: "Bloqueo de equipo", start: d(17,7,0), end: d(17,7,30), resp: "Sergio Rojas" },

   // MOLINO SAG 1 / CAMBIO PARRILLAS
  { area: "Molienda", id: "131", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Bloqueo de equipo", start: d(17,10,12), end: d(17,10,42), resp: "Sergio Rojas" },  
  { area: "Molienda", id: "145", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Desbloqueo", start: d(17,21,24), end: d(17,21,54), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "146", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Giro 1", start: d(17,21,54), end: d(17,22,18), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "147", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Bloqueo", start: d(17,22,18), end: d(17,22,48), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "151", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,0,36), end: d(18,1,6), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "152", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Giro 2", start: d(18,1,6), end: d(18,1,30), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "153", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,1,30), end: d(18,2,0), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "157", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,3,48), end: d(18,4,18), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "158", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Giro 3", start: d(18,4,18), end: d(18,4,42), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "159", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,4,42), end: d(18,5,12), resp: "Daniel Carrasco" },
  { area: "Molienda", id: "163", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,7,0), end: d(18,7,30), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "164", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Giro 4", start: d(18,7,30), end: d(18,7,54), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "165", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,7,54), end: d(18,8,24), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "169", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Desbloqueo", start: d(18,10,12), end: d(18,10,42), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "170", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Giro 5", start: d(18,10,42), end: d(18,11,6), resp: "Patricio Gutierrez" },
  { area: "Molienda", id: "171", ot: "-", parent: "MOLINO SAG 1 / CAMBIO PARRILLAS", name: "Bloqueo", start: d(18,11,6), end: d(18,11,36), resp: "Patricio Gutierrez" },

//CAMBIO REGADERAS INFERIORES
  { area: "Molienda", id: "181", ot: "-", parent: "MOLINO SAG 1 / CAMBIO REGADERAS", name: "Montaje de caperuza", start: d(18,22,54), end: d(18,23,24), resp: "Osvaldo Sanhueza" },
  { area: "Molienda", id: "182", ot: "-", parent: "MOLINO SAG 1 / CAMBIO REGADERAS", name: "Desbloqueo", start: d(18,23,24), end: d(18,23,54), resp: "Daniel Carrasco" },

//BOMBA PPS-011 / CAMBIO WET-END
  { area: "Molienda", id: "186", ot: "798899", parent: "BOMBA PPS-011 / CAMBIO WET-END", name: "Bloqueo de equipo", start: d(17,7,30), end: d(17,8,0), resp: "Osvaldo Sanhueza" },
  { area: "Molienda", id: "187", ot: "-", parent: "BOMBA PPS-011 / CAMBIO WET-END", name: "Desacople ductos succion/descarga", start: d(17,8,0), end: d(17,12,0), resp: "Ronny Velasquez" },
  { area: "Molienda", id: "190", ot: "-", parent: "BOMBA PPS-011 / CAMBIO WET-END", name: "Acoplamiento de ductos", start: d(18,4,0), end: d(18,6,30), resp: "Francis Torres" },
  { area: "Molienda", id: "191", ot: "-", parent: "BOMBA PPS-011 / CAMBIO WET-END", name: "Desbloqueo", start: d(18,6,30), end: d(18,7,0), resp: "Daniel Carrasco" },

//BOMBA PPS-012 / CAMBIO REPARACION FUGAS
  { area: "Molienda", id: "199", ot: "798899", parent: "BOMBA PPS-012 / REPARACIÓN FUGAS", name: "Bloqueo de equipo (Bomba PPS-012)", start: d(17,7,0), end: d(17,7,30), resp: "Osvaldo Sanhueza" },
  { area: "Molienda", id: "203", ot: "798899", parent: "BOMBA PPS-012 / REPARACIÓN FUGAS", name: "Desbloqueo", start: d(18,11,30), end: d(18,12,0), resp: "Osvaldo Sanhueza" },

//MOLINO BOLAS 1 / AJUSTE SISTEMA DE ENGRASE
  { area: "Molienda", id: "206", ot: "798899", parent: "MOLINO BOLAS 1 / SISTEMA ENGRASE", name: "Bloqueo de equipo (Molino Bolas 1)", start: d(17,7,0), end: d(17,7,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "210", ot: "798899", parent: "MOLINO BOLAS 1 / SISTEMA ENGRASE", name: "Desbloqueo de equipo", start: d(18,17,30), end: d(18,18,0), resp: "Sergio Rojas" },

//MOLINO BOLAS 1 / REFUERZO CANALETA
  { area: "Molienda", id: "212", ot: "798899", parent: "MOLINO BOLAS 1 / REFUERZO CANALETA", name: "Bloqueo equipo (Refuerzo Canaleta)", start: d(18,7,0), end: d(18,7,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "214", ot: "-", parent: "MOLINO BOLAS 1 / REFUERZO CANALETA", name: "Desbloqueo", start: d(18,19,30), end: d(18,20,0), resp: "Jose Avalos" },

//MOLINO BOLAS / REFUERZO CANALETA
  { area: "Molienda", id: "217", ot: "-", parent: "MOLINO BOLAS 2 / REFUERZO CANALETA", name: "Bloqueo de equipo (Molino Bolas 2)", start: d(17,7,0), end: d(17,7,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "219", ot: "-", parent: "MOLINO BOLAS 2 / REFUERZO CANALETA", name: "Desbloqueo", start: d(17,19,30), end: d(17,20,0), resp: "José Avalos" },

//REVISIÓN PUENTE POLO A POLO SAG 1
  { area: "Molienda", id: "236", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Posicionamiento de molino", start: d(17,7,0), end: d(17,7,15), resp: "Jorge Garrido" },
  { area: "Molienda", id: "237", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Bloqueo de equipo", start: d(17,7,15), end: d(17,7,45), resp: "Sergio Rojas" },
  { area: "Molienda", id: "238", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Montaje andamios (3 y 9)", start: d(17,7,45), end: d(17,8,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "239", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Retiro de tapas (3 y 9)", start: d(17,8,45), end: d(17,9,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "240", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Inspección de polos", start: d(17,9,45), end: d(17,13,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "241", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Instalación de tapas (3 y 9)", start: d(17,13,45), end: d(17,14,45), resp: "Jorge Garrido" },
  { area: "Molienda", id: "242", ot: "-", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Retiro de andamios (3 y 9)", start: d(17,14,45), end: d(17,15,45), resp: "Jorge Garrido" },  
  { area: "Molienda", id: "243", ot: "793279", parent: "REVISIÓN PUENTE POLO A POLO SAG 1", name: "Desbloqueo de equipos", start: d(17,15,45), end: d(17,16,15), resp: "Sergio Rojas" },

 // REV. SENSORES TEMP PAD TRUNNION SAG 1
  { area: "Molienda", id: "245", ot: "794213", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Bloqueo sistema lubricación molino", start: d(17,11,0), end: d(17,11,30), resp: "Sergio Rojas" },
  { area: "Molienda", id: "246", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Instalación de andamios (ambos lados)", start: d(17,11,30), end: d(17,12,30), resp: "Jorge Garrido" },
  { area: "Molienda", id: "248", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Retiro de sensores", start: d(17,13,0), end: d(17,14,0), resp: "Jorge Ponce" },
  { area: "Molienda", id: "249", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Medición de MONCON (PAD)", start: d(17,14,0), end: d(17,14,30), resp: "Jorge Ponce" },
  { area: "Molienda", id: "250", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Revisión sensores temp. PAD", start: d(17,14,30), end: d(17,16,0), resp: "Jorge Ponce" },
  { area: "Molienda", id: "251", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Instalación de sensores", start: d(17,16,0), end: d(17,17,0), resp: "Jorge Ponce" },
  { area: "Molienda", id: "253", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Retiro de andamios", start: d(17,17,30), end: d(17,18,30), resp: "Jorge Garrido" },
  { area: "Molienda", id: "254", ot: "-", parent: "REV. SENSORES TEMP PAD TRUNNION SAG 1", name: "Desbloqueo de equipo", start: d(17,18,30), end: d(17,19,0), resp: "Sergio Rojas" },

  //FLOTACION - CAMBIO V/V SFR 34
  { area: "Flotacion", id: "263", ot: "798900", parent: "FLOTACION / CAMBIO V/V SFR 34", name: "Aislación y bloqueo de flujo", start: d(17,9,0), end: d(17,9,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "265", ot: "798900", parent: "FLOTACION / CAMBIO V/V SFR 34", name: "Retiro de instrumentación", start: d(17,11,30), end: d(17,12,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "272", ot: "798900", parent: "FLOTACION / CAMBIO V/V SFR 34", name: "Instalación instrumentación", start: d(18,18,30), end: d(18,20,30), resp: "Francis Torres / Manuel Sanchez" },
  { area: "Flotacion", id: "274", ot: "798900", parent: "FLOTACION / CAMBIO V/V SFR 34", name: "Desbloqueo de línea", start: d(18,21,30), end: d(19,0,0), resp: "Jose Avalos" },
  { area: "Flotacion", id: "275", ot: "798900", parent: "FLOTACION / CAMBIO V/V SFR 34", name: "Calibración de válvula", start: d(18,23,30), end: d(19,0,0), resp: "Francis Torres" },

//FLOTACION - CAMBIO REDUCTOR FTR 60
  { area: "Flotacion", id: "277", ot: "798901", parent: "FLOTACION / CAMBIO REDUCTOR FTR 60", name: "Bloqueo de equipo", start: d(17,9,0), end: d(17,9,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "279", ot: "798901", parent: "FLOTACION / CAMBIO REDUCTOR FTR 60", name: "Retiro instrumentación / desconexión", start: d(17,10,30), end: d(17,12,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "290", ot: "-", parent: "FLOTACION / CAMBIO REDUCTOR FTR 60", name: "Desbloqueo", start: d(18,6,30), end: d(18,7,0), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "291", ot: "-", parent: "FLOTACION / CAMBIO REDUCTOR FTR 60", name: "Prueba de sentido de giro", start: d(18,7,0), end: d(18,7,30), resp: "Sebastian Elgueta" },
  
//FLOTACION - CAMBIO DUCTO SUCCIÓN BOMBA 141
  { area: "Flotacion", id: "293", ot: "-", parent: "CAMBIO DUCTO SUCCIÓN BOMBA 141", name: "Bloqueo", start: d(17,8,0), end: d(17,9,0), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "295", ot: "-", parent: "CAMBIO DUCTO SUCCIÓN BOMBA 141", name: "Desbloqueo", start: d(17,12,0), end: d(17,13,0), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "296", ot: "-", parent: "CAMBIO DUCTO SUCCIÓN BOMBA 141", name: "Pruebas operacionales", start: d(17,13,0), end: d(17,13,30), resp: "Sebastian Elgueta" },

//FLOTACION - CAMBIO DUCTO SUCCIÓN BOMBA 141
  { area: "Flotacion", id: "298", ot: "-", parent: "CAMBIO DUCTO SUCCIÓN BOMBA 142", name: "Bloqueo", start: d(17,13,30), end: d(17,14,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "300", ot: "-", parent: "CAMBIO DUCTO SUCCIÓN BOMBA 142", name: "Desbloqueo", start: d(17,17,30), end: d(17,18,30), resp: "Sebastian Elgueta" },
  { area: "Flotacion", id: "301", ot: "-", parent: "CAMBIO DUCTO SUCCIÓN BOMBA 142", name: "Pruebas operacionales", start: d(17,18,30), end: d(17,19,0), resp: "Sebastian Elgueta" },  
].map(t => ({
  ...t,
  status: 'pending' as const,
  progress: 0,
  weight: (t.end.getTime() - t.start.getTime()) / 60000, 
  notes: '' 
}));

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reloj Simulado 2026 (Para pruebas hoy)
  const [currentTime, setCurrentTime] = useState<Date>(() => {
    const now = new Date();
    now.setFullYear(2026);
    return now;
  });
  
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('Todas');
  const [sortBy, setSortBy] = useState<'id' | 'time'>('time');

  // --- 4. RELOJ REAL (Forzado a 2026) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      now.setFullYear(2026);
      setCurrentTime(now);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 5. CONEXIÓN FIREBASE ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.warn("Modo Offline/Auth Error:", error);
      }
    };
    initAuth();

    // ESCUCHAR CAMBIOS EN LA COLECCIÓN V20
    const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), 
      (snapshot) => {
        if (snapshot.empty) {
          initializeDB();
        } else {
          const loadedTasks = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              start: safeDate(data.start), 
              end: safeDate(data.end)
            };
          });
          setTasks(loadedTasks);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error Firebase:", error);
        setTasks(INITIAL_TASKS_DATA); // Fallback
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const initializeDB = async () => {
    console.log("Cargando las 111 Tareas E&I en Firebase...");
    const batch = writeBatch(db);
    INITIAL_TASKS_DATA.forEach(task => {
      const docRef = doc(db, COLLECTION_NAME, task.id);
      batch.set(docRef, task);
    });
    await batch.commit();
    console.log("¡Carga Completa!");
  };

  const updateTask = async (id: string, updates: any) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Error guardando en nube:", e);
    }
  };

  // --- 6. LÓGICA DE ESTADO ---
  const getTaskStatus = (task: any, now: number) => {
    const start = safeDate(task.start).getTime();
    const end = safeDate(task.end).getTime();

    if (task.progress === 100) return 'completed';
    if (now > end) return 'delayed';
    if (task.progress > 0 || (now >= start && now <= end)) return 'in-progress';
    return 'pending';
  };

  // --- 7. KPIS Y FILTROS ---
  const kpis = useMemo(() => {
    if (!tasks.length) return { total: 0, completed: 0, delayed: 0, inProgress: 0, realProgressPercent: 0 };
    
    const nowTime = currentTime.getTime();
    let completed = 0, delayed = 0, inProgress = 0;
    
    tasks.forEach(t => {
      const status = getTaskStatus(t, nowTime);
      if (status === 'completed') completed++;
      if (status === 'delayed') delayed++;
      if (status === 'in-progress') inProgress++;
    });

    const totalWeight = tasks.reduce((acc, t) => acc + (t.weight || 1), 0);
    const completedWeight = tasks.reduce((acc, t) => acc + ((t.progress/100) * (t.weight || 1)), 0);
    const realProgressPercent = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    return { total: tasks.length, completed, delayed, inProgress, realProgressPercent };
  }, [tasks, currentTime]);

  // FILTRO Y ORDENAMIENTO
  const processedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                            t.ot.includes(search) ||
                            t.resp.toLowerCase().includes(search.toLowerCase()) ||
                            t.parent.toLowerCase().includes(search.toLowerCase());
      const matchesArea = filterArea === 'Todas' || t.area === filterArea;
      return matchesSearch && matchesArea;
    });

    // Ordenar
    result.sort((a, b) => {
      if (sortBy === 'time') {
        const timeDiff = safeDate(a.start).getTime() - safeDate(b.start).getTime();
        if (timeDiff !== 0) return timeDiff;
      }
      return parseInt(a.id) - parseInt(b.id);
    });

    return result;
  }, [tasks, search, filterArea, sortBy]);


  // --- RENDER HELPERS ---
  const renderStatusBadge = (task: any) => {
    const status = getTaskStatus(task, currentTime.getTime());
    if (status === 'delayed') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse border border-red-200">
        <AlertTriangle size={12} /> ATRASADO
      </span>
    );
    if (status === 'in-progress') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
        <Activity size={12} /> En Progreso
      </span>
    );
    if (status === 'completed') return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 size={12} /> LISTO
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <Clock size={12} /> Pendiente
      </span>
    );
  };

  const renderProgressButtons = (task: any) => (
    <div className="flex gap-1 w-full justify-between sm:justify-start">
      {[0, 30, 50, 80].map(pct => (
        <button
          key={pct}
          onClick={() => updateTask(task.id, { progress: pct })}
          className={`
            flex-1 sm:flex-none h-8 sm:h-6 sm:w-8 text-xs sm:text-[10px] font-bold rounded border transition-colors
            ${task.progress === pct 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
          `}
        >
          {pct}%
        </button>
      ))}
      <button
        onClick={() => updateTask(task.id, { progress: 100 })}
        className={`
          flex-1 sm:flex-none h-8 sm:h-6 sm:w-8 text-xs sm:text-[10px] font-bold rounded border transition-colors
          ${task.progress === 100 
            ? 'bg-green-600 text-white border-green-600 shadow-sm' 
            : 'bg-white text-green-600 border-slate-200 hover:bg-green-50'}
        `}
      >
        OK
      </button>
    </div>
  );

  // --- RENDER PRINCIPAL ---
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
      <Loader2 size={40} className="animate-spin text-blue-500" />
      <p className="font-mono text-sm animate-pulse">Sincronizando Base de Datos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50 border-b-4 border-blue-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Activity className="h-8 w-8 text-blue-400 flex-shrink-0" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white" style={{ color: '#ffffff' }}>Tablero E&I: Detención 17 - 19 Feb 2026 - 45 hrs</h1>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              EN LÍNEA • {formatDay(currentTime)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 bg-slate-800/50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-slate-700 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            <span className="text-xs text-slate-300 md:hidden">HORA ACTUAL</span>
          </div>
          <p className="text-lg md:text-xl font-mono font-bold leading-none">{formatTime(currentTime)}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Progreso</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-800">{kpis.realProgressPercent.toFixed(0)}%</p>
            </div>
            <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${kpis.realProgressPercent >= 90 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
              <Activity size={18} />
            </div>
          </div>
          
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">En Ejecución</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{kpis.inProgress}</p>
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 animate-pulse">
              <Zap size={18} />
            </div>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-500">Atrasadas</p>
              <p className={`text-2xl md:text-3xl font-bold ${kpis.delayed > 0 ? 'text-red-600' : 'text-slate-800'}`}>{kpis.delayed}</p>
            </div>
            <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center ${kpis.delayed > 0 ? 'bg-red-100 text-red-600 animate-bounce' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle size={18} />
            </div>
          </div>

          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Completadas</p>
              <p className="text-3xl font-bold text-green-600">{kpis.completed}/{kpis.total}</p>
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* PLANILLA DE CONTROL */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-300px)] md:h-[700px]">
          
          <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50 rounded-t-xl sticky top-0 z-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" /> 
                  <span className="hidden md:inline">Planilla de Control E&I</span>
                  <span className="md:hidden">Tareas</span>
                  <span className="bg-slate-200 text-slate-600 text-xs py-1 px-2 rounded-full">{processedTasks.length}</span>
                </h3>
                
                {/* BOTONES DE ORDENAMIENTO */}
                <div className="flex items-center gap-2 ml-auto sm:ml-4 bg-slate-100 p-1 rounded-lg border border-slate-200">
                   <span className="text-[10px] font-bold text-slate-400 uppercase px-2 hidden sm:block">Ordenar:</span>
                   <button
                     onClick={() => setSortBy('time')}
                     className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'time' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     <Clock size={14} />
                     <span>Hora</span>
                   </button>
                   <button
                     onClick={() => setSortBy('id')}
                     className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'id' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     <Hash size={14} />
                     <span>ID</span>
                   </button>
                </div>
              </div>
              
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* BOTONES DE FILTRO DE ÁREA TIPO SWITCH */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {['Todas', 'Seca', 'Molienda', 'Flotacion'].map(area => (
                <button
                  key={area}
                  onClick={() => setFilterArea(area)}
                  className={`
                    px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                    ${filterArea === area 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}
                  `}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-50/50">
            {/* MÓVIL */}
            <div className="md:hidden p-3 space-y-3">
              {processedTasks.map(task => {
                const status = getTaskStatus(task, currentTime.getTime());
                return (
                  <div key={task.id} className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 relative overflow-hidden ${status === 'delayed' ? 'border-l-4 border-l-red-500' : status === 'in-progress' ? 'border-l-4 border-l-blue-500' : status === 'completed' ? 'border-l-4 border-l-green-500 opacity-80' : 'border-l-4 border-l-slate-300'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        {/* ID ESTILO BADGE (GRIS) */}
                        <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs">#{task.id}</span>
                        {/* OT ESTILO BADGE (AZUL) */}
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded font-mono">OT: {task.ot}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-700">{formatTime(safeDate(task.start))} - {formatTime(safeDate(task.end))}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{formatDay(safeDate(task.start))}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mb-1 flex items-center gap-1">
                        <GitMerge size={10} /> {task.parent}
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 leading-tight">{task.name}</h4>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                        <User size={12} /> {task.resp}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      {renderStatusBadge(task)}
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {renderProgressButtons(task)}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                        <div className={`h-full transition-all duration-500 ${task.progress === 100 ? 'bg-green-500' : 'bg-slate-900'}`} style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                    <textarea
                      value={task.notes || ''}
                      onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                      placeholder="Nota..."
                      className="w-full text-xs p-2 rounded border resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none h-14"
                    />
                  </div>
                );
              })}
            </div>

            {/* ESCRITORIO */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 w-16 text-center border-b border-slate-200">ID</th>
                  <th className="p-3 w-24 text-center border-b border-slate-200">OT</th>
                  <th className="p-3 w-24 text-center border-b border-slate-200">Día</th>
                  <th className="p-3 w-24 border-b border-slate-200">Hora</th>
                  <th className="p-3 border-b border-slate-200">Actividad</th>
                  <th className="p-3 w-32 border-b border-slate-200">Estado</th>
                  <th className="p-3 w-48 text-center border-b border-slate-200">Avance</th>
                  <th className="p-3 w-64 border-b border-slate-200">Notas</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 bg-white">
                {processedTasks.map(task => {
                  const status = getTaskStatus(task, currentTime.getTime());
                  return (
                    <tr key={task.id} className={`transition-colors border-l-4 ${status === 'delayed' ? 'bg-red-50 hover:bg-red-100 border-l-red-500' : status === 'in-progress' ? 'bg-blue-50 hover:bg-blue-100 border-l-blue-500' : status === 'completed' ? 'bg-green-50 opacity-70 border-l-green-500' : 'hover:bg-slate-50 border-l-transparent'}`}>
                      {/* ID ESTILO BADGE (GRIS) */}
                      <td className="p-3 text-center border-b border-slate-100">
                         <span className="bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded text-xs inline-block">
                           #{task.id}
                         </span>
                      </td>
                      {/* OT ESTILO BADGE (AZUL) */}
                      <td className="p-3 text-center border-b border-slate-100">
                         <span className="bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded text-xs inline-block font-mono">
                           {task.ot}
                         </span>
                      </td>
                      <td className="p-3 text-center text-slate-500 text-xs capitalize">{formatDay(safeDate(task.start))}</td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col text-xs font-mono text-slate-500 font-medium">
                          <span>{formatTime(safeDate(task.start))}</span>
                          <span className="text-slate-300 my-0.5">↓</span>
                          <span>{formatTime(safeDate(task.end))}</span>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex items-center gap-1.5 mb-1">
                          <GitMerge size={10} className="text-blue-500" />
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{task.parent}</span>
                        </div>
                        <div className="font-medium text-slate-800 mb-1">{task.name}</div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-2 items-center">
                          <span className="flex items-center gap-1 text-slate-500"><User size={10} /> {task.resp}</span>
                        </div>
                      </td>
                      <td className="p-3 align-top">{renderStatusBadge(task)}</td>
                      <td className="p-3 align-middle">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${task.progress === 100 ? 'bg-green-500' : 'bg-slate-900'}`} style={{ width: `${task.progress}%` }} />
                          </div>
                          {renderProgressButtons(task)}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="relative">
                          <textarea
                            value={task.notes || ''}
                            onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                            placeholder="Nota..."
                            className="w-full text-xs p-2 rounded border resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors h-16"
                          />
                          {task.notes && <div className="absolute bottom-2 right-2 text-green-500"><Save size={12} /></div>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {processedTasks.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Search size={40} className="mx-auto mb-2 opacity-20" />
                <p>No se encontraron tareas con ese filtro.</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-400">
            Mostrando {processedTasks.length} de {tasks.length} tareas sincronizadas
          </div>
        </div>
      </main>
    </div>
  );
}
