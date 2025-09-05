"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TerminalHistory, TerminalProps, TerminalServiceEvent } from "./interfaces";
import TerminalService from "./TerminalService";

/** Spinner ASCII stile Unix */
const SPINNER = ["|", "/", "-", "\\"] as const;

/**
 * <Terminal />
 * Terminale controllato con event-bus (TerminalService) + input multiline auto-size.
 * - Enter invia. Shift+Enter va a capo.
 * - Supporta loading interno (durante run) e loading esterno (prop isLoading).
 * - Wrapping testo cmd/response adattivo alla larghezza container.
 */
export default function Terminal({ prompt, run, onContextMenu, options, isLoading }: TerminalProps) {
  /* ------------------------ STATE ------------------------ */
  const [history, setHistory] = useState<TerminalHistory[]>([]); // storia dei comandi eseguite con le relative risposte
  const [command, setCommand] = useState(""); // comando da eseguire
  const [, setHistoryIndex] = useState<number | null>(null); // posizione corrente nella history per ↑/↓
  const [internalLoading, setInternalLoading] = useState(false); // loading controllato dal componente
  const [loadingMsg, setLoadingMsg] = useState<string[]>([]); // messaggi di loading delle funzioni asincrone
  const [frame, setFrame] = useState(0); // frame dello spinner me il movimento

  /* ------------------------ REFS ------------------------ */
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  /* ------------------------ UTILS ------------------------ */
  /** Autosize della textarea: adatta height al contenuto */
  function autosize(el: HTMLTextAreaElement) {
    el.style.height = "0px"; // reset per ricalcolo affidabile
    el.style.height = `${el.scrollHeight}px`; // fit al contenuto
  }

  /* ------------------------ EFFECTS ------------------------ */
  // Autosize a ogni cambio del testo
  useLayoutEffect(() => {
    if (inputRef.current) autosize(inputRef.current);
  }, [command]);

  // Spinner: anima solo quando internalLoading è true
  useEffect(() => {
    if (!internalLoading) return;
    const id = setInterval(() => setFrame((i) => (i + 1) % SPINNER.length), 80);
    return () => clearInterval(id);
  }, [internalLoading]);

  // Sottoscrizione al bus eventi (run/print/cast/clear)
  useEffect(() => {
    return TerminalService.on(async (evt: TerminalServiceEvent) => {
      if (evt.type === "run") await runCommand(evt.cmd);
      if (evt.type === "print") setHistory((prev) => [...prev, { cmd: evt.cmd, response: evt.resp }]);
      if (evt.type === "cast") setLoadingMsg((prev) => [...prev, evt.text]);
      if (evt.type === "clear") setHistory([]);
    });
  }, [run]);

  // Autofocus iniziale + refocus al click sul container
  useEffect(() => inputRef.current?.focus(), []);
  const focusInput = () => inputRef.current?.focus();

  // Autoscroll verso il fondo quando cambia history o loading messages
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [history, loadingMsg, internalLoading]);
  // Loading esterno per comandi esterni
  useEffect(() => (isLoading ? setInternalLoading(isLoading) : undefined), [isLoading]);

  /* ------------------------ COMMAND EXECUTION ------------------------ */
  /**
   * Esegue un comando:
   * - setta loading interno
   * - mostra messaggio “Esecuzione…”
   * - chiama il runner utente
   * - appende output in history se definito
   */
  const runCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    setInternalLoading(true);
    setLoadingMsg(["Esecuzione..."]);
    try {
      const output = await run(cmd);
      if (output != null && output !== undefined) {
        setHistory((prev) => [...prev, { cmd, response: String(output) }]);
      }
    } catch (err: any) {
      setHistory((prev) => [...prev, { cmd, response: `Errore: ${err?.message ?? "esecuzione fallita"}` }]);
    } finally {
      setInternalLoading(false);
      setLoadingMsg([]);
    }
  };

  /* ------------------------ KEY HANDLERS ------------------------ */
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter invia; Shift+Enter inserisce newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const cmd = command.trim();
      if (!cmd || internalLoading) return;
      await runCommand(cmd);
      setCommand("");
      setHistoryIndex(null);
      focusInput();
      return;
    }

    // ↑: scorre history
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = prev === null ? history.length - 1 : Math.max(prev - 1, 0);
        setCommand(history[next]?.cmd ?? command);
        return next;
      });
      return;
    }

    // ↓: scorre history avanti
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistoryIndex((prev) => {
        if (prev === null) return null;
        const next = Math.min(prev + 1, history.length);
        if (next >= history.length) {
          setCommand("");
          return null;
        }
        setCommand(history[next]?.cmd ?? "");
        return next;
      });
      return;
    }
  };

  /* ------------------------ RENDER ------------------------ */
  return (
    <div
      // stile base; sovrascrivibile via options.container.className/style
      style={{
        borderColor: "lightgray",
        borderWidth: 1,
        padding: "0.6rem",
        backgroundColor: "black",
        maxHeight: "20rem",
        minHeight: "20rem",
        overflow: "auto",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e); // delega al parent per mostrare un ContextMenu
      }}
      onClick={focusInput}
      {...options?.container}
      className={`terminal ${options?.container?.className ?? ""}`.trim()}
      role="region"
      aria-label="Terminale"
    >
      {/* HISTORY */}
      <div>
        {history.map((item, i) => (
          <div key={i}>
            {/* Riga comando: prompt + cmd con wrapping adattivo */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <span {...options?.prompt}>{prompt}&nbsp;</span>
              <p
                {...options?.history}
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  fontSize: "1rem",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  margin: 0,
                }}
              >
                {item.cmd}
              </p>
            </div>

            {/* Riga risposta: wrapping adattivo */}
            <div
              {...options?.response}
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {item.response}
            </div>
          </div>
        ))}
        <span ref={endRef} />
      </div>

      {/* INPUT multilinet auto-size */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <span {...options?.prompt}>{prompt}&nbsp;</span>
        <textarea
          {...options?.command}
          ref={inputRef}
          value={command}
          onInput={(e) => {
            const el = e.currentTarget;
            setCommand(el.value);
            autosize(el);
          }}
          onKeyDown={handleKeyDown}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu?.(e);
          }}
          rows={1}
          autoComplete="off"
          spellCheck={false}
          disabled={internalLoading}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "monospace",
            fontSize: "1rem",
            width: "100%",
            marginTop: 1,
            flex: "1 1 0",
            minWidth: 0,
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            overflow: "hidden",
            resize: "none",
          }}
          aria-label="Editor comandi"
          aria-disabled={internalLoading}
        />
      </div>

      {/* LOADING area: mostra messaggi di progresso + spinner sull’ultimo */}
      {internalLoading && (
        <div aria-live="polite" role="status">
          {loadingMsg.map((val, index) => {
            const isLast = index === loadingMsg.length - 1;
            return (
              <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <p style={{ margin: 0 }}>{val}</p>
                {isLast && (
                  <span aria-hidden style={{ marginLeft: 8 }}>
                    {SPINNER[frame]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
