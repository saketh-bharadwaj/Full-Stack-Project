import * as fs from 'node:fs';

// Load the JSON file
const marsMap = JSON.parse(fs.readFileSync('mars_map_pincode.json', 'utf-8'));

// Calculate distance and cost
const calculateDistanceAndCost = (p1, p2) => {
  const distances = marsMap.distances;
  const [c1, s1, x1] = [parseInt(p1[3]), parseInt(p1[4]), parseInt(p1[5])];
  const [c2, s2, x2] = [parseInt(p2[3]), parseInt(p2[4]), parseInt(p2[5])];

  if (!distances[p1] || !distances[p1][p2]) {
    throw new Error('Invalid pincodes or no distance found.');
  }

  const distance = distances[p1][p2];
  let costMultiplier = 0;

  if (c1 === c2 && s1 === s2 && x1 === x2) costMultiplier = 2; // Same complex
  else if (c1 === c2 && s1 === s2) costMultiplier = 5; // Same sector
  else if (c1 === c2) costMultiplier = 10; // Same colony
  else costMultiplier = 15; // Inter-colony

  const cost = costMultiplier * distance;
 
  return { distance, cost };
};



export {calculateDistanceAndCost};