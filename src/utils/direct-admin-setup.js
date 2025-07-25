// Direct Admin Setup Script
// This script directly sets up the admin functionality in the database
// It creates necessary tables and columns if they don't exist

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local file');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple function to execute SQL directly using the REST API
async function executeSql(sqlQuery) {
  try {
    console.log('Executing SQL:', sqlQuery.substring(0, 50) + '...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        sql_string: sqlQuery
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`SQL execution failed: ${JSON.stringify(errorData)}`);
    }
    
    return true;
  } catch (error) {
    console.error('SQL execution error:', error.message);
    
    // Check if the error is because the function doesn't exist
    if (error.message.includes('function exec_sql') && error.message.includes('does not exist')) {
      // Create the exec_sql function
      try {
        console.log('Creating exec_sql function...');
        
        const createFunctionResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
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
            `
          })
        });
        
        if (!createFunctionResponse.ok) {
          throw new Error('Failed to create exec_sql function');
        }
        
        // Try executing the original query again
        return executeSql(sqlQuery);
      } catch (createError) {
        console.error('Failed to create exec_sql function:', createError.message);
        return false;
      }
    }
    
    return false;
  }
}

// Main function to set up admin functionality
async function setupAdmin() {
  console.log('Starting admin setup...');
  
  try {
    // Add is_admin column to profiles table
    const addIsAdminColumn = await executeSql(`
      -- Add is_admin column to profiles if it doesn't exist
      DO $$
      BEGIN
        -- Check if the profiles table exists
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'profiles'
        ) THEN
          -- Add is_admin column if it doesn't exist
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
          ) THEN
            ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Added is_admin column to profiles table';
          ELSE
            RAISE NOTICE 'is_admin column already exists in profiles table';
          END IF;
        ELSE
          RAISE NOTICE 'profiles table does not exist yet';
        END IF;
      END
      $$;
    `);
    
    if (!addIsAdminColumn) {
      console.warn('Warning: Could not add is_admin column. This might be okay if the table is created later.');
    }
    
    // Create balance_modifications table
    const createBalanceModificationsTable = await executeSql(`
      -- Create balance_modifications table if it doesn't exist
      CREATE TABLE IF NOT EXISTS balance_modifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        amount NUMERIC NOT NULL,
        is_deposit BOOLEAN NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        modified_by UUID
      );
      
      -- Add foreign key constraints if the profiles table exists
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'profiles'
        ) THEN
          -- Check if foreign keys exist before adding them
          IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'balance_modifications_user_id_fkey'
          ) THEN
            ALTER TABLE balance_modifications 
            ADD CONSTRAINT balance_modifications_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
          END IF;
          
          IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'balance_modifications_modified_by_fkey'
          ) THEN
            ALTER TABLE balance_modifications 
            ADD CONSTRAINT balance_modifications_modified_by_fkey 
            FOREIGN KEY (modified_by) REFERENCES profiles(id) ON DELETE SET NULL;
          END IF;
        END IF;
      END
      $$;
    `);
    
    if (!createBalanceModificationsTable) {
      console.error('Failed to create balance_modifications table');
      return false;
    }
    
    console.log('Admin setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up admin functionality:', error.message);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Set up admin functionality
    const setupSuccess = await setupAdmin();
    if (!setupSuccess) {
      console.error('Failed to set up admin functionality.');
      process.exit(1);
    }
    
    console.log('Admin setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
