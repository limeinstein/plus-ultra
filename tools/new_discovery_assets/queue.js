#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf8'));
const group = process.argv[2] || 'source';
const limit = Math.max(1, Number(process.argv[3]) || 8);
const category = process.argv[4] || '';
if (!Object.prototype.hasOwnProperty.call(prompts, group)) throw new Error(`unknown group: ${group}`);

const pending = prompts[group].filter(item => (!category || item.cat === category) &&
  !fs.existsSync(path.join(ROOT, item.target))).slice(0, limit);
process.stdout.write(JSON.stringify(pending));
