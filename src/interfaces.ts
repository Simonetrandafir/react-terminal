import type { HTMLAttributes } from "react";

/**
 * Eventi emessi dal TerminalService.
 * Discriminated union su `type` per switch/guard type-safe.
 */
export interface TerminalServiceRun { type: "run"; cmd: string }
export interface TerminalServicePrint { type: "print"; cmd: string; resp: string }
export interface TerminalServiceCast { type: "cast"; text: string }
export interface TerminalServiceClear { type: "clear" }

export type TerminalServiceEvent =
  | TerminalServiceRun
  | TerminalServicePrint
  | TerminalServiceCast
  | TerminalServiceClear;

/** Listener sincrono chiamato su ogni evento emesso dal bus. */
export type Listener = (e: TerminalServiceEvent) => void;

/**
 * Props del componente <Terminal />.
 * - `prompt`: prefisso mostrato prima del comando (es. "$", "cmd:~$").
 * - `options`: hook per passare HTML attributes/className/stile a sotto-elementi.
 * - `isLoading`: forza lo stato di loading esternamente (opzionale).
 * - `run`: esecutore comandi. Deve restituire stringa da appendere alla history.
 * - `onContextMenu`: handler per delegare il ContextMenu (es. PrimeReact).
 */
export interface TerminalProps {
  /** Prefisso visivo della riga di comando. */
  prompt: string;

  /**
   * Personalizzazione degli elementi DOM interni tramite HTMLAttributes.
   * Utile per classi CSS, inline style, data-attributes, ecc.
   */
  options?: {
    /** Wrapper scrollabile del terminale. */
    container?: HTMLAttributes<HTMLDivElement>;
    /** Span del prompt. */
    prompt?: HTMLAttributes<HTMLSpanElement>;
    /** Span che mostra il testo del comando nell'input. */
    command?: HTMLAttributes<HTMLSpanElement>;
    /** Span che mostra il testo del comando nella history */
    history?: HTMLAttributes<HTMLSpanElement>;
    /** Div della risposta/output. */
    response?: HTMLAttributes<HTMLDivElement>;
    /** Div dell’area di loading/progresso. */
    loading?: HTMLAttributes<HTMLDivElement>;
  };

  /**
   * Forza il loader dall’esterno. Se non fornito, il componente lo gestisce
   * in base all’esecuzione di `run`.
   */
  isLoading?: boolean;

  /**
   * Esecutore del comando. Ritorna:
   * - `string`  → verrà aggiunta alla history come risposta
   * - `void|null|undefined` → nessuna riga risposta aggiunta
   */
  run: (input: string) => Promise<string | void | null | undefined>;

  /**
   * Handler per click destro: consente al parent di mostrare un ContextMenu
   * posizionato sull’evento originale.
   */
  onContextMenu?: (e: React.MouseEvent) => void;
}

/** Una riga della history: comando inviato + risposta renderizzata. */
export interface TerminalHistory {
  cmd: string;
  response: string;
}
