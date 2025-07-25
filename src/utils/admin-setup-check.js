// This script checks and fixes admin-related database issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file');
  process.exit(1);
}

// For admin operations, we'll use the anon key since we don't have the service role key
// This will limit some functionality but we can still check basic database structure
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminSetup() {
  console.log('🔍 Starting admin setup check...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);

  try {
    // Check if the user is logged in
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Error: No active session found.');
      console.error('Please log in first using the web application, then run this script again.');
      process.exit(1);
    }
    
    console.log(`Logged in as: ${session.user.email}`);
    
    // Check if the user is the special admin
    if (session.user.email !== 'shipfoward@gmail.com') {
      console.warn('Warning: You are not logged in as the special admin user (shipfoward@gmail.com).');
      console.warn('Some operations may fail due to insufficient permissions.');
    } else {
      console.log('✅ Logged in as the special admin user (shipfoward@gmail.com)');
    }

    // 1. Check if profiles table exists
    console.log('Checking profiles table...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') { // Record not found
        console.log('Profile not found for current user. Creating it...');
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            username: session.user.email.split('@')[0],
            is_admin: session.user.email === 'shipfoward@gmail.com'
          });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          
          if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
            console.log('The is_admin column may not exist. This will be handled by the application code.');
          } else {
            throw new Error('Failed to create profile');
          }
        } else {
          console.log('✅ Created profile for current user');
        }
      } else if (profileError.code === '42P01') { // Table doesn't exist
        console.error('Error: Profiles table does not exist.');
        console.error('Please run the application first to set up the database schema.');
        process.exit(1);
      } else if (profileError.message.includes('column') && profileError.message.includes('does not exist')) {
        console.log('The is_admin column may not exist. This will be handled by the application code.');
      } else {
        console.error('Error checking profile:', profileError);
        throw new Error('Failed to check profile');
      }
    } else {
      console.log('✅ Profile found for current user');
      
      if (profileData.is_admin === undefined) {
        console.log('The is_admin column may not exist. This will be handled by the application code.');
      } else if (profileData.is_admin) {
        console.log('✅ User already has admin privileges');
      } else if (session.user.email === 'shipfoward@gmail.com') {
        console.log('Updating admin privileges for special admin user...');
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', session.user.id);
        
        if (updateError) {
          console.error('Error updating admin privileges:', updateError);
          console.log('This will be handled by the application code.');
        } else {
          console.log('✅ Updated admin privileges for special admin user');
        }
      }
    }
    
    // 2. Check if balance_modifications table exists
    console.log('Checking balance_modifications table...');
    
    const { data: balanceData, error: balanceError } = await supabase
      .from('balance_modifications')
      .select('id')
      .limit(1);
    
    if (balanceError) {
      if (balanceError.code === '42P01') { // Table doesn't exist
        console.log('Balance modifications table does not exist. This will be created when needed.');
      } else {
        console.error('Error checking balance_modifications table:', balanceError);
        console.log('This will be handled by the application code.');
      }
    } else {
      console.log('✅ Balance modifications table exists');
    }
    
    console.log('🎉 Admin setup check completed!');
    console.log('Note: Any missing tables or columns will be handled by the application code.');
    console.log('Please ensure you are logged in as shipfoward@gmail.com when accessing the admin panel.');
    
  } catch (error) {
    console.error('❌ Error during admin setup check:', error);
    process.exit(1);
  }
}

// Run the function
checkAdminSetup();
