# PowerShell script to start both API and Client servers
# Run this script with: .\start-servers.ps1

Write-Host "🚀 Starting KLTN Project Servers..." -ForegroundColor Green

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check if ports are already in use
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow

if (Test-Port -Port 3000) {
    Write-Host "⚠️  Port 3000 is already in use. Please stop the existing API server." -ForegroundColor Red
    exit 1
}

if (Test-Port -Port 4200) {
    Write-Host "⚠️  Port 4200 is already in use. Please stop the existing Angular client." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Ports 3000 and 4200 are available" -ForegroundColor Green

# Change to project root
Set-Location "E:\A_ProjectKLTN\Project\main"

# Start API Server
Write-Host "🌐 Starting API Server on port 3000..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    Set-Location "E:\A_ProjectKLTN\Project\main\api"
    npm start
} -Name "APIServer"

Start-Sleep -Seconds 3

# Start Angular Client
Write-Host "🅰️  Starting Angular Client on port 4200..." -ForegroundColor Cyan
$clientJob = Start-Job -ScriptBlock {
    Set-Location "E:\A_ProjectKLTN\Project\main\cli"
    npm start
} -Name "AngularClient"

Start-Sleep -Seconds 5

# Check if servers started successfully
Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test API Server
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "✅ API Server is running successfully on http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API Server failed to start or is not responding" -ForegroundColor Red
    Write-Host "Check API server logs: Get-Job -Name 'APIServer' | Receive-Job" -ForegroundColor Yellow
}

# Test Angular Client
try {
    $clientResponse = Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 10
    if ($clientResponse.StatusCode -eq 200) {
        Write-Host "✅ Angular Client is running successfully on http://localhost:4200" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Angular Client failed to start or is not responding" -ForegroundColor Red
    Write-Host "Check Angular client logs: Get-Job -Name 'AngularClient' | Receive-Job" -ForegroundColor Yellow
}

Write-Host "`n🎉 Server startup complete!" -ForegroundColor Green
Write-Host "📊 To monitor server logs:" -ForegroundColor Cyan
Write-Host "   API Server:     Get-Job -Name 'APIServer' | Receive-Job" -ForegroundColor White
Write-Host "   Angular Client: Get-Job -Name 'AngularClient' | Receive-Job" -ForegroundColor White
Write-Host "`n🛑 To stop servers:" -ForegroundColor Cyan  
Write-Host "   Stop-Job -Name 'APIServer','AngularClient'; Remove-Job -Name 'APIServer','AngularClient'" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:4200 in your browser" -ForegroundColor White
Write-Host "2. Login to your account" -ForegroundColor White
Write-Host "3. Navigate to the Forum/Chat section" -ForegroundColor White
Write-Host "4. Open browser Developer Console (F12)" -ForegroundColor White
Write-Host "5. Run the Socket.IO debug script" -ForegroundColor White

Write-Host "`n📝 Debug Script Location: test-socket-debug.js" -ForegroundColor Yellow
Write-Host "Copy the contents and paste into browser console for Socket.IO testing" -ForegroundColor White
