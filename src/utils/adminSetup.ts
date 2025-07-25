import { supabase } from './supabaseClient';

/**
 * Ensures that the admin user has the proper profile and permissions
 * This function can be called during application initialization
 * @param userId The ID of the user to set as admin
 * @param email The email of the user to set as admin
 */
export async function setupAdminUser(userId: string, email: string): Promise<boolean> {
  try {
    console.log(`Setting up admin user: ${email}`);
    
    // Check if this is the designated admin email
    const isDesignatedAdmin = email === 'shipfoward@gmail.com';
    
    if (!isDesignatedAdmin) {
      console.log('Not a designated admin email');
      return false;
    }
    
    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') { // Record not found
        console.log('Creating profile for admin user...');
        
        // Create profile with admin privileges
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: 'Admin',
            balance_eth: 0,
            is_admin: true,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating admin profile:', insertError);
          
          if (insertError.message.includes('is_admin')) {
            // Try again without is_admin field if column doesn't exist
            const { error: basicInsertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                username: 'Admin',
                balance_eth: 0,
                created_at: new Date().toISOString()
              });
            
            if (basicInsertError) {
              console.error('Error creating basic profile:', basicInsertError);
              return false;
            }
          } else {
            return false;
          }
        }
      } else {
        console.error('Error checking profile:', profileError);
        return false;
      }
    } else {
      // Profile exists, update is_admin if possible
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userId);
        
        if (updateError && !updateError.message.includes('is_admin')) {
          console.error('Error updating admin status:', updateError);
        }
      } catch (e) {
        console.log('Could not update is_admin, will be handled by application code');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up admin user:', error);
    return false;
  }
}

/**
 * Checks if the required admin tables exist in the database
 * This can be used to verify the database setup
 */
export async function checkAdminTables(): Promise<{
  profilesExist: boolean;
  balanceModificationsExist: boolean;
}> {
  const result = {
    profilesExist: false,
    balanceModificationsExist: false
  };
  
  try {
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    result.profilesExist = !profilesError;
    
    // Check balance_modifications table
    const { data: modifications, error: modificationsError } = await supabase
      .from('balance_modifications')
      .select('id')
      .limit(1);
    
    result.balanceModificationsExist = !modificationsError;
    
  } catch (error) {
    console.error('Error checking admin tables:', error);
  }
  
  return result;
}
