#!/usr/bin/env node

// Quick API test script
const https = require('https');
const http = require('http');

const token = process.env.BEEPER_ACCESS_TOKEN;
const apiUrl = process.env.BEEPER_API_URL || 'http://localhost:23373';

if (!token) {
  console.error('BEEPER_ACCESS_TOKEN not set');
  process.exit(1);
}

console.error('Testing Beeper API...');
console.error('URL:', apiUrl);
console.error('Token:', token.substring(0, 20) + '...');

// Test connection
const url = new URL('/v1/accounts?limit=1', apiUrl);
const protocol = url.protocol === 'https:' ? https : http;

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.error('\n1. Testing connection...');
const req = protocol.request(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.error('Status:', res.statusCode);
    if (res.statusCode === 200) {
      console.error('✓ Connection successful\n');
      testSearch();
    } else {
      console.error('✗ Connection failed');
      console.error('Response:', data);
    }
  });
});

req.on('error', err => {
  console.error('✗ Connection error:', err.message);
  process.exit(1);
});

req.end();

// Test search
function testSearch() {
  console.error('2. Testing message search...');
  const searchUrl = new URL('/v1/messages/search?query=test&limit=5', apiUrl);
  
  const searchReq = protocol.request(searchUrl, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.error('Status:', res.statusCode);
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        console.error('✓ Search successful');
        console.error('Results:', result.items ? result.items.length : 0, 'messages');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('✗ Search failed');
        console.error('Response:', data);
      }
    });
  });
  
  searchReq.on('error', err => {
    console.error('✗ Search error:', err.message);
  });
  
  searchReq.end();
}
