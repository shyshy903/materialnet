import * as d3 from 'd3-force';

import fs from 'fs';
import { performance } from 'perf_hooks';

// Grab the edgefile off the command line args.
const edgefile = process.argv[2];
if (!edgefile) {
  console.error('usage: layout.js <edgefile>');
  process.exit(1);
}

// Parse out the edge JSON.
const text = fs.readFileSync(edgefile, 'utf8');
const edges = JSON.parse(text);

// Process nodes and edges from the edge data.
//
// Begin by collecting unique nodes and recording the source/target indices for
// each link.
let index = {};
let reverseIndex = {};
let nodes = [];
let links = [];
let count = 0;
edges.forEach(e => {
  e.forEach(n => {
    if (!index.hasOwnProperty(n)) {
      index[n] = count
      reverseIndex[count] = n;
      count++;
      nodes.push({});
    }
  });

  links.push({
    source: index[e[0]],
    target: index[e[1]]
  });
});

// Create a force simulation object.
const radius = 20;
const layout = d3.forceSimulation()
  .nodes(nodes)
  .force('charge', d3.forceManyBody())
  .force('link', d3.forceLink(links).distance(300).strength(1))
  .force('center', d3.forceCenter())
  .stop();

let cycle = 0;
const start = performance.now();
layout.on('tick', () => {
  ++cycle;

  const now = performance.now();
  const elapsed = now - start;

  const est = Math.floor(0.01 * elapsed / cycle * (300 - cycle)) / 10;

  process.stderr.write(`\r${cycle} / 300 (${Math.floor(0.01 * elapsed) / 10}s elapsed, ~${est}s remaining)`);
});

layout.on('end', () => {
  console.log(JSON.stringify(nodes.map(n => ({x: n.x, y: n.y}))));
});

layout.restart();
