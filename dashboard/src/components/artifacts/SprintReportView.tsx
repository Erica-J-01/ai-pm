import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  RAG_TONE,
  type SprintReportPayload, type RagStatus, type StatusTone,
  type GoalStatus, type VelocityAssessment, type RiskLevel,
} from "@/types/pm";
import { StatusBadge } from "./StatusBadge";
import { Panel, ListPanel } from "./Panel";

const RAG_LABEL: Record<RagStatus, string> = { red: "Red", amber: "Amber", green: "Green" };

const GOAL_TONE: Record<GoalStatus, StatusTone> = { "on-track": "success", "at-risk": "warning", missed: "danger", "not-stated": "neutral" };
const GOAL_LABEL: Record<GoalStatus, string> = { "on-track": "On track", "at-risk": "At risk", missed: "Missed", "not-stated": "Not stated in input" };
const VELOCITY_TONE: Record<VelocityAssessment, StatusTone> = { "on-trend": "success", "over-committed": "warning", "under-committed": "neutral" };
const RISK_TONE: Record<RiskLevel, StatusTone> = { Low: "success", Medium: "warning", High: "danger" };

/** /sprint-report : headline metrics, velocity + goal + risk detail, velocity (bar)
 *  and burndown (line) charts, priorities/risks, and mode-aware close-out sections. */
export function SprintReportView({ payload }: { payload: SprintReportPayload }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{payload.sprint}</p>
          <p className="text-sm text-muted-foreground">{payload.closed ? "Sprint closed (close-out)" : `Day ${payload.day} of ${payload.totalDays}`}</p>
        </div>
        <StatusBadge tone={RAG_TONE[payload.status]}>{RAG_LABEL[payload.status]}</StatusBadge>
      </div>

      {payload.movement && (
        <p className="rounded-lg border border-status-info/40 bg-status-info-bg px-3 py-2 text-xs text-status-info">
          <span className="font-semibold uppercase tracking-wide">Since last report</span> - {payload.movement}
        </p>
      )}

      {payload.summary && <p className="text-sm text-muted-foreground">{payload.summary}</p>}

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Confidence" value={payload.confidence != null ? `${payload.confidence}%` : "Not assessable"} />
        <Metric label="Completed" value={`${payload.completed}/${payload.committed} pts`} />
        <Metric label={payload.closed ? "Actuals" : "Forecast"} value={payload.forecast || "-"} />
      </div>

      {/* Delivery detail - the lines the skill's Delivery Status block adds */}
      {(payload.velocityAssessment || payload.goalStatus || payload.riskLevel) && (
        <div className="space-y-1.5 rounded-xl border border-border bg-card p-3 shadow-card">
          {payload.velocityAssessment && (
            <DetailRow label="Velocity">
              <span className="text-sm">committed {payload.committed}{payload.trailingAverage != null ? ` vs ~${payload.trailingAverage} trailing average` : ""}</span>
              <StatusBadge tone={VELOCITY_TONE[payload.velocityAssessment]}>{payload.velocityAssessment.replace("-", " ")}</StatusBadge>
            </DetailRow>
          )}
          {payload.goalStatus && (
            <DetailRow label="Sprint goal">
              <span className="text-sm">{payload.goal ?? "-"}</span>
              <StatusBadge tone={GOAL_TONE[payload.goalStatus]}>{GOAL_LABEL[payload.goalStatus]}</StatusBadge>
            </DetailRow>
          )}
          {payload.riskLevel && (
            <DetailRow label="Risk">
              <StatusBadge tone={RISK_TONE[payload.riskLevel]}>{payload.riskLevel}</StatusBadge>
            </DetailRow>
          )}
        </div>
      )}

      <Panel title="Velocity (recent sprints)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={payload.velocityTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="points" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Burndown">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={payload.burndown} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="ideal" name="Ideal" stroke="hsl(var(--status-na))" strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="remaining" name="Remaining" stroke="hsl(var(--status-info))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {payload.priorities && payload.priorities.length > 0 && <ListPanel title="Top PM priorities" items={payload.priorities} />}
      {payload.topRisks.length > 0 && <ListPanel title="Main risks" items={payload.topRisks} />}
      {payload.actionsToday && payload.actionsToday.length > 0 && <ListPanel title="Actions today" items={payload.actionsToday} />}
      {payload.standupQuestions && payload.standupQuestions.length > 0 && <ListPanel title="Questions for standup" items={payload.standupQuestions} />}
      {payload.carryover && payload.carryover.length > 0 && <ListPanel title="Carry-over and next sprint" items={payload.carryover} />}

      {payload.nextSprintImplications && (
        <Panel title="Next sprint implications">
          <p className="text-sm text-muted-foreground">{payload.nextSprintImplications}</p>
        </Panel>
      )}

      {payload.leadershipUpdate && (
        <Panel title="Leadership update">
          <p className="text-sm text-muted-foreground">{payload.leadershipUpdate}</p>
        </Panel>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right">{children}</span>
    </div>
  );
}


function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
