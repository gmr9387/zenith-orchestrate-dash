#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const dist = path.resolve('dist/assets');
const limits = {
	'index': 800 * 1024, // 800 KB
	'vendor': 250 * 1024, // 250 KB gzip target (pre-gzip check looser)
	'css': 150 * 1024
};

function getFiles(dir) {
	return fs.existsSync(dir) ? fs.readdirSync(dir).map(f => ({ name: f, size: fs.statSync(path.join(dir, f)).size })) : [];
}

const files = getFiles(dist);
let failed = false;

function check(prefix, limit) {
	const file = files.find(f => f.name.startsWith(prefix) && f.name.endsWith('.js')) || files.find(f => f.name.startsWith(prefix) && f.name.endsWith('.css'));
	if (!file) return;
	if (file.size > limit) {
		console.error(`Budget failed: ${file.name} is ${(file.size/1024).toFixed(1)} KB > ${(limit/1024).toFixed(1)} KB`);
		failed = true;
	}
}

check('index-', limits.index);
check('vendor-', limits.vendor);
const css = files.find(f => f.name.endsWith('.css'));
if (css && css.size > limits.css) {
	console.error(`Budget failed: ${css.name} is ${(css.size/1024).toFixed(1)} KB > ${(limits.css/1024).toFixed(1)} KB`);
	failed = true;
}

if (failed) {
	process.exit(1);
} else {
	console.log('Performance budget OK');
}