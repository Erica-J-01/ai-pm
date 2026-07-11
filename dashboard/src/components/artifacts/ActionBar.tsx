import { Button } from "@/components/ui/button";
import type { ConnectorId, McpConnector, SaveDestination } from "@/types/pm";

const ACTIONS: { id: ConnectorId; label: string; verb: string }[] = [
  { id: "jira", label: "Jira", verb: "Push to Jira" },
  { id: "confluence", label: "Confluence", verb: "Publish to Confluence" },
  { id: "google-drive", label: "Drive", verb: "Export to Drive" },
];

/**
 * Publish/export bar. Connector-gated: a button is disabled when its MCP tool
 * isn't connected, with a title that states the failsafe (local/copy instead).
 */
export function ActionBar({
  connectors, onAction,
}: {
  connectors: McpConnector[];
  onAction: (dest: SaveDestination) => void;
}) {
  const statusOf = (id: ConnectorId) => connectors.find((c) => c.id === id)?.status ?? "disconnected";

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
      {ACTIONS.map((a) => {
        const connected = statusOf(a.id) === "connected";
        return (
          <Button
            key={a.id}
            size="sm"
            variant={connected ? "default" : "outline"}
            disabled={!connected}
            title={connected ? a.verb : `${a.label} not connected - falls back to local file / copy`}
            onClick={() => onAction(a.id)}
          >
            {a.verb}
          </Button>
        );
      })}
      <span className="mx-1 h-4 w-px bg-border" />
      <Button size="sm" variant="ghost" onClick={() => onAction("local")}>Save locally</Button>
      <Button size="sm" variant="ghost" onClick={() => onAction("clipboard")}>Copy markdown</Button>
      <Button size="sm" variant="ghost" onClick={() => onAction("pdf")}>Download PDF</Button>
    </div>
  );
}
