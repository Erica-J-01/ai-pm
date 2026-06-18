/**
 * Reads every skills/<id>/SKILL.md, intake.md, and reference.md from the sibling
 * skills/ directory and writes dashboard/src/api/skillPrompts.ts.
 *
 * Run after editing any SKILL.md, intake.md, or reference.md:
 *   node scripts/generateSkillPrompts.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const skillsDir = path.resolve(__dirname, "../../skills");
const outFile = path.resolve(__dirname, "../src/api/skillPrompts.ts");

/**
 * Reframes an interactive intake.md interview for the dashboard's SINGLE-PASS
 * generation. The live orchestrator makes one API call per skill and cannot ask
 * questions back, so the interview must be used as a coverage checklist rather
 * than run literally - otherwise the model would reply with a question instead
 * of the artefact.
 */
const INTAKE_FRAMING = [
  "# Intake Interview (apply as a one-pass checklist)",
  "",
  "The skill above instructs you to run the intake interview below. In THIS",
  "context you are generating the artefact in a single pass and CANNOT ask",
  "questions interactively. Therefore:",
  "",
  "- Do NOT ask the questions one at a time, and do NOT withhold the artefact",
  "  waiting for answers or for any gating question.",
  "- Treat every question as a coverage checklist: answer each from the input",
  "  provided wherever possible.",
  "- Where the input is silent, state an explicit assumption in the output (or",
  "  mark the item `[NEEDS INPUT]`) instead of pausing to ask.",
  "- Still honour the interview's intent - the signals, conditional topics, and",
  "  the quality bar it sets - when shaping the artefact.",
].join("\n");

/**
 * Parse an intake.md interview into structured questions for the dashboard's
 * intake UI. Each `### Q<id> - <title> [<bracket>]` block yields a question with
 * its blockquote prompt, suggested-answer bullets, conditional flag, and whether
 * it is the gate (bracket says "gate", else the last question).
 */
function parseIntake(md) {
  const questions = [];
  let cur = null;
  let inSuggested = false;
  const push = () => { if (cur) questions.push(cur); };

  for (const line of md.split("\n")) {
    const h = /^###\s+(Q\S+)\s*[-–]\s*(.+?)\s*\[(.*?)\]\s*$/.exec(line);
    if (h) {
      push();
      const bracket = h[3];
      cur = {
        id: h[1],
        title: h[2].trim(),
        prompt: "",
        suggested: [],
        conditional: /ask if/i.test(bracket),
        condition: bracket.trim(),
        gate: /gate/i.test(bracket),
      };
      inSuggested = false;
      continue;
    }
    if (!cur) continue;
    if (/^\s*\*\*Suggested answers:\*\*/i.test(line)) { inSuggested = true; continue; }
    if (!cur.prompt) {
      const q = /^>\s*"?(.+?)"?\s*$/.exec(line);
      if (q) { cur.prompt = q[1].trim().replace(/\*\*/g, "").replace(/`/g, ""); continue; }
    }
    if (inSuggested) {
      const b = /^\s*-\s+(.+?)\s*$/.exec(line);
      if (b) {
        const a = b[1]
          .replace(/^[A-Za-z]\)\s*/, "")
          .replace(/\*\*/g, "").replace(/`/g, "")
          .replace(/\s*\*\(default\)\*/i, "")
          .trim();
        if (a) cur.suggested.push(a);
        continue;
      }
      inSuggested = false; // first non-bullet ends the list
    }
  }
  push();
  if (questions.length && !questions.some((q) => q.gate)) {
    questions[questions.length - 1].gate = true;
  }
  return questions;
}

const prompts = {};
const intakeBySkill = {};

for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skillId = entry.name;
  const skillFile = path.join(skillsDir, skillId, "SKILL.md");
  const refFile = path.join(skillsDir, skillId, "reference.md");
  if (!fs.existsSync(skillFile)) continue;

  let skill = fs.readFileSync(skillFile, "utf-8");
  // Strip YAML frontmatter
  skill = skill.replace(/^---[\s\S]*?---\n+/, "");
  // Remove the ## Input / $ARGUMENTS section - user input goes in the Claude user message
  skill = skill.replace(/^## Input\s*\n[\s\S]*?\n---/m, "---");
  // Remove "If no input is provided" hints
  skill = skill.replace(/\*If no input is provided above.*?\*\n?/g, "");
  skill = skill.trim();

  // Inline intake.md (reframed for one-pass generation) when present, so the
  // dashboard's live orchestrator actually receives the interview content the
  // SKILL.md tells it to read - it has no file access of its own.
  const intakeFile = path.join(skillsDir, skillId, "intake.md");
  if (fs.existsSync(intakeFile)) {
    const intake = fs.readFileSync(intakeFile, "utf-8").replace(/^---[\s\S]*?---\n+/, "").trim();
    skill = skill + "\n\n---\n\n" + INTAKE_FRAMING + "\n\n" + intake;
    intakeBySkill[skillId] = parseIntake(intake); // structured questions for the intake UI
  }

  // Append reference.md worked example when present
  if (fs.existsSync(refFile)) {
    const ref = fs.readFileSync(refFile, "utf-8").trim();
    skill = skill + "\n\n---\n\n" + ref;
  }

  prompts[skillId] = skill;
}

const lines = [
  "/**",
  " * Auto-generated - do not edit by hand.",
  " * Run `node scripts/generateSkillPrompts.mjs` to regenerate after editing a SKILL.md.",
  " */",
  "",
  "export const SKILL_PROMPTS: Record<string, string> = {",
];

for (const [id, prompt] of Object.entries(prompts)) {
  lines.push(`  ${JSON.stringify(id)}: ${JSON.stringify(prompt)},`);
  lines.push("");
}

lines.push("};");

fs.writeFileSync(outFile, lines.join("\n"), "utf-8");
console.log(`✓ Generated src/api/skillPrompts.ts (${Object.keys(prompts).length} skills)`);
console.log("  Skills:", Object.keys(prompts).join(", "));

// ── intake questions (structured, for the dashboard intake UI) ──
const intakeOut = path.resolve(__dirname, "../src/api/intakeQuestions.ts");
const intakeLines = [
  "/**",
  " * Auto-generated from skills/<id>/intake.md - do not edit by hand.",
  " * Run `node scripts/generateSkillPrompts.mjs` to regenerate.",
  " */",
  "",
  "export interface IntakeQuestion {",
  "  id: string;",
  "  title: string;",
  "  prompt: string;",
  "  suggested: string[];",
  "  conditional: boolean;",
  "  condition: string;",
  "  gate: boolean;",
  "}",
  "",
  `export const INTAKE_QUESTIONS: Record<string, IntakeQuestion[]> = ${JSON.stringify(intakeBySkill, null, 2)};`,
  "",
];
fs.writeFileSync(intakeOut, intakeLines.join("\n"), "utf-8");
console.log(`✓ Generated src/api/intakeQuestions.ts (${Object.keys(intakeBySkill).length} skills with intake)`);
