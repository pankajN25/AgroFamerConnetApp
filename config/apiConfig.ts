// -----------------------------------------------------------------------------
// API Configuration
// -----------------------------------------------------------------------------
// Update PC_LAN_IP to your PC's IP whenever your WiFi network changes.
// Run `ipconfig` on PC → look for IPv4 Address under your WiFi adapter.
// Phone and PC must be on the SAME WiFi network.
// -----------------------------------------------------------------------------

import { Platform } from "react-native";

const PC_LAN_IP = "192.168.1.5";   // ← PC's LAN IP (run ipconfig to confirm)
const PORT      = "8000";

export const BASE_URL =
  Platform.OS === "android"
    ? `http://${PC_LAN_IP}:${PORT}`  // real device + emulator via LAN
    : `http://127.0.0.1:${PORT}`;   // iOS simulator
