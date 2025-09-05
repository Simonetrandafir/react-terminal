// index.ts

// Component API
export { default as Terminal } from "./Terminal";

// Tipi pubblici
export type { TerminalHistory, TerminalProps, Listener, TerminalServiceEvent } from "./interfaces";

// Event bus singleton
export { default as TerminalService } from "./TerminalService";

// CSS globale della libreria (side-effect import).
import "./styles.css";
