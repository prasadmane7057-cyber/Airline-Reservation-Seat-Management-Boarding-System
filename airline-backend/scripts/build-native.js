const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const backendRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(backendRoot, '..');
const sourceRoot = path.join(repositoryRoot, 'cpp-ds', 'src');
const outputDirectory = path.join(backendRoot, 'bin');
const outputPath = path.join(
  outputDirectory,
  `cpp-ds-native-demo${process.platform === 'win32' ? '.exe' : ''}`
);
const sources = [
  'native_demo.cpp',
  'PassengerArray.cpp',
  'SeatMap2D.cpp',
  'Waitlist.cpp',
  'PNRHashTable.cpp',
  'SearchComparison.cpp',
  'SortComparison.cpp'
].map((file) => path.join(sourceRoot, file));

if (sources.some((file) => !fs.existsSync(file))) {
  console.error('C++ demo source files are missing.');
  process.exit(1);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const candidates = process.env.CXX
  ? [process.env.CXX]
  : (process.platform === 'win32' ? ['g++', 'clang++'] : ['g++', 'clang++']);
let lastError = '';

for (const compiler of candidates) {
  const result = spawnSync(compiler, [
    '-std=c++17',
    '-O2',
    '-Wall',
    '-Wextra',
    '-pedantic',
    '-I',
    sourceRoot,
    ...sources,
    '-o',
    outputPath
  ], { encoding: 'utf8', windowsHide: true });

  if (!result.error && result.status === 0) {
    console.log(`Built native C++ demo with ${compiler}: ${outputPath}`);
    process.exit(0);
  }

  lastError = result.error
    ? result.error.message
    : (result.stderr || result.stdout || `compiler exited with status ${result.status}`);
}

console.error(`Unable to build the native C++ demo: ${lastError}`);
process.exit(1);
