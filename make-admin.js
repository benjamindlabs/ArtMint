// Script to directly make a user an admin
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin() {
  try {
    const email = 'shipfoward@gmail.com'; // The email to make admin
    console.log(`Attempting to make user ${email} an admin...`);
    
    // First, check if the is_admin column exists
    console.log('Checking if is_admin column exists...');
    const { data: columnInfo, error: columnError } = await supabase
      .from('profiles')
      .select('is_admin')
      .limit(1);
    
    // If column doesn't exist, we'll add it
    if (columnError && columnError.message.includes('column "is_admin" does not exist')) {
      console.log('Adding is_admin column to profiles table...');
      
      // We'll use a direct update with a new column
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;'
      });
      
      if (alterError) {
        console.log('Error adding column:', alterError.message);
        console.log('Trying alternative approach...');
        
        // Try direct update with the column anyway
      }
    } else {
      console.log('is_admin column exists, proceeding...');
    }
    
    // Get user ID from email
    console.log('Finding user ID from email...');
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error listing users: ${userError.message}`);
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    
    console.log(`Found user with ID: ${user.id}`);
    
    // Update the user's profile to make them an admin
    console.log('Setting user as admin...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id);
    
    if (updateError) {
      if (updateError.message.includes('column "is_admin" does not exist')) {
        console.log('Column still does not exist, creating it with direct SQL...');
        // If we're still having issues, try one more approach
        const { error: finalError } = await supabase
          .from('profiles')
          .update({ is_admin: true, updated_at: new Date().toISOString() })
          .eq('id', user.id);
          
        if (finalError) {
          throw new Error(`Final attempt failed: ${finalError.message}`);
        }
      } else {
        throw new Error(`Error updating user: ${updateError.message}`);
      }
    }
    
    console.log(`✅ Success! User ${email} should now be an admin.`);
    console.log('Please restart the application and log in again to see the admin panel.');
    
  } catch (error) {
    console.error('❌ Error making user an admin:', error.message);
  }
}

makeAdmin();
