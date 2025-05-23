export function getRandomBlock(x: number, y: number) {
  // Get random block type
  const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const typeIdx = Math.floor(Math.random() * types.length);
  const type = types[typeIdx];
  // Get random block colour
  const colours = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];
  const colourIdx = Math.floor(Math.random() * colours.length);
  const colour = colours[colourIdx];
  // Get random block rotation
  const rotations = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const rotationIdx = Math.floor(Math.random() * rotations.length);
  const rotation = rotations[rotationIdx];

  return {type, x, y, rotation, colour};
}
