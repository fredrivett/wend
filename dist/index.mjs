#!/usr/bin/env node
import { cac } from "cac";
import * as p from "@clack/prompts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

//#region package.json
var version = "0.0.1";

//#endregion
//#region src/cli/commands/init.ts
function registerInitCommand(cli) {
	cli.command("init", "Initialize syncdocs in your project").action(async () => {
		console.clear();
		p.intro("✨ Welcome to syncdocs");
		const configPath = join(process.cwd(), "_syncdocs", "config.yaml");
		if (existsSync(configPath)) {
			const shouldOverwrite = await p.confirm({
				message: "syncdocs is already initialized. Overwrite?",
				initialValue: false
			});
			if (p.isCancel(shouldOverwrite) || !shouldOverwrite) {
				p.cancel("Setup cancelled");
				process.exit(0);
			}
		}
		const outputDir = await p.text({
			message: "Where should docs be generated?",
			placeholder: "_syncdocs"
		});
		if (p.isCancel(outputDir)) {
			p.cancel("Setup cancelled");
			process.exit(0);
		}
		const includePattern = await p.text({
			message: "Which files should be documented?",
			placeholder: "src/**/*.{ts,tsx,js,jsx}"
		});
		if (p.isCancel(includePattern)) {
			p.cancel("Setup cancelled");
			process.exit(0);
		}
		const excludePattern = await p.text({
			message: "Which files should be excluded?",
			placeholder: "**/*.test.ts,**/*.spec.ts",
			initialValue: "**/*.test.ts,**/*.spec.ts"
		});
		if (p.isCancel(excludePattern)) {
			p.cancel("Setup cancelled");
			process.exit(0);
		}
		const aiProvider = await p.select({
			message: "Which AI provider?",
			options: [
				{
					value: "anthropic",
					label: "Anthropic (Claude)"
				},
				{
					value: "openai",
					label: "OpenAI (GPT-4)"
				},
				{
					value: "claude-code",
					label: "Use Claude Code access"
				}
			],
			initialValue: "anthropic"
		});
		if (p.isCancel(aiProvider)) {
			p.cancel("Setup cancelled");
			process.exit(0);
		}
		const docStyle = await p.select({
			message: "How should docs be written?",
			options: [
				{
					value: "senior",
					label: "For senior engineers",
					hint: "Focus on why, edge cases, trade-offs"
				},
				{
					value: "onboarding",
					label: "For new team members",
					hint: "Focus on what, how it works, examples"
				},
				{
					value: "custom",
					label: "Custom prompt (advanced)",
					hint: "Define your own doc generation guidelines"
				}
			],
			initialValue: "senior"
		});
		if (p.isCancel(docStyle)) {
			p.cancel("Setup cancelled");
			process.exit(0);
		}
		let customPrompt = "";
		if (docStyle === "custom") {
			const prompt = await p.text({
				message: "Enter your documentation prompt:",
				placeholder: "Document for...",
				validate: (value) => {
					if (!value) return "Prompt is required";
				}
			});
			if (p.isCancel(prompt)) {
				p.cancel("Setup cancelled");
				process.exit(0);
			}
			customPrompt = prompt;
		}
		const includeCommits = await p.confirm({
			message: "Include git commit messages in generation?",
			initialValue: true
		});
		if (p.isCancel(includeCommits)) {
			p.cancel("Setup cancelled");
			process.exit(0);
		}
		const s = p.spinner();
		s.start("Creating configuration...");
		const config = {
			output: { dir: outputDir },
			scope: {
				include: [includePattern],
				exclude: excludePattern.split(",").map((p) => p.trim()).filter(Boolean)
			},
			generation: {
				prompt: getPromptForStyle(docStyle, customPrompt),
				aiProvider
			},
			git: {
				includeCommitMessages: includeCommits,
				commitDepth: 10
			}
		};
		await mkdir(join(process.cwd(), outputDir), { recursive: true });
		await writeFile(configPath, generateConfigYAML(config), "utf-8");
		const gitignorePath = join(process.cwd(), ".gitignore");
		if (!existsSync(gitignorePath)) await writeFile(gitignorePath, "node_modules\n", "utf-8");
		s.stop("Configuration created!");
		p.note(`Config saved to: ${outputDir}/config.yaml\n\nNext steps:\n  1. Set your API key: export ANTHROPIC_API_KEY=...\n  2. Generate your first doc: syncdocs generate\n  3. Or run: syncdocs check`, "Setup complete!");
		p.outro("Happy documenting! 📝");
	});
}
function getPromptForStyle(style, customPrompt) {
	if (style === "custom") return customPrompt;
	const prompts = {
		senior: `Document for senior engineers joining the team.
Focus on why decisions were made, not just what the code does.
Highlight non-obvious behavior, edge cases, and trade-offs.
Keep explanations concise—link to code for implementation details.`,
		onboarding: `Document for new team members learning the codebase.
Focus on what the code does and how it works together.
Explain the happy path clearly with examples.
Call out important patterns and conventions.`
	};
	return prompts[style] || prompts.senior;
}
function generateConfigYAML(config) {
	return `# syncdocs configuration
# Learn more: https://syncdocs.dev/docs/config

output:
  # Where generated documentation will be stored
  dir: ${config.output.dir}

scope:
  # Files to include in documentation
  include:
${config.scope.include.map((p) => `    - ${p}`).join("\n")}

  # Files to exclude from documentation
  exclude:
${config.scope.exclude.map((p) => `    - ${p}`).join("\n")}

generation:
  # AI provider to use for generation
  aiProvider: ${config.generation.aiProvider}

  # How documentation should be written
  prompt: |
${config.generation.prompt.split("\n").map((line) => `    ${line}`).join("\n")}

git:
  # Include commit messages when regenerating docs
  includeCommitMessages: ${config.git.includeCommitMessages}

  # How many commits back to analyze for context
  commitDepth: ${config.git.commitDepth}
`;
}

