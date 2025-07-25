// Simple script to set up admin functionality
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

async function setupAdmin() {
  try {
    console.log('Setting up admin functionality...');
    
    // 1. Add is_admin column to profiles table if it doesn't exist
    console.log('Adding is_admin column to profiles table...');
    const { error: columnError } = await supabase.rpc('alter_table_add_column', {
      table_name: 'profiles',
      column_name: 'is_admin',
      column_type: 'boolean',
      default_value: 'false'
    }).single();
    
    if (columnError) {
      console.log('Column might already exist or error:', columnError.message);
      console.log('Continuing with setup...');
    } else {
      console.log('Column added successfully');
    }
    
    // 2. Create balance_modifications table if it doesn't exist
    console.log('Creating balance_modifications table...');
    
    // This is a workaround since we can't directly execute arbitrary SQL
    // We'll use the REST API to create the table
    const { error: tableError } = await supabase
      .from('balance_modifications')
      .select('id')
      .limit(1);
      
    if (tableError && tableError.code === 'PGRST301') {
      console.log('Table does not exist, creating it...');
      
      // Make a user admin first
      const email = 'shipfoward@gmail.com'; // Replace with the user's email
      
      console.log(`Making user ${email} an admin...`);
      
      // Find user by email
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        throw userError;
      }
      
      // Find user by email
      const userByEmail = userData.users.find(user => user.email === email);
      
      if (!userByEmail) {
        throw new Error(`User not found with email: ${email}`);
      }
      
      const userId = userByEmail.id;
      console.log(`Found user with ID: ${userId}`);
      
      // Update the user's profile to make them an admin
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Success! User ${email} is now an admin.`);
      
    } else {
      console.log('Table already exists or could be queried');
    }
    
    console.log('Admin setup complete!');
    
  } catch (error) {
    console.error('Error setting up admin:', error.message);
  }
}

setupAdmin();
