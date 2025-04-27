#!/usr/bin/env node

// Simple script to run Next.js development server with a clean .next directory
const { spawn } = require('child_process');

// Clean .next directory first
const clean = spawn('rm', ['-rf', '.next'], { stdio: 'inherit' });

clean.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to clean .next directory');
    process.exit(code);
  }
  
  console.log('Successfully cleaned .next directory');
  
  // Start Next.js development server
  const nextDev = spawn('node', ['node_modules/next/dist/bin/next', 'dev'], { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
  
  nextDev.on('close', (code) => {
    process.exit(code);
  });
});
