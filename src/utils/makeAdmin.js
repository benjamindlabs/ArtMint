// This script helps you make a user an admin
// Run this script with: node src/utils/makeAdmin.js <email_or_username>

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  console.error('Current values:');
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'not set'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'set (value hidden)' : 'not set'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin(identifier) {
  try {
    console.log(`Searching for user with email or username: ${identifier}`);
    
    // First try to find by email (in auth.users)
    let userId;
    let userEmail;
    
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw userError;
    }
    
    // Find user by email
    const userByEmail = userData.users.find(user => user.email === identifier);
    
    if (userByEmail) {
      userId = userByEmail.id;
      userEmail = userByEmail.email;
      console.log(`Found user by email: ${userByEmail.email} (ID: ${userId})`);
    } else {
      // Try to find by username in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('username', identifier)
        .single();
      
      if (profileError) {
        throw new Error(`User not found with email or username: ${identifier}`);
      }
      
      userId = profileData.id;
      userEmail = profileData.email;
      console.log(`Found user by username: ${profileData.username} (ID: ${userId})`);
    }
    
    // Special case for shipfoward@gmail.com - add a note
    if (userEmail === 'shipfoward@gmail.com' || identifier === 'shipfoward@gmail.com') {
      console.log('Note: Special admin access is already granted to shipfoward@gmail.com in the application code.');
      console.log('This script will still attempt to set the database flag for completeness.');
    }
    
    // Try to add is_admin column if it doesn't exist
    try {
      const { error: columnCheckError } = await supabase.rpc('exec_sql', {
        sql_string: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
            ) THEN
              ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
            END IF;
          END
          $$;
        `
      });
      
      if (columnCheckError) {
        console.warn('Warning: Could not check/add is_admin column. Will try direct update anyway.');
      }
    } catch (columnError) {
      console.warn('Warning: Error when trying to add is_admin column:', columnError.message);
    }
    
    // Update the user's profile to make them an admin
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId)
        .select('username, is_admin');
      
      if (error) {
        if (error.message.includes('column "is_admin" of relation "profiles" does not exist')) {
          console.error('Error: The is_admin column does not exist in the profiles table.');
          console.error('Please run the admin setup script first: node src/utils/direct-admin-setup.js');
          
          // Special case for shipfoward@gmail.com
          if (userEmail === 'shipfoward@gmail.com' || identifier === 'shipfoward@gmail.com') {
            console.log('\nHowever, shipfoward@gmail.com has special admin access in the application code.');
            console.log('You can still use the admin features with this account even without the database flag.');
          }
        } else {
          throw error;
        }
      } else {
        console.log(`✅ Success! User ${data[0].username} is now an admin.`);
      }
    } catch (updateError) {
      // If the update fails, try a direct SQL approach
      console.log('Trying alternative approach with direct SQL...');
      
      try {
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql_string: `
            UPDATE profiles 
            SET is_admin = TRUE 
            WHERE id = '${userId}';
          `
        });
        
        if (sqlError) {
          throw sqlError;
        }
        
        console.log(`✅ Success! User with ID ${userId} is now an admin (set via direct SQL).`);
      } catch (directSqlError) {
        console.error('❌ Error with direct SQL update:', directSqlError.message);
        
        // Special case for shipfoward@gmail.com
        if (userEmail === 'shipfoward@gmail.com' || identifier === 'shipfoward@gmail.com') {
          console.log('\nHowever, shipfoward@gmail.com has special admin access in the application code.');
          console.log('You can still use the admin features with this account even without the database flag.');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error making user an admin:', error.message);
    
    // Special case for shipfoward@gmail.com
    if (identifier === 'shipfoward@gmail.com') {
      console.log('\nHowever, shipfoward@gmail.com has special admin access in the application code.');
      console.log('You can still use the admin features with this account even without the database flag.');
    }
  }
}

// Get the username/email from command line arguments
const identifier = process.argv[2];

if (!identifier) {
  console.error('Error: Please provide an email or username');
  console.error('Usage: node src/utils/makeAdmin.js <email_or_username>');
  process.exit(1);
}

makeAdmin(identifier);
