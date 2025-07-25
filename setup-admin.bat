@echo off
echo Setting up admin functionality in Supabase...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js is not installed. Please install Node.js and try again.
  pause
  exit /b 1
)

REM Check if .env.local exists
if not exist .env.local (
  echo Error: .env.local file not found. Please create it with your Supabase credentials.
  pause
  exit /b 1
)

REM Check if required environment variables are set
findstr "NEXT_PUBLIC_SUPABASE_URL" .env.local >nul
if %ERRORLEVEL% neq 0 (
  echo Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local
  pause
  exit /b 1
)

findstr "SUPABASE_SERVICE_ROLE_KEY" .env.local >nul
if %ERRORLEVEL% neq 0 (
  echo Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local
  pause
  exit /b 1
)

REM Get Supabase URL and Key from .env.local
for /f "tokens=2 delims==" %%a in ('type .env.local ^| findstr "NEXT_PUBLIC_SUPABASE_URL"') do set SUPABASE_URL=%%a
for /f "tokens=2 delims==" %%a in ('type .env.local ^| findstr "SUPABASE_SERVICE_ROLE_KEY"') do set SUPABASE_KEY=%%a

REM Trim whitespace
set SUPABASE_URL=%SUPABASE_URL: =%
set SUPABASE_KEY=%SUPABASE_KEY: =%

echo Using Supabase URL: %SUPABASE_URL%

REM Install dependencies if needed
echo Checking for required npm packages...
call npm list node-fetch >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Installing node-fetch...
  call npm install node-fetch --save
)

REM Run the direct-admin-setup.js script
echo.
echo Step 1/3: Setting up database tables and columns...
call node src/utils/direct-admin-setup.js
if %ERRORLEVEL% neq 0 (
  echo Warning: direct-admin-setup.js encountered errors. Continuing with direct-sql-fix.js...
)

REM Run the direct-sql-fix.js script
echo.
echo Step 2/3: Running direct SQL fix...
call node src/utils/direct-sql-fix.js
if %ERRORLEVEL% neq 0 (
  echo Warning: direct-sql-fix.js encountered errors. Continuing with makeAdmin.js...
)

REM Make shipfoward@gmail.com an admin
echo.
echo Step 3/3: Making shipfoward@gmail.com an admin...
call node src/utils/makeAdmin.js shipfoward@gmail.com

echo.
echo Setup complete! You should now be able to access the admin dashboard at /admin
echo Note: Special access for shipfoward@gmail.com has been configured in the application code.
echo Even if the database setup encountered errors, you can still access the admin panel with this account.
echo.

pause
