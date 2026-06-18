import { useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/store/workspace";
import { useToast } from "@/store/toast";
import { testConfluenceConnection } from "@/lib/confluencePublish";
import { cn } from "@/lib/utils";
import type { McpConnector } from "@/types/pm";

export function ConnectorsDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { connectors } = useWorkspace();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connected tools</DialogTitle>
          <DialogDescription>
            Connect a tool to read live data and publish artefacts. Disconnected tools fall back to paste-in and copy-ready output.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {connectors.map((c) =>
            c.id === "claude"
              ? <ClaudeRow key={c.id} connector={c} />
              : c.id === "confluence"
              ? <ConfluenceRow key={c.id} connector={c} />
              : <GenericRow key={c.id} connector={c} />,
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────── Claude row ─────────────────────────────── */

function ClaudeRow({ connector: c }: { connector: McpConnector }) {
  const { setConnectorApi, setConnectorStatus } = useWorkspace();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(c.token ?? "");
  const [reveal, setReveal] = useState(false);

  useEffect(() => { setKey(c.token ?? ""); }, [c.token]);

  const connected = c.status === "connected";
  const dot = connected ? "bg-status-success" : "bg-status-na";

  const save = () => {
    if (!key.trim().startsWith("sk-ant-")) {
      notify({ title: "API key must start with sk-ant-", tone: "danger" });
      return;
    }
    setConnectorApi(c.id, { token: key.trim() });
    setConnectorStatus(c.id, "connected");
    setOpen(false);
    notify({ title: "Claude API key saved - orchestration is live", tone: "success" });
  };

  const remove = () => {
    setConnectorApi(c.id, { token: undefined });
    setConnectorStatus(c.id, "disconnected");
    setKey("");
    notify({ title: "Claude API key removed - using demo mode", tone: "info" });
  };

  return (
    <li className="rounded-xl border border-border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dot)} />
            {c.label}
            <span className="text-xs font-normal text-muted-foreground">
              {connected ? "live Claude orchestration" : "demo mode - add a key to go live"}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            {connected ? "Edit API key" : "Add API key"}
          </button>
        </div>
        {connected ? (
          <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={remove}>Remove</Button>
        ) : (
          <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => setOpen(true)}>
            Add key
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="space-y-1.5">
            <Label htmlFor="claude-api-key" className="text-xs">Anthropic API key</Label>
            <div className="relative">
              <Input
                id="claude-api-key"
                type={reveal ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-api03-…"
                className="h-9 pr-9 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                title={reveal ? "Hide" : "Show"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary underline underline-offset-2"
            >
              <ExternalLink className="h-3 w-3" />
              Get a key from Anthropic Console → API Keys
            </a>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Your key is stored in your browser for this tab only (sessionStorage, cleared when you close it)
            and sent only to the local Vite dev proxy, which forwards it to{" "}
            <code className="font-mono">api.anthropic.com</code>. It never leaves your machine.
          </div>
          <Button className="w-full" onClick={save} disabled={!key.trim()}>Save API key</Button>
        </div>
      )}
    </li>
  );
}

/* ─────────────────────────── Confluence row ─────────────────────────── */

type ConfluenceMode = "cloud" | "server";

function ConfluenceRow({ connector: c }: { connector: McpConnector }) {
  const { setConnectorStatus, setConnectorApi } = useWorkspace();
  const { notify } = useToast();

  const connected = c.status === "connected";

  // Infer saved mode from stored token: "x@y.com:token" → cloud, bare PAT → server
  const savedMode: ConfluenceMode = c.token?.includes(":") ? "cloud" : "server";

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ConfluenceMode>(savedMode);
  const [url, setUrl] = useState(c.endpoint ?? "");
  const [email, setEmail] = useState(() => c.token?.split(":")[0] ?? "");
  const [apiToken, setApiToken] = useState(() =>
    c.token?.includes(":") ? c.token.split(":").slice(1).join(":") : (c.token ?? ""),
  );
  const [revealToken, setRevealToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Re-seed local state when the connector changes externally (e.g. disconnect)
  useEffect(() => {
    setUrl(c.endpoint ?? "");
    const m: ConfluenceMode = c.token?.includes(":") ? "cloud" : "server";
    setMode(m);
    setEmail(c.token?.includes(":") ? (c.token.split(":")[0] ?? "") : "");
    setApiToken(c.token?.includes(":") ? c.token.split(":").slice(1).join(":") : (c.token ?? ""));
    setTestResult(null);
  }, [c.endpoint, c.token]);

  const combinedToken = mode === "cloud" ? `${email.trim()}:${apiToken.trim()}` : apiToken.trim();

  const validateUrl = (v: string) => /^https:\/\//i.test(v.trim());

  const handleTestAndConnect = async () => {
    if (!validateUrl(url)) {
      setTestResult({ ok: false, message: "URL must start with https://" });
      return;
    }
    if (mode === "cloud" && !email.trim()) {
      setTestResult({ ok: false, message: "Email address is required for Confluence Cloud." });
      return;
    }
    if (!apiToken.trim()) {
      setTestResult({ ok: false, message: mode === "cloud" ? "API token is required." : "Personal Access Token is required." });
      return;
    }

    setBusy(true);
    setTestResult(null);
    setConnectorStatus(c.id, "checking");

    // Save credentials before testing so publish can use them even on CORS error.
    setConnectorApi(c.id, { endpoint: url.trim(), token: combinedToken });

    try {
      const result = await testConfluenceConnection({
        baseUrl: url.trim(),
        token: combinedToken,
      });
      setConnectorStatus(c.id, "connected");
      setTestResult({ ok: true, message: `Connected - ${result.detail}` });
      notify({ title: `Confluence connected · ${result.detail}`, tone: "success" });
      setOpen(false);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Unknown error";
      setConnectorStatus(c.id, "error");
      setTestResult({ ok: false, message: raw });
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    setConnectorStatus(c.id, "disconnected");
    setConnectorApi(c.id, { endpoint: undefined, token: undefined });
    setUrl("");
    setEmail("");
    setApiToken("");
    setTestResult(null);
    notify({ title: "Confluence disconnected", tone: "info" });
  };

  const dot = connected ? "bg-status-success"
    : c.status === "error" ? "bg-status-danger"
    : c.status === "checking" ? "bg-status-warning animate-pulse"
    : "bg-status-na";

  const statusLabel = connected
    ? (c.detail ?? "connected")
    : c.status === "error" ? "error"
    : c.status === "checking" ? "checking…"
    : "disconnected";

  return (
    <li className="rounded-xl border border-border px-3 py-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dot)} />
            {c.label}
            <span className="text-xs font-normal text-muted-foreground">{statusLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            {c.endpoint ? "Edit connection" : "Set up connection"}
          </button>
        </div>
        {connected ? (
          <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={() => setOpen(true)}
            disabled={busy}
          >
            {busy ? "Connecting…" : "Connect"}
          </Button>
        )}
      </div>

      {/* Collapsible setup form */}
      {open && (
        <div className="mt-3 space-y-4 border-t border-border pt-3">

          {/* Mode toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs">Instance type</Label>
            <div className="flex rounded-lg border border-border p-0.5">
              {(["cloud", "server"] as ConfluenceMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setTestResult(null); }}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    mode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "cloud" ? "Confluence Cloud" : "Server / Data Center"}
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-conn-url" className="text-xs">
              {mode === "cloud" ? "Atlassian domain" : "Confluence URL"}
            </Label>
            <Input
              id="cf-conn-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={mode === "cloud" ? "https://myorg.atlassian.net" : "https://confluence.mycompany.com"}
              className="h-9 font-mono text-xs"
              disabled={busy}
            />
          </div>

          {/* Email - Cloud only */}
          {mode === "cloud" && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-conn-email" className="text-xs">Email address</Label>
              <Input
                id="cf-conn-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-9 text-xs"
                disabled={busy}
              />
              <p className="text-[11px] text-muted-foreground">
                The Atlassian account email you log in with.
              </p>
            </div>
          )}

          {/* Token / PAT */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-conn-token" className="text-xs">
              {mode === "cloud" ? "API token" : "Personal Access Token"}
            </Label>
            <div className="relative">
              <Input
                id="cf-conn-token"
                type={revealToken ? "text" : "password"}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={mode === "cloud" ? "Paste your Atlassian API token" : "Paste your PAT"}
                className="h-9 pr-9 font-mono text-xs"
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setRevealToken((r) => !r)}
                title={revealToken ? "Hide" : "Show"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {revealToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* How-to link */}
            <a
              href={
                mode === "cloud"
                  ? "https://id.atlassian.com/manage-profile/security/api-tokens"
                  : "https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary underline underline-offset-2"
            >
              <ExternalLink className="h-3 w-3" />
              {mode === "cloud"
                ? "Create an API token at Atlassian → Security"
                : "Create a PAT in Confluence → Profile → Personal Access Tokens"}
            </a>
          </div>

          {/* How auth works */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            {mode === "cloud" ? (
              <>
                <strong>Confluence Cloud</strong> uses Basic auth:{" "}
                <code className="font-mono">email:api_token</code>. Your token is combined automatically.
              </>
            ) : (
              <>
                <strong>Confluence Server / DC</strong> uses a Bearer token (PAT). Generate one in{" "}
                your profile settings with <em>read + write</em> permissions.
              </>
            )}
          </div>

          {/* Test result banner */}
          {testResult && (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-xs leading-relaxed",
                testResult.ok
                  ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <Button
            className="w-full"
            onClick={handleTestAndConnect}
            disabled={busy || !url.trim() || !apiToken.trim() || (mode === "cloud" && !email.trim())}
          >
            {busy ? "Connecting…" : connected ? "Re-test connection" : "Test & Connect"}
          </Button>
        </div>
      )}
    </li>
  );
}

/* ─────────────────────────── Generic row (all other connectors) ─────────────────────────── */

function GenericRow({ connector: c }: { connector: McpConnector }) {
  const { setConnectorStatus, setConnectorApi } = useWorkspace();
  const { notify } = useToast();
  const connected = c.status === "connected";
  const hasApi = !!c.token;

  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [endpoint, setEndpoint] = useState(c.endpoint ?? "");
  const [token, setToken] = useState(c.token ?? "");

  const toggleConnect = async () => {
    if (connected) {
      setConnectorStatus(c.id, "disconnected");
      notify({ title: `${c.label} disconnected`, tone: "info" });
      return;
    }
    if (!c.endpoint || !c.token) {
      setConnectorStatus(c.id, "connected");
      notify({ title: `${c.label} connected (add an API for a live connection)`, tone: "success" });
      return;
    }
    setBusy(true);
    setConnectorStatus(c.id, "checking");
    try {
      const res = await fetch(c.endpoint, { headers: { Authorization: `Bearer ${c.token}` } });
      if (res.ok) {
        setConnectorStatus(c.id, "connected");
        notify({ title: `${c.label} connected`, tone: "success" });
      } else {
        setConnectorStatus(c.id, "error");
        notify({ title: `${c.label} responded ${res.status}`, tone: "danger" });
      }
    } catch {
      setConnectorStatus(c.id, "error");
      notify({ title: `${c.label} unreachable (network or CORS - needs a server-side proxy)`, tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const url = endpoint.trim();
    if (!url || !/^https:\/\//i.test(url)) {
      notify({ title: "Endpoint must be a valid HTTPS URL", tone: "danger" });
      return;
    }
    if (!token.trim()) {
      notify({ title: "Add an API token", tone: "danger" });
      return;
    }
    setConnectorApi(c.id, { endpoint: url, token: token.trim() });
    setOpen(false);
    setReveal(false);
    notify({ title: `${c.label} API saved`, tone: "success" });
  };

  const remove = () => {
    setConnectorApi(c.id, { endpoint: undefined, token: undefined });
    setEndpoint("");
    setToken("");
    setOpen(false);
    notify({ title: `${c.label} API removed`, tone: "info" });
  };

  const dot = connected ? "bg-status-success"
    : c.status === "error" ? "bg-status-danger"
    : c.status === "checking" ? "bg-status-warning animate-pulse"
    : "bg-status-na";

  return (
    <li className="rounded-xl border border-border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dot)} />
            {c.label}
            <span className="text-xs font-normal text-muted-foreground">{c.detail ?? c.status}</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            {hasApi ? "API configured" : "Add API"}
          </button>
        </div>
        <Button
          size="sm"
          onClick={toggleConnect}
          disabled={busy}
          className={cn(
            "text-white",
            connected ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600",
          )}
        >
          {busy ? "Connecting…" : connected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {open && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5">
          <Input
            value={endpoint}
            placeholder="https://api.example.com/mcp"
            onChange={(e) => setEndpoint(e.target.value)}
            className="h-9"
          />
          <div className="relative">
            <Input
              type={reveal ? "text" : "password"}
              value={token}
              placeholder="API token"
              onChange={(e) => setToken(e.target.value)}
              className="h-9 pr-9"
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              title={reveal ? "Hide" : "Show"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            {hasApi && (
              <Button size="sm" variant="ghost" className="flex-1 text-destructive" onClick={remove}>
                Remove
              </Button>
            )}
            <Button size="sm" className="flex-1" onClick={save}>Save API</Button>
          </div>
        </div>
      )}
    </li>
  );
}
