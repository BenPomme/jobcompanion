const { exec } = require('child_process');
const fs = require('fs');

// Read CORS configuration from file
const corsConfig = JSON.parse(fs.readFileSync('./cors.json', 'utf8'));

console.log('Setting CORS configuration for Firebase Storage bucket...');
console.log('Cors configuration:', JSON.stringify(corsConfig, null, 2));

// Use Firebase CLI to set CORS configuration
// This method relies on you being logged in with Firebase CLI
exec('firebase storage:cors set cors.json', (error, stdout, stderr) => {
  if (error) {
    console.error('Error setting CORS configuration:', error);
    console.error(stderr);
    return;
  }
  
  console.log('CORS configuration output:');
  console.log(stdout);
  console.log('CORS configuration set successfully');
}); 