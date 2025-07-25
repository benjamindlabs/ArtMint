// This script fixes admin functionality and makes a specific user an admin
// Run with: node src/utils/fix-admin.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = 'shipfoward@gmail.com'; // The email to make admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local file');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdmin() {
  try {
    console.log('Starting admin fix...');
    
    // 1. First, check if the user exists
    console.log(`Looking for user with email: ${targetEmail}`);
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error listing users: ${userError.message}`);
    }
    
    const user = users.find(u => u.email === targetEmail);
    if (!user) {
      throw new Error(`User with email ${targetEmail} not found`);
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    
    // 2. Check if profiles table exists
    console.log('Checking profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError && profileError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating profiles table...');
      await supabase.rpc('create_profiles_table', {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }).catch(async () => {
        // If RPC fails, try direct SQL
        console.log('Creating profiles table with direct SQL...');
        
        // Try to create the table directly
        await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS profiles (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                username TEXT,
                avatar_url TEXT,
                wallet_address TEXT,
                balance_eth NUMERIC DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_admin BOOLEAN DEFAULT FALSE
              );
            `
          })
        });
        
        // Create a profile for the user
        await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username: user.email.split('@')[0],
              created_at: new Date().toISOString(),
              balance_eth: 0,
              is_admin: false
            }
          ]);
      });
    } else if (profileError) {
      console.error('Error checking profiles table:', profileError.message);
    }
    
    // 3. Add is_admin column if it doesn't exist
    console.log('Adding is_admin column to profiles table...');
    try {
      // Try to add the column directly
      await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
          `
        })
      });
      
      console.log('is_admin column added or already exists');
    } catch (alterError) {
      console.error('Error adding is_admin column:', alterError.message);
    }
    
    // 4. Create balance_modifications table if it doesn't exist
    console.log('Creating balance_modifications table...');
    try {
      // Try to create the table directly
      await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS balance_modifications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
              amount NUMERIC NOT NULL,
              is_deposit BOOLEAN NOT NULL,
              reason TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              modified_by UUID REFERENCES profiles(id)
            );
          `
        })
      });
      
      console.log('balance_modifications table created or already exists');
    } catch (createTableError) {
      console.error('Error creating balance_modifications table:', createTableError.message);
    }
    
    // 5. Make the user an admin
    console.log(`Making user ${user.email} an admin...`);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id);
    
    if (updateError) {
      throw new Error(`Error making user an admin: ${updateError.message}`);
    }
    
    console.log(`✅ Success! User ${user.email} is now an admin.`);
    
    // 6. Fix the items table error
    console.log('Creating items table to fix errors...');
    try {
      await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS items (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              description TEXT,
              price NUMERIC DEFAULT 0,
              owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })
      });
      
      console.log('items table created or already exists');
    } catch (itemsError) {
      console.error('Error creating items table:', itemsError.message);
    }
    
    console.log('Admin setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error in fixAdmin:', error.message);
    return false;
  }
}

// Run the fix
fixAdmin()
  .then(success => {
    if (success) {
      console.log('Admin fix completed successfully!');
      process.exit(0);
    } else {
      console.error('Admin fix failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
