require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { runTests, testRole, roles } = require('./src/scripts/rls-test.js');

function runSeedScript(scriptPath, env = {}) {
  console.log(`\n🚀 Running: ${scriptPath}`);
  const command = `node ${scriptPath}`;
  return execSync(command, { 
    encoding: 'utf-8',
    env: { ...process.env, ...env }
  });
}

function updateEnvFile(newJwtObject) {
    console.log('\n📝 Updating .env file with new JWTs...');
    let envContent = fs.readFileSync('.env', 'utf-8');
    
    // Remove old JWTs
    envContent = envContent.split('\n').filter(line => !line.startsWith('TEST_JWT_')).join('\n');

    // Add new JWTs
    for (const [key, value] of Object.entries(newJwtObject)) {
        envContent += `\n${key}=${value}`;
    }

    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file updated.');
}

async function main() {
  try {
    // 1. Seed data and extract IDs
    const seedOutput = runSeedScript('src/scripts/seed-rls-test-data.js');
    console.log(seedOutput);
    const clientId = seedOutput.match(/Test Client A ID: ([\w-]+)/)[1];
    const projectId = seedOutput.match(/Test Project A ID: ([\w-]+)/)[1];
    const linkId = seedOutput.match(/Test Link A ID: ([\w-]+)/)[1];

    console.log(`\nExtracted IDs:\n  Client: ${clientId}\n  Project: ${projectId}\n  Link: ${linkId}`);

    // 2. Generate JWTs in memory
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new Error('SUPABASE_JWT_SECRET not found');

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60; // 1 hour expiry

    const newTokens = {
        TEST_JWT_ATTADMIN: jwt.sign({ role: 'app_att_admin', exp }, secret),
        TEST_JWT_CLIENTADMIN: jwt.sign({ role: 'app_client_admin', client_id: clientId, project_id: projectId, exp }, secret),
        TEST_JWT_REQUESTER: jwt.sign({ role: 'app_requester', client_id: clientId, link_ids: linkId, exp }, secret)
    };
    
    // 3. Update .env file with new tokens
    updateEnvFile(newTokens);
    
    // 4. Run RLS tests
    console.log('\n🔍 Running RLS tests...');
    
    // Override process.env with new tokens for the test run
    process.env = { ...process.env, ...newTokens };

    // Re-initialize roles with new JWTs from process.env
    const updatedRoles = [
      {
        name: 'attAdmin',
        jwt: process.env.TEST_JWT_ATTADMIN,
        expect: { select: true, insert: true, update: true, delete: true },
      },
      {
        name: 'clientAdmin',
        jwt: process.env.TEST_JWT_CLIENTADMIN,
        expect: { select: true, insert: true, update: true, delete: true },
      },
      {
        name: 'requester',
        jwt: process.env.TEST_JWT_REQUESTER,
        expect: { select: true, insert: true, update: false, delete: false },
      },
    ];

    for (const role of updatedRoles) {
      console.log(`\nRole: ${role.name}`);
      const results = await testRole(role);
      if (!results) continue;
      for (const op of ['select', 'insert', 'update', 'delete']) {
        const expected = role.expect[op];
        const actual = results[op];
        console.log(`  ${op.toUpperCase()}: ${actual ? 'ALLOWED' : 'DENIED'} (expected: ${expected ? 'ALLOWED' : 'DENIED'})`);
      }
    }

    console.log('\n🎉 RLS test run complete.');
  } catch (error) {
    console.error('\n❌ Test run failed:', error.message);
    process.exit(1);
  }
}

main(); 