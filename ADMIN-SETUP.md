# Admin Panel Setup Guide

This guide will help you set up and use the admin panel for your NFT marketplace. The admin panel allows you to manage user balances and view transaction history.

## Setup Instructions

### 1. Run the Admin Database Setup

First, you need to run the SQL commands to set up the admin functionality in your Supabase database:

```bash
# Run the setup-admin.bat script
setup-admin.bat
```

This script will:
- Add an `is_admin` column to the profiles table
- Create policies to allow admins to view and modify all profiles
- Create a `balance_modifications` table to track all balance changes
- Set up proper security policies

### 2. Make a User an Admin

To make a user an admin, use the provided utility script:

```bash
# Make a user an admin by email or username
node src/utils/makeAdmin.js your_email@example.com
```

Or:

```bash
# Make a user an admin by username
node src/utils/makeAdmin.js username
```

### 3. Access the Admin Panel

Once you've made a user an admin, log in with that account. You'll see an "Admin Panel" link in your dashboard. Click on it to access the admin features.

## Admin Features

### Dashboard

The admin dashboard provides an overview of:
- Total users
- Total balance in the system
- Recent balance modifications

### User Management

In the user management section, you can:
- View all users and their current balances
- Search for specific users
- Modify user balances (add or subtract ETH)
- Provide a reason for each balance modification

### Transaction History

The transaction history section allows you to:
- View all balance modifications
- Filter by date range
- Search for specific transactions
- See who made each modification and why

## Security Considerations

- Only users with the `is_admin` flag set to `true` can access the admin panel
- All balance modifications are logged for auditing purposes
- Users can view their own balance history from their dashboard

## Troubleshooting

If you encounter any issues:

1. Make sure the SQL setup completed successfully
2. Verify that the user has been properly set as an admin
3. Check the browser console for any JavaScript errors
4. Ensure your Supabase service role key is properly set in your .env.local file

For further assistance, please contact the development team.