//#endregion
//#region src/cli/commands/check.ts
function registerCheckCommand(cli) {
	cli.command("check", "Check if docs are stale").option("--fix", "Regenerate stale docs").action(async (options) => {
		console.log("check command - TODO", options);
	});
}

//#endregion
//#region src/cli/commands/generate.ts
function registerGenerateCommand(cli) {
	cli.command("generate", "Generate documentation for a symbol").option("--file <path>", "Source file path").option("--symbol <name>", "Symbol name to document").action(async (options) => {
		console.log("generate command - TODO", options);
	});
}

//#endregion
//#region src/cli/commands/status.ts
function registerStatusCommand(cli) {
	cli.command("status", "Show documentation coverage").action(async () => {
		console.log("status command - TODO");
	});
}

//#endregion
//#region src/cli/utils/errors.ts
/**
* Custom error classes for syncdocs CLI
*/
var SyncDocsError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "SyncDocsError";
	}
};
var ConfigError = class extends SyncDocsError {
	constructor(message) {
		super(message);
		this.name = "ConfigError";
	}
};

//#endregion
//#region src/cli/commands/validate.ts
function registerValidateCommand(cli) {
	cli.command("validate", "Validate syncdocs configuration").action(async () => {
		try {
			const config = await loadAndValidateConfig();
			console.log("✓ Config is valid");
			console.log("✓ Output directory:", config.output?.dir);
			console.log("✓ AI provider:", config.generation?.aiProvider);
			const provider = config.generation?.aiProvider;
			if (provider === "anthropic") {
				const hasKey = !!process.env.ANTHROPIC_API_KEY;
				console.log(hasKey ? "✓ ANTHROPIC_API_KEY found" : "⚠ ANTHROPIC_API_KEY not set");
				if (!hasKey) console.log("\n  Set it with: export ANTHROPIC_API_KEY=your-key-here");
			} else if (provider === "openai") {
				const hasKey = !!process.env.OPENAI_API_KEY;
				console.log(hasKey ? "✓ OPENAI_API_KEY found" : "⚠ OPENAI_API_KEY not set");
				if (!hasKey) console.log("\n  Set it with: export OPENAI_API_KEY=your-key-here");
			}
			process.exit(0);
		} catch (error) {
			if (error instanceof ConfigError) {
				console.error("✗ Config error:", error.message);
				process.exit(2);
			}
			throw error;
		}
	});
}
async function loadAndValidateConfig() {
	const configPath = join(process.cwd(), "_syncdocs", "config.yaml");
	if (!existsSync(configPath)) throw new ConfigError("No config found. Run \"syncdocs init\" to set up syncdocs.");
	const config = parseSimpleYAML(await readFile(configPath, "utf-8"));
	if (!config.output?.dir) throw new ConfigError("Missing required field: output.dir");
	if (!config.scope?.include || config.scope.include.length === 0) throw new ConfigError("Missing required field: scope.include");
	if (!config.generation?.aiProvider) throw new ConfigError("Missing required field: generation.aiProvider");
	const validProviders = [
		"anthropic",
		"openai",
		"claude-code"
	];
	if (!validProviders.includes(config.generation.aiProvider)) throw new ConfigError(`Invalid aiProvider: ${config.generation.aiProvider}. Must be one of: ${validProviders.join(", ")}`);
	if (!config.generation?.prompt) throw new ConfigError("Missing required field: generation.prompt");
	return config;
}
function parseSimpleYAML(content) {
	const config = {};
	const lines = content.split("\n");
	let currentSection = null;
	let currentSubsection = null;
	let inMultiline = false;
	let multilineKey = "";
	let multilineValue = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim().startsWith("#") || line.trim() === "") continue;
		if (line.includes("|")) {
			inMultiline = true;
			multilineKey = line.split(":")[0].trim();
			multilineValue = [];
			continue;
		}
		if (inMultiline) {
			if (line.startsWith("    ") || line.trim() === "") multilineValue.push(line.replace(/^    /, ""));
			else {
				setNestedValue(config, currentSection, currentSubsection, multilineKey, multilineValue.join("\n").trim());
				inMultiline = false;
			}
			if (inMultiline) continue;
		}
		if (!line.startsWith(" ") && line.includes(":")) {
			currentSection = line.split(":")[0].trim();
			currentSubsection = null;
			if (!config[currentSection]) config[currentSection] = {};
			continue;
		}
		if (line.startsWith("  ") && !line.startsWith("    ")) {
			const trimmed = line.trim();
			if (trimmed.includes(":")) {
				const [key, value] = trimmed.split(":").map((s) => s.trim());
				if (value) setNestedValue(config, currentSection, null, key, parseValue(value));
				else {
					currentSubsection = key;
					if (currentSection && !config[currentSection][key]) config[currentSection][key] = [];
				}
			}
			continue;
		}
		if (line.startsWith("    -")) {
			const value = line.trim().substring(1).trim();
			if (currentSection && currentSubsection) {
				const section = config[currentSection];
				if (!Array.isArray(section[currentSubsection])) section[currentSubsection] = [];
				section[currentSubsection].push(value);
			}
		}
	}
	return config;
}
function setNestedValue(config, section, subsection, key, value) {
	if (!section) return;
	if (!subsection) config[section][key] = value;
	else {
		if (!config[section][subsection]) config[section][subsection] = {};
		config[section][subsection][key] = value;
	}
}
function parseValue(value) {
	if (value === "true") return true;
	if (value === "false") return false;
	if (/^\d+$/.test(value)) return parseInt(value, 10);
	return value;
}

//#endregion
//#region src/cli/index.ts
const cli = cac("syncdocs");
cli.version(version).help();
registerInitCommand(cli);
registerCheckCommand(cli);
registerGenerateCommand(cli);
registerStatusCommand(cli);
registerValidateCommand(cli);
cli.parse();

//#endregion
export {  };