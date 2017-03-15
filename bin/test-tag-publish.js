#!/usr/bin/env node

const spawn = require("child_process").spawn;
const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const Colors = require("colors/safe");

function error(str) {
	console.log(Colors.red("Error: " + Array.from(arguments).join(" ")));
	process.exit(1);
};

function success() {
	console.log(Colors.green(Array.from(arguments).join(" ")));
};

function output() {
	console.log(Colors.blue(Array.from(arguments).join(" ")));
};

function done() {
	success("Released new version", newVersion, "successfully.");
	process.exit(0);
};

function getCurrentVersion() {
	try {
		const pJson = require.resolve(path.resolve(process.cwd(), "./package.json"));
		delete require.cache[pJson];
		const pkg = require(pJson);
		return pkg.version;
	} catch (e) {
		error("Could not open a package.json.");
	}
};

function run(cmd, args, callback) {
	output(">", cmd, ...args);
	const proc = spawn(cmd, args, { shell: true });
	proc.stdout.pipe(process.stdout);
	proc.stderr.pipe(process.stderr);
	proc.on("close", callback);
}

function npmTest() {
	output("Testing...");
	run("npm", ["test"], function (code) {
		if (code !== 0) return error("npm test failed.");
		success("Testing Completed.");
		npmVersion();
	});
}

function npmVersion() {
	output("Updating version...");
	run("npm", ["version", version, "-m", "\"" + message + "\""], function (code) {
		if (code !== 0) return error("npm version failed.");
		newVersion = getCurrentVersion();
		success("Version updated from", oldVersion, "to", newVersion);
		gitPush();
	});
}

function gitPush() {
	output("Pushing...");
	run("git", ["push"], function (code) {
		if (code !== 0) return error("git push failed.");
		success("Pushing Completed.");
		npmPublish();
	});
}

function npmPublish() {
	output("Publishing...");
	run("npm", ["publish"], function (code) {
		if (code !== 0) return error("npm publish failed.");
		done();
	});
}

const oldVersion = getCurrentVersion();
let newVersion;
const version = process.argv[2];
// %s is npm version variable: https://docs.npmjs.com/cli/version
const message = argv.m || argv.message || "Release v%s";

if (!oldVersion) {
	error("No version in package.json found.");
}
if (!version) {
	error("No version supplied.");
}

npmTest();
