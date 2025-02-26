const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');

// Create Mocha instance
const mocha = new Mocha({
  timeout: 30000,
  reporter: 'spec'
});

// Get all test files
const testDir = path.join(__dirname, 'specs');
fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .forEach(file => {
    mocha.addFile(path.join(testDir, file));
  });

// Run the tests
mocha.run(failures => {
  process.exitCode = failures ? 1 : 0;
});
