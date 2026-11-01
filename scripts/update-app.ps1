# One-Click PowerShell Script to Safely Update Nova App via EAS
# Run from project root: .\scripts\update-app.ps1

Write-Host ">>> Starting Nova App EAS Update Process..." -ForegroundColor Cyan

# 1. Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host ">>> Initializing Git repository (required by EAS)..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit for EAS update"
} else {
    git add .
    git commit -m "Prepare for EAS update" -q
}

# 2. Check if node_modules exists, if not install dependencies
if (-not (Test-Path "node_modules/expo-router")) {
    Write-Host ">>> Installing project dependencies cleanly..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}

# 3. Run EAS update
Write-Host ">>> Publishing update to phones via EAS..." -ForegroundColor Green
npx eas update --channel preview --message "Update UI and Popover"

Write-Host ">>> Done! If successful, users will receive the update automatically." -ForegroundColor Cyan
