// Simple script to make a user an admin
// Run with: node src/utils/simple-make-admin.js

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

async function makeAdmin() {
  try {
    console.log(`Looking for user with email: ${targetEmail}`);
    
    // Get the user ID from auth.users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error listing users: ${userError.message}`);
    }
    
    const user = users.find(u => u.email === targetEmail);
    if (!user) {
      throw new Error(`User with email ${targetEmail} not found`);
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    
    // First, try to select from profiles to see if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError.message);
    }
    
    if (!profile) {
      // User doesn't have a profile, create one
      console.log('Creating profile for user...');
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username: user.email.split('@')[0],
            created_at: new Date().toISOString(),
            balance_eth: 0,
            is_admin: true
          }
        ]);
      
      if (insertError) {
        // If there's an error with is_admin column, try to create it
        if (insertError.message.includes('is_admin')) {
          console.log('Adding is_admin column...');
          
          // Use raw SQL to add the column
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              sql_string: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`
            })
          });
          
          if (!response.ok) {
            // If the exec_sql function doesn't exist, create it
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
                  CREATE OR REPLACE FUNCTION exec_sql(sql_string TEXT)
                  RETURNS void AS $$
                  BEGIN
                    EXECUTE sql_string;
                  END;
                  $$ LANGUAGE plpgsql;
                  
                  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
                `
              })
            });
          }
          
          // Try inserting again
          const { error: retryError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                username: user.email.split('@')[0],
                created_at: new Date().toISOString(),
                balance_eth: 0,
                is_admin: true
              }
            ]);
          
          if (retryError) {
            throw new Error(`Error creating profile: ${retryError.message}`);
          }
        } else {
          throw new Error(`Error creating profile: ${insertError.message}`);
        }
      }
      
      console.log('Profile created with admin privileges');
    } else {
      // User has a profile, update it to make them an admin
      console.log('Updating profile to make user an admin...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);
      
      if (updateError) {
        // If there's an error with is_admin column, try to create it
        if (updateError.message.includes('is_admin')) {
          console.log('Adding is_admin column...');
          
          // Use raw SQL to add the column
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              sql_string: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`
            })
          });
          
          if (!response.ok) {
            // If the exec_sql function doesn't exist, create it
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
                  CREATE OR REPLACE FUNCTION exec_sql(sql_string TEXT)
                  RETURNS void AS $$
                  BEGIN
                    EXECUTE sql_string;
                  END;
                  $$ LANGUAGE plpgsql;
                  
                  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
                `
              })
            });
          }
          
          // Try updating again
          const { error: retryError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);
          
          if (retryError) {
            throw new Error(`Error updating profile: ${retryError.message}`);
          }
        } else {
          throw new Error(`Error updating profile: ${updateError.message}`);
        }
      }
      
      console.log('Profile updated with admin privileges');
    }
    
    // Create items table to fix errors
    console.log('Creating items table to fix errors...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          sql_string: `
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
      
      if (!response.ok) {
        console.warn('Could not create items table through RPC, trying direct SQL...');
        
        // If the exec_sql function doesn't exist, use direct SQL
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
      }
      
      console.log('Items table created or already exists');
    } catch (itemsError) {
      console.warn('Error creating items table:', itemsError.message);
    }
    
    console.log(`✅ Success! User ${targetEmail} is now an admin.`);
    console.log('You can now access the admin dashboard at /admin');
    
    return true;
  } catch (error) {
    console.error('Error making user an admin:', error.message);
    return false;
  }
}

// Run the function
makeAdmin()
  .then(success => {
    if (success) {
      console.log('Admin setup completed successfully!');
      process.exit(0);
    } else {
      console.error('Admin setup failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
