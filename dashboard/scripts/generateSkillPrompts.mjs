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

const prompts = {};

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
