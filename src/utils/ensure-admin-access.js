// This script ensures that the special admin user (shipfoward@gmail.com) has admin access
// It's designed to be run from the browser console when logged in as that user

// Copy and paste this code into your browser console when logged in as shipfoward@gmail.com

async function ensureAdminAccess() {
  try {
    console.log('🔍 Starting admin access verification...');
    
    // Get the current user
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error: No user is logged in', userError);
      return;
    }
    
    console.log('👤 Logged in as:', user.email);
    
    // Check if the user is the designated admin
    const isDesignatedAdmin = user.email === 'shipfoward@gmail.com';
    
    if (!isDesignatedAdmin) {
      console.error('⚠️ This script should only be run when logged in as shipfoward@gmail.com');
      return;
    }
    
    // Check if the profiles table exists and has the required structure
    try {
      // First, check if the profiles table exists
      const { data: profilesExist, error: tableError } = await window.supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (tableError && !tableError.message.includes('does not exist')) {
        console.error('❌ Error checking profiles table:', tableError);
      }
      
      // Check if the user has a profile
      const { data: profile, error: profileError } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') { // Record not found
          console.log('📝 Creating profile for admin user...');
          
          // Create profile
          const { error: insertError } = await window.supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: 'Admin',
              balance_eth: 0,
              is_admin: true,
              created_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('❌ Error creating profile:', insertError);
            
            if (insertError.message.includes('is_admin')) {
              console.log('ℹ️ The is_admin column may be missing. Creating profile without it...');
              
              // Try again without is_admin field
              const { error: basicInsertError } = await window.supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  username: 'Admin',
                  balance_eth: 0,
                  created_at: new Date().toISOString()
                });
              
              if (basicInsertError) {
                console.error('❌ Error creating basic profile:', basicInsertError);
              } else {
                console.log('✅ Created basic profile for admin user');
              }
            }
          } else {
            console.log('✅ Created profile with admin privileges');
          }
        } else if (profileError.message.includes('is_admin')) {
          console.log('ℹ️ The is_admin column issue will be handled by the application code.');
        } else {
          console.error('❌ Error checking profile:', profileError);
        }
      } else {
        console.log('✅ Profile exists for admin user');
        
        // Try to update is_admin if it exists
        try {
          const { error: updateError } = await window.supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', user.id);
          
          if (!updateError) {
            console.log('✅ Updated is_admin to true');
          } else if (updateError.message.includes('is_admin')) {
            console.log('ℹ️ The is_admin column does not exist yet. Will be handled by application code.');
          } else {
            console.error('❌ Error updating is_admin:', updateError);
          }
        } catch (e) {
          console.log('ℹ️ Could not update is_admin, will be handled by application code');
        }
      }
      
      // Check if balance_modifications table exists, create if not
      try {
        const { error: modCheckError } = await window.supabase
          .from('balance_modifications')
          .select('id')
          .limit(1);
        
        if (modCheckError && modCheckError.message.includes('does not exist')) {
          console.log('📝 balance_modifications table does not exist. Creating it would require SQL access.');
        }
      } catch (e) {
        console.log('ℹ️ Could not check balance_modifications table');
      }
      
    } catch (e) {
      console.error('❌ Error during profile checks:', e);
    }
    
    console.log('✅ Admin access check complete');
    console.log('🚀 You should now be able to access the admin panel at /admin');
    console.log('📋 If you encounter issues, make sure your database has the required tables and columns.');
    
  } catch (error) {
    console.error('❌ Error ensuring admin access:', error);
  }
}

// Instructions for use:
// 1. Log in as shipfoward@gmail.com
// 2. Open your browser console (F12 or right-click > Inspect > Console)
// 3. Copy and paste this entire script into the console
// 4. Press Enter to run it
// 5. Check the console output for results
// 6. Navigate to /admin to access the admin panel

// Run the function automatically when pasted into console
ensureAdminAccess();
