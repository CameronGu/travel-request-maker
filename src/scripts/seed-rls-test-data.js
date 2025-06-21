/**
 * RLS Test Data Seeder
 * Creates test projects and data for RLS verification
 */

// Load root .env first
require('dotenv').config();
// Then load functions .env, which will override any duplicates
require('dotenv').config({ path: 'supabase/functions/.env' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Environment variables not found.');
  console.error('Required variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL (from .env)');
  console.error('- SERVICE_ROLE_KEY (from supabase/functions/.env)');
  process.exit(1);
}

// Create Supabase client with service role for bypassing RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedTestData() {
  console.log('🌱 Seeding RLS test data...');

  try {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');

    // Create test clients
    console.log('Creating test clients...');
    const { data: clientA, error: clientAError } = await supabase
      .from('clients')
      .insert({
        name: `Test Client A ${timestamp}`
      })
      .select()
      .single();

    if (clientAError || !clientA) {
      throw new Error(`Failed to create Client A: ${clientAError?.message || 'No data returned'}`);
    }

    const { data: clientB, error: clientBError } = await supabase
      .from('clients')
      .insert({
        name: `Test Client B ${timestamp}`
      })
      .select()
      .single();

    if (clientBError || !clientB) {
      throw new Error(`Failed to create Client B: ${clientBError?.message || 'No data returned'}`);
    }

    // Create test projects
    console.log('Creating test projects...');
    const { data: projectA, error: projectAError } = await supabase
      .from('projects')
      .insert({
        name: `RLS Smoke-Test Project A ${timestamp}`,
        client_id: clientA.id
      })
      .select()
      .single();

    if (projectAError || !projectA) {
      throw new Error(`Failed to create Project A: ${projectAError?.message || 'No data returned'}`);
    }

    const { data: projectB, error: projectBError } = await supabase
      .from('projects')
      .insert({
        name: `RLS Smoke-Test Project B ${timestamp}`,
        client_id: clientB.id
      })
      .select()
      .single();

    if (projectBError || !projectB) {
      throw new Error(`Failed to create Project B: ${projectBError?.message || 'No data returned'}`);
    }

    // Create test travelers
    console.log('Creating test travelers...');
    const { error: travelersError } = await supabase
      .from('travelers')
      .insert([
        {
          client_id: clientA.id,
          firstname: 'Test',
          lastname: `Traveler A ${timestamp}`,
          primaryemail: `traveler.a.${timestamp}@test.com`,
          phone: '555-0001'
        },
        {
          client_id: clientB.id,
          firstname: 'Test',
          lastname: `Traveler B ${timestamp}`,
          primaryemail: `traveler.b.${timestamp}@test.com`,
          phone: '555-0002'
        }
      ]);

    if (travelersError) {
      throw new Error(`Failed to create travelers: ${travelersError.message}`);
    }

    // Create test links
    console.log('Creating test links...');
    const { data: linkA, error: linkAError } = await supabase
      .from('links')
      .insert({
        client_id: clientA.id,
        project_id: projectA.id,
        role: 'requester',
        target_email: `traveler.a.${timestamp}@test.com`,
        allow_add_travelers: true,
        traveler_ids: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      })
      .select()
      .single();

    if (linkAError || !linkA) {
      throw new Error(`Failed to create Link A: ${linkAError?.message || 'No data returned'}`);
    }

    const { data: linkB, error: linkBError } = await supabase
      .from('links')
      .insert({
        client_id: clientB.id,
        project_id: projectB.id,
        role: 'requester',
        target_email: `traveler.b.${timestamp}@test.com`,
        allow_add_travelers: false,
        traveler_ids: [],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      })
      .select()
      .single();

    if (linkBError || !linkB) {
      throw new Error(`Failed to create Link B: ${linkBError?.message || 'No data returned'}`);
    }

    // Create test requests
    console.log('Creating test requests...');
    const { error: requestsError } = await supabase
      .from('requests')
      .insert([
        {
          project_id: projectA.id,
          type: 'hotel',
          blob: { test: true, state: 'pending' },
          created_via_link_id: linkA.id
        },
        {
          project_id: projectB.id,
          type: 'flight',
          blob: { test: true, state: 'pending' },
          created_via_link_id: linkB.id
        }
      ]);

    if (requestsError) {
      throw new Error(`Failed to create requests: ${requestsError.message}`);
    }

    console.log('✅ Test data seeded successfully!');
    console.log('Test Client A ID:', clientA.id);
    console.log('Test Client B ID:', clientB.id);
    console.log('Test Project A ID:', projectA.id);
    console.log('Test Link A ID:', linkA.id);
    console.log('Test Link B ID:', linkB.id);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error.message);
    process.exit(1);
  }
}

seedTestData(); 