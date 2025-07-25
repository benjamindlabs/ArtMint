// Direct SQL Fix Script
// This script directly executes SQL commands to fix the database schema and make a user an admin
// Run with: node src/utils/direct-sql-fix.js

require('dotenv').config({ path: '.env.local' });
// Use import for fetch in newer Node.js versions
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = 'shipfoward@gmail.com'; // The email to make admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local file');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Function to execute SQL directly
async function executeSql(sql) {
  try {
    console.log('Executing SQL:', sql.substring(0, 50) + '...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('SQL execution error:', error.message);
    return false;
  }
}

// Function to create the exec_sql function
async function createExecSqlFunction() {
  try {
    console.log('Creating exec_sql function...');
    
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_string TEXT)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql_string;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const result = await executeSql(createFunctionSql);
    
    if (result) {
      console.log('exec_sql function created successfully');
      return true;
    } else {
      console.error('Failed to create exec_sql function');
      return false;
    }
  } catch (error) {
    console.error('Error creating exec_sql function:', error.message);
    return false;
  }
}

// Function to get user ID by email
async function getUserIdByEmail(email) {
  try {
    console.log(`Looking up user ID for email: ${email}`);
    
    // First try to get the user directly from auth.users
    const authQuery = `
      SELECT id FROM auth.users WHERE email = '${email}';
    `;
    
    const authResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: authQuery })
    });
    
    if (authResponse.ok) {
      const userData = await authResponse.json();
      if (userData && userData.length && userData[0].id) {
        console.log(`Found user ID: ${userData[0].id}`);
        return userData[0].id;
      }
    }
    
    throw new Error(`User with email ${email} not found`);
  } catch (error) {
    console.error('Error getting user ID:', error.message);
    return null;
  }
}

// Main function to fix the database and make the user an admin
async function fixDatabase() {
  try {
    console.log('Starting database fix...');
    
    // First create the exec_sql function
    const execSqlCreated = await createExecSqlFunction();
    if (!execSqlCreated) {
      console.warn('Warning: Could not create exec_sql function. Some operations may fail.');
    }
    
    // 1. Fix the profiles table
    const createProfilesTable = await executeSql(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        username TEXT,
        avatar_url TEXT,
        wallet_address TEXT,
        balance_eth NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_admin BOOLEAN DEFAULT FALSE
      );
      
      -- Add is_admin column if it doesn't exist
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
    `);
    
    if (!createProfilesTable) {
      console.warn('Warning: Could not create/update profiles table. Continuing anyway...');
    } else {
      console.log('Profiles table created/updated successfully');
    }
    
    // 2. Create items table to fix errors
    const createItemsTable = await executeSql(`
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC DEFAULT 0,
        owner_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    if (!createItemsTable) {
      console.warn('Warning: Could not create items table. Continuing anyway...');
    } else {
      console.log('Items table created successfully');
    }
    
    // 3. Create balance_modifications table
    const createBalanceModificationsTable = await executeSql(`
      CREATE TABLE IF NOT EXISTS balance_modifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        amount NUMERIC NOT NULL,
        is_deposit BOOLEAN NOT NULL DEFAULT TRUE,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        modified_by UUID
      );
    `);
    
    if (!createBalanceModificationsTable) {
      console.warn('Warning: Could not create balance_modifications table. Continuing anyway...');
    } else {
      console.log('Balance_modifications table created successfully');
    }
    
    // 4. Make the user an admin
    // First, get the user ID
    const userId = await getUserIdByEmail(targetEmail);
    
    if (!userId) {
      throw new Error(`Could not find user with email ${targetEmail}`);
    }
    
    console.log(`Found user with ID: ${userId}`);
    
    // 5. Insert or update the user's profile
    const makeAdminSql = `
      INSERT INTO profiles (id, username, created_at, balance_eth, is_admin)
      VALUES (
        '${userId}',
        '${targetEmail.split('@')[0]}',
        NOW(),
        0,
        TRUE
      )
      ON CONFLICT (id) 
      DO UPDATE SET is_admin = TRUE;
    `;
    
    const makeAdminResult = await executeSql(makeAdminSql);
    if (!makeAdminResult) {
      throw new Error('Failed to make user an admin');
    }
    
    console.log(`✅ Success! User ${targetEmail} is now an admin.`);
    console.log('You can now access the admin dashboard at /admin');
    
    return true;
  } catch (error) {
    console.error('Error fixing database:', error.message);
    return false;
  }
}

// Run the function
fixDatabase()
  .then(success => {
    if (success) {
      console.log('Database fix completed successfully!');
      process.exit(0);
    } else {
      console.error('Database fix failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
