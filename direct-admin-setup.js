// Direct approach to set up admin functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = 'shipfoward@gmail.com'; // The email to make admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function directAdminSetup() {
  try {
    console.log('Starting direct admin setup...');
    
    // 1. Get the user profile
    console.log(`Looking for user with email: ${email}`);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Error listing users: ${authError.message}`);
    }
    
    const user = authUsers.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    
    console.log(`Found user with ID: ${user.id}`);
    
    // 2. Get the current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      throw new Error(`Error getting profile: ${profileError.message}`);
    }
    
    console.log('Current profile data:', profile);
    
    // 3. Update the profile with admin flag
    const updatedProfile = {
      ...profile,
      is_admin: true,
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating profile with admin flag...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', user.id);
    
    if (updateError) {
      // If we get a column doesn't exist error, try to add the column
      if (updateError.message.includes('column "is_admin" does not exist')) {
        console.log('Column does not exist. Creating it...');
        
        // Try a direct insert approach
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username: profile.username,
              is_admin: true,
              updated_at: new Date().toISOString()
            }
          ])
          .onConflict('id')
          .merge();
        
        if (insertError) {
          throw new Error(`Error inserting profile: ${insertError.message}`);
        }
        
        console.log('Profile updated with admin flag via insert');
      } else {
        throw new Error(`Error updating profile: ${updateError.message}`);
      }
    } else {
      console.log('Profile updated with admin flag');
    }
    
    console.log(`✅ Success! User ${email} should now be an admin.`);
    console.log('Please restart the application and log in again to see the admin panel.');
    
  } catch (error) {
    console.error('❌ Error in direct admin setup:', error.message);
  }
}

directAdminSetup();
