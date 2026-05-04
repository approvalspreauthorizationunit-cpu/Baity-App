const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error('Error: SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN must be set in .env.local');
  process.exit(1);
}

const functions = [
  'calculate-order-totals',
  'process-order-completion',
  'process-withdrawal'
];

async function deployFunction(name) {
  console.log(`--- Deploying function: ${name} ---`);

  const functionDir = path.join(__dirname, '../supabase/functions', name);
  const codePath = path.join(functionDir, 'index.ts');

  if (!fs.existsSync(codePath)) {
    console.error(`Error: Function code not found at ${codePath}`);
    return;
  }

  const code = fs.readFileSync(codePath, 'utf8');
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${name}`;

  // 1. Check if function exists
  console.log(`Checking if function "${name}" exists...`);
  const getResponse = await fetch(url, {
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
  });

  const exists = getResponse.status === 200;
  const method = exists ? 'PATCH' : 'POST';
  const targetUrl = exists ? url : `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`;

  console.log(`${exists ? 'Updating' : 'Creating'} function "${name}"...`);

  const body = {
    name: name,
    slug: name,
    import_map: true,
    verify_jwt: true,
    body: code
  };

  const response = await fetch(targetUrl, {
    method: method,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (response.ok) {
    console.log(`Successfully deployed ${name}!`);
  } else {
    console.error(`Failed to deploy ${name}:`, result.message || result.error || result);
  }
}

async function run() {
  for (const fn of functions) {
    await deployFunction(fn);
  }
}

run();
