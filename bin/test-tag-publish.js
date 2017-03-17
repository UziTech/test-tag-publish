#!/usr/bin/env node

const spawn = require("child_process").spawn;
const path = require("path");
const argv = require("minimist")(process.argv.slice(3));
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
	process.exit(0);
};

function getPkg() {
	try {
		const pJson = require.resolve(path.resolve(process.cwd(), "./package.json"));
		delete require.cache[pJson];
		const pkg = require(pJson);
		return pkg;
	} catch (e) {
		error("Could not open a package.json.");
	}
}

function getMessage(message) {
	return "\"" + message.replace(/%s/g, newVersion) + "\"";
}

function run(cmd, args, callback) {
	output(">", cmd, ...args);
	const proc = spawn(cmd, args, { shell: true });
	proc.stdout.pipe(process.stdout);
	proc.stderr.pipe(process.stderr);
	proc.on("close", callback);
}

function start() {
	if (force) return npmTest();

	output("Checking for uncommitted changes...");
	run("git", ["diff", "--quiet"], function (code) {
		if (code !== 0) return error("There are uncommitted changes in the working tree. To skip this check use -f.");

		success("Checking completed.");
		npmTest();
	});
}

function npmTest() {
	if (noTest) return npmVersion();

	output("Testing...");
	const pkg = getPkg();
	if (!pkg.scripts || !pkg.scripts.test) {
		error("No tests found. To skip this check use -n.");
	}
	run("npm", ["test"], function (code) {
		if (code !== 0) return error("Testing failed.");

		success("Testing completed.");
		npmVersion();
	});
}

function npmVersion() {
	output("Updating version...");
	run("npm", ["--no-git-tag-version", "version", version], function (code) {
		if (code !== 0) return error("Updating version failed.");

		newVersion = getPkg().version;
		success("Version updated from", oldVersion, "to", newVersion);
		gitCommit();
	});
}

function gitCommit() {
	output("Committing...");
	run("git", ["commit", "--all", "-m", getMessage(message)], function (code) {
		if (code !== 0) return error("Committing failed.");

		success("Committing completed.");
		gitTag();
	});
}

function gitTag() {
	output("Tagging...");
	run("git", ["tag", "-a", "v" + newVersion, "-m", getMessage(tagMessage)], function (code) {
		if (code !== 0) return error("Tagging failed.");

		success("Tagging completed.");
		gitPush();
	});
}

function gitPush() {
	output("Pushing...");
	run("git", ["push", "--follow-tags"], function (code) {
		if (code !== 0) return error("Pushing failed.");

		success("Pushing completed.");
		npmPublish();
	});
}

function npmPublish() {
	output("Publishing...");
	run("npm", ["publish"], function (code) {
		if (code !== 0) return error("npm publish failed.");

		success("Released new version", newVersion, "successfully.");
		done();
	});
}

const version = process.argv[2];
const oldVersion = getPkg().version;
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

start();
