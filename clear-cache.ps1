# Complete Cache Clearing Script for Next.js Development
# Run this script when experiencing cache-related issues

Write-Host "🧹 Starting comprehensive cache clearing..." -ForegroundColor Green

# 1. Stop any running Next.js processes
Write-Host "1. Stopping Next.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Clear Next.js build cache
Write-Host "2. Clearing Next.js build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "   ✅ .next directory removed" -ForegroundColor Green
}

# 3. Clear node_modules cache
Write-Host "3. Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "   ✅ node_modules/.cache removed" -ForegroundColor Green
}

# 4. Clear npm cache
Write-Host "4. Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "   ✅ npm cache cleared" -ForegroundColor Green

# 5. Clear TypeScript cache
Write-Host "5. Clearing TypeScript cache..." -ForegroundColor Yellow
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "   ✅ TypeScript build info cleared" -ForegroundColor Green
}

# 6. Clear ESLint cache
Write-Host "6. Clearing ESLint cache..." -ForegroundColor Yellow
if (Test-Path ".eslintcache") {
    Remove-Item -Force ".eslintcache"
    Write-Host "   ✅ ESLint cache cleared" -ForegroundColor Green
}

# 7. Clear Tailwind CSS cache
Write-Host "7. Clearing Tailwind CSS cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache/tailwindcss") {
    Remove-Item -Recurse -Force "node_modules/.cache/tailwindcss"
    Write-Host "   ✅ Tailwind CSS cache cleared" -ForegroundColor Green
}

Write-Host "🎉 Cache clearing complete!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   2. Open browser in incognito/private mode" -ForegroundColor White
Write-Host "   3. Run: npm run dev" -ForegroundColor White
Write-Host "   4. Test Fast Refresh by making a small change" -ForegroundColor White
