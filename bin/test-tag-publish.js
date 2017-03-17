#!/usr/bin/env node

const spawn = require("child_process").spawn;
const path = require("path");
const argv = require("minimist")(process.argv.slice(3));
const Colors = require("colors/safe");

function error() {
	console.log(Colors.red("Error: " + Array.from(arguments).join(" ")));
	process.exit(1);
};

function success() {
	console.log(Colors.green(Array.from(arguments).join(" ")));
	next();
};

function output() {
	console.log(Colors.blue(Array.from(arguments).join(" ")));
};

function done() {
	process.exit(0);
};

function config() {
	try {
		delete require.cache[require.resolve(packageJson)];
		return require(packageJson);
	} catch (e) {
		error("Could not open a package.json.");
	}
}

function format(message) {
	return escape(message.replace(/%s/g, newVersion));
}

function escape(arg) {
	return "\"" + arg.replace(/"/g, "\\\"") + "\"";
}

function run(cmd, args, callback) {
	output(">", cmd, ...args);
	const proc = spawn(cmd, args, { shell: true });
	proc.stdout.pipe(process.stdout);
	proc.stderr.pipe(process.stderr);
	proc.on("close", callback);
}

function next() {
	if (step >= steps.length) {
		done();
	}
	steps[step++]();
}

const packageJson = path.resolve(process.cwd(), "./package.json");
const version = process.argv[2];
const oldVersion = config().version;
let newVersion;
const message = argv.m || argv.message || "v%s";
const tagMessage = argv.t || argv.tag || message;
const force = argv.f || argv.force;
const noTest = argv.n || (argv.test === false);

if (!oldVersion) {
	error("No version in package.json found.");
}
if (!version) {
	error("No version supplied.");
}

const steps = [

	function () {
		if (force) return next();

		output("Checking for uncommitted changes...");
		run("git", ["diff", "--quiet"], function (code) {
			if (code !== 0) return error("There are uncommitted changes in the working tree. To skip this check use -f.");

			success("Checking completed.");
		});
	},

	function () {
		if (noTest) return next();

		output("Testing...");
		const pkg = config();
		if (!pkg.scripts || !pkg.scripts.test) {
			error("No tests found. To skip this check use -n.");
		}
		run("npm", ["test"], function (code) {
			if (code !== 0) return error("Testing failed.");
			success("Testing completed.");
		});
	},

	function () {
		output("Updating version...");
		run("npm", ["--no-git-tag-version", "version", version], function (code) {
			if (code !== 0) return error("Updating version failed.");
			newVersion = config().version;
			success("Version updated from", oldVersion, "to", newVersion);
		});
	},

	function () {
		output("Adding...");
		run("git", ["add", escape(packageJson)], function (code) {
			if (code !== 0) return error("Adding failed.");
			success("Adding completed.");
		});
	},

	function () {
		output("Committing...");
		run("git", ["commit", "-m", format(message)], function (code) {
			if (code !== 0) return error("Committing failed.");
			success("Committing completed.");
		});
	},

	function () {
		output("Tagging...");
		run("git", ["tag", "-a", "v" + newVersion, "-m", format(tagMessage)], function (code) {
			if (code !== 0) return error("Tagging failed.");
			success("Tagging completed.");
		});
	},

	function () {
		output("Pushing...");
		run("git", ["push", "--follow-tags"], function (code) {
			if (code !== 0) return error("Pushing failed.");
			success("Pushing completed.");
		});
	},

	function () {
		output("Publishing...");
		run("npm", ["publish"], function (code) {
			if (code !== 0) return error("npm publish failed.");
			success("Released new version", newVersion, "successfully.");
		});
	},
];
let step = 0;

next();
