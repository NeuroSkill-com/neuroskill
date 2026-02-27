#!/usr/bin/env node
/**
 * bin/neuroskill.ts — Entry point for the `neuroskill` CLI command.
 *
 * When installed (or linked) via npm, this file is compiled to
 * dist/bin/neuroskill.js and registered as the `neuroskill` binary so that:
 *
 *   npx neuroskill <command> [options]
 *
 * simply delegates to cli.ts with the same process.argv, no extra args
 * injected.  The CLI's main() auto-executes on import (last two lines of
 * cli.ts) and reads process.argv.slice(2) directly, so no forwarding
 * logic is needed here.
 */

import "../cli";
