# @nd-fir/react-terminal

Terminale React stile Unix, controllabile da fuori via **event bus**.  
Input multiline auto-size, wrapping adattivo, supporto a funzioni asincrone, loading interno/esterno, integrazione semplice con ContextMenu.

## Install

```bash
npm i @nd-fir/react-terminal
# oppure
pnpm add @nd-fir/react-terminal
```

**Dipendenze**

```bash
npm i react
```

## Import base

```tsx
import { Terminal, TerminalService } from "@nd-fir/react-terminal";
import "@nd-fir/react-terminal/styles.css"; // stile di default
```

> Se preferisci import **opt-in** del CSS, mantieni la riga sopra. Se vuoi gestire tu lo stile, omettila e usa classi/`options` (vedi sotto).

## Quick start

```tsx
<Terminal
  prompt="$"
  run={async (input) => {
    const [cmd, ...args] = input.trim().split(/\s+/);
    switch (cmd) {
      case "echo": return args.join(" ");
      case "help": return "Comandi: help, echo";
      default:     return \`cmd non trovato: \${cmd}\`;
    }
  }}
/>
```

E da qualunque punto della tua app:

```ts
TerminalService.print("help", "Comandi: help, echo"); // (comando, risposta)
TerminalService.run("help"); // (comando)
TerminalService.cast("Recupero dati..."); // (messaggio_loading)
TerminalService.clear(); // pulisce la history
```

## Comportamento tastiera

- **Enter** → invia comando
- **Shift+Enter** → nuova riga nell’input
- **↑/↓** → naviga la history dei comandi

## API

### `<Terminal />` Props

```ts
type TerminalProps = {
  prompt: string; // es. "$" o "nebula:~$"
  run: (input: string) => Promise<string | void | null | undefined>;
  isLoading?: boolean; // loading esterno (facoltativo)
  onContextMenu?: (e: React.MouseEvent) => void; // per delegare a ContextMenu
  options?: {
    container?: HTMLAttributes<HTMLDivElement>;
    prompt?: HTMLAttributes<HTMLSpanElement>;
    command?: HTMLAttributes<HTMLSpanElement>; // input cmd
    history?: HTMLAttributes<HTMLSpanElement>; // contenitore cmd/response in history
    response?: HTMLAttributes<HTMLDivElement>; // output
    loading?: HTMLAttributes<HTMLDivElement>; // area loading
  };
};
```

- L’input è una **textarea auto-size**.
- Il wrapping è già configurato: `white-space: pre-wrap`, `overflow-wrap: anywhere`, `word-break: break-word`.
- Se **`isLoading`** è `true`, l’input è disabilitato e compare lo spinner anche senza run interno.

### `TerminalService` (event bus)

```ts
TerminalService.run(cmd: string)                    // chiede al terminale di eseguire un comando
TerminalService.print(cmd: string, resp: string)    // append di una riga risposta (con cmd associato o vuoto)
TerminalService.cast(text: string)                  // messaggi di stato/progresso (mostrati con spinner)
TerminalService.clear()                             // pulisce la history
```

> La consegna degli eventi è **sincrona** e in-order. Non fare lavoro pesante nel listener del componente; delega a funzioni async.

## Loading interno vs esterno

- **Interno**: quando il terminale chiama `run(input)` setta da solo il loading e mostra i messaggi passati da `TerminalService.cast(...)` durante l’esecuzione.
- **Esterno**: passando la prop `isLoading={true}`, l’input viene disabilitato e compare uno spinner generico anche senza `run` interno. Utile quando vuoi bloccare UI durante operazioni di pagina o per eseguire operazioni semplici dal context menu.

## Styling / theming

- CSS di default: `@nd-fir/react-terminal/styles.css`.
- Personalizza via `options`:

```tsx
<Terminal
  prompt="nebula:~$"
  run={run}
  options={{
    container: { className: "my-term", style: { maxHeight: "28rem" } },
    prompt: { className: "text-emerald-400" },
    response: { className: "text-amber-300" },
  }}
/>
```

## Ricette

### 1) ContextMenu con PrimeReact

```tsx
import { ContextMenu } from "primereact/contextmenu";
import type { MenuItem } from "primereact/menuitem";

const cmRef = useRef<ContextMenu | null>(null);
const items: MenuItem[] = [
  { label: "Help", icon: "pi pi-question-circle", command: () => TerminalService.run("help") },
  { label: "Clear", icon: "pi pi-trash", command: () => TerminalService.clear() },
];

<>
  <ContextMenu ref={cmRef} model={items} />
  <Terminal
    prompt="$"
    run={run}
    onContextMenu={(e) => {
      e.preventDefault();
      cmRef.current?.show(e);
    }}
  />
</>;
```

### 2) Pipeline async a step con messaggi e spinner

```ts
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fakeStep(label: string, ms: number) {
  TerminalService.cast(label);
  await delay(ms);
}

const run = async (input: string) => {
  await fakeStep("Recupero dati…", 700);
  await fakeStep("Validazione…", 800);
  await fakeStep("Elaborazione…", 900);
  TerminalService.cast("Aggregazione…");
  await delay(600);
  return "Pipeline completata";
};
```

### 3) Comandi programmati all’avvio

```ts
useEffect(() => {
  TerminalService.print("", "Benvenuto");
  TerminalService.run("help");
}, []);
```

### 4) Blocco input con loading esterno

```tsx
const [busy, setBusy] = useState(false);

<Terminal prompt="$" run={run} isLoading={busy} />;
```

## Next.js / SSR

- Il componente è **client-only**: in file e/o modulo c’è `"use client"`.
- Importa il CSS nel client (layout o pagina) o applica le tue classi via `options`.

## Accessibilità

- `role="region"`, `aria-label="Terminale"`.
- Area loading con `role="status"` e `aria-live="polite"`.
- L’input riceve focus automatico; clic sul container rifocalizza l’input.

## Troubleshooting

- **Invalid hook call / doppia React** → assicurati che `react` siano installati **nel progetto** che usa la libreria e che non esistano copie duplicate nella workspace.
- **Niente stile** → importa `@nd-fir/react-terminal/styles.css` o fornisci classi via `options`.
- **Context menu di sistema** → ricorda `e.preventDefault()` in `onContextMenu`.

## License

MIT
