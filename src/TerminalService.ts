import { Listener, TerminalServiceEvent } from "./interfaces";

/**
 * TerminalService (event bus)
 * --------------------------
 * Singleton leggero per inviare eventi al terminale senza dipendenze dirette.
 * I consumer si iscrivono con `on(...)` e ricevono eventi sincroni.
 *
 * Eventi supportati:
 * - { type: "run",   cmd }               → chiede l’esecuzione di un comando
 * - { type: "print", cmd, resp }         → stampa una risposta associata a un cmd
 * - { type: "cast",  text }              → messaggio di stato/progresso (loading)
 * - { type: "clear" }                    → pulizia della history
 *
 * Uso tipico:
 *   const unsub = TerminalService.on((e) => { ... });
 *   TerminalService.run("help");
 *   TerminalService.print("echo foo", "foo");
 *   TerminalService.cast("Recupero dati…");
 *   TerminalService.clear();
 *   unsub(); // cleanup
 *
 * Nota: la consegna degli eventi è SINCRONA e nell’ordine di invio.
 * Evita lavoro pesante dentro il listener, delega ad async se necessario.
 *
 * @class Bus
 * @type {Bus}
 */
class Bus {
  private listeners = new Set<Listener>();
  private emit(e: TerminalServiceEvent) { for (const fn of this.listeners) fn(e); }

  /**
  * Registra un listener.
  * @param fn @type {Listener} Listener da registrare.  
  * @returns funzione di unsubscribe per rimuovere il listener.
  */
  on(fn: Listener) { this.listeners.add(fn); return () => this.off(fn); }
  /** Rimuove un listener precedentemente registrato. 
  * @param fn @type {Listener} Listener da registrare.  
  */
  off(fn: Listener) { this.listeners.delete(fn); }

  /** Richiede l’esecuzione di un comando nel terminale. 
  * @param cmd @type {string}  Comando originario.  
  */
  run(cmd: string) { this.emit({ type: "run", cmd }); }

  /**
 * Stampa una riga di output associata a un comando.
 * @param cmd @type {string} Comando originario (può essere stringa vuota se non pertinente).
 * @param resp @type {string} Testo di risposta da renderizzare.
 */
  print(cmd: string, resp: string) { this.emit({ type: "print", cmd, resp }); }

  /**
 * Emette un messaggio di stato/progresso (es. durante loading).
 * Il terminale può mostrarlo con uno spinner fino al completamento.
 * @param text @type {string} Testo da renderizzare.
 */
  cast(text: string) { this.emit({ type: "cast", text }); }

  /** Chiede al terminale di pulire la history. */
  clear() { this.emit({ type: "clear" }); }
}

/**
* Istanza singleton esportata di default.
* Mantieni un’unica copia della libreria per evitare più istanze del bus.
*/
export default new Bus();
