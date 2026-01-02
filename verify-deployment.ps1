# AI Health Analyzer Deployment Verification Script
# PowerShell script to verify the deployment is working correctly

param(
    [string]$Environment = "development",
    [string]$ApiUrl = "http://localhost:5000/api",
    [string]$ClientUrl = "http://localhost:3000"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor $Blue
}

function Test-ApiHealth {
    Write-Info "Testing API health..."
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10
        
        if ($response.status -eq "OK") {
            Write-Status "API health check passed"
            Write-Info "API Message: $($response.message)"
            Write-Info "API Uptime: $($response.uptime) seconds"
            return $true
        } else {
            Write-Error "API health check failed - unexpected status"
            return $false
        }
    }
    catch {
        Write-Error "API health check failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ClientAccess {
    Write-Info "Testing client accessibility..."
    
    try {
        $response = Invoke-WebRequest -Uri $ClientUrl -Method Get -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Status "Client is accessible"
            return $true
        } else {
            Write-Error "Client returned status code: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Error "Client access failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ApiEndpoints {
    Write-Info "Testing API endpoints..."
    
    $endpoints = @(
        @{ Path = "/health"; Method = "GET"; ExpectedStatus = 200 }
    )
    
    $passed = 0
    $total = $endpoints.Count
    
    foreach ($endpoint in $endpoints) {
        try {
            $uri = "$ApiUrl$($endpoint.Path)"
            $response = Invoke-WebRequest -Uri $uri -Method $endpoint.Method -TimeoutSec 10 -UseBasicParsing
            
            if ($response.StatusCode -eq $endpoint.ExpectedStatus) {
                Write-Status "✓ $($endpoint.Method) $($endpoint.Path)"
                $passed++
            } else {
                Write-Error "✗ $($endpoint.Method) $($endpoint.Path) - Status: $($response.StatusCode)"
            }
        }
        catch {
            Write-Error "✗ $($endpoint.Method) $($endpoint.Path) - Error: $($_.Exception.Message)"
        }
    }
    
    Write-Info "API Endpoints: $passed/$total passed"
    return ($passed -eq $total)
}

function Test-DatabaseConnection {
    Write-Info "Testing database connection (via API)..."
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10
        
        if ($response.database) {
            Write-Status "Database connection verified"
            Write-Info "Database collections: $($response.database.collections)"
            return $true
        } else {
            Write-Warning "Database status not available in health response"
            return $false
        }
    }
    catch {
        Write-Error "Database connection test failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-Performance {
    Write-Info "Testing performance metrics..."
    
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        Write-Info "API Response Time: $([math]::Round($responseTime, 2))ms"
        
        if ($response.performance) {
            Write-Status "Performance metrics available"
            Write-Info "Total Requests: $($response.performance.totalRequests)"
            Write-Info "Average Response Time: $([math]::Round($response.performance.averageResponseTime, 2))ms"
            Write-Info "Error Rate: $([math]::Round($response.performance.errorRate, 2))%"
        }
        
        if ($responseTime -lt 1000) {
            Write-Status "API response time is good"
            return $true
        } else {
            Write-Warning "API response time is slow: $([math]::Round($responseTime, 2))ms"
            return $false
        }
    }
    catch {
        Write-Error "Performance test failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-Security {
    Write-Info "Testing security headers..."
    
    try {
        $response = Invoke-WebRequest -Uri $ClientUrl -Method Get -TimeoutSec 10 -UseBasicParsing
        
        $securityHeaders = @(
            "X-Frame-Options",
            "X-Content-Type-Options",
            "X-XSS-Protection"
        )
        
        $passed = 0
        foreach ($header in $securityHeaders) {
            if ($response.Headers[$header]) {
                Write-Status "✓ Security header present: $header"
                $passed++
            } else {
                Write-Warning "✗ Security header missing: $header"
            }
        }
        
        Write-Info "Security Headers: $passed/$($securityHeaders.Count) present"
        return ($passed -gt 0)
    }
    catch {
        Write-Error "Security test failed: $($_.Exception.Message)"
        return $false
    }
}

function Show-SystemInfo {
    Write-Info "System Information:"
    Write-Host "  OS: $([System.Environment]::OSVersion.VersionString)" -ForegroundColor White
    Write-Host "  PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor White
    Write-Host "  .NET: $([System.Environment]::Version)" -ForegroundColor White
    Write-Host "  Environment: $Environment" -ForegroundColor White
    Write-Host "  API URL: $ApiUrl" -ForegroundColor White
    Write-Host "  Client URL: $ClientUrl" -ForegroundColor White
}

function Main {
    Write-Host "🚀 AI Health Analyzer Deployment Verification" -ForegroundColor $Blue
    Write-Host "=============================================" -ForegroundColor $Blue
    Write-Host ""
    
    Show-SystemInfo
    Write-Host ""
    
    $tests = @(
        @{ Name = "API Health"; Function = { Test-ApiHealth } },
        @{ Name = "Client Access"; Function = { Test-ClientAccess } },
        @{ Name = "API Endpoints"; Function = { Test-ApiEndpoints } },
        @{ Name = "Database Connection"; Function = { Test-DatabaseConnection } },
        @{ Name = "Performance"; Function = { Test-Performance } },
        @{ Name = "Security"; Function = { Test-Security } }
    )
    
    $passed = 0
    $failed = 0
    
    foreach ($test in $tests) {
        Write-Host ""
        Write-Info "Running test: $($test.Name)"
        
        try {
            $result = & $test.Function
            if ($result) {
                $passed++
                Write-Status "$($test.Name) - PASSED"
            } else {
                $failed++
                Write-Error "$($test.Name) - FAILED"
            }
        }
        catch {
            $failed++
            Write-Error "$($test.Name) - FAILED: $($_.Exception.Message)"
        }
        
        Start-Sleep -Seconds 1
    }
    
    Write-Host ""
    Write-Host "📊 Verification Results:" -ForegroundColor $Blue
    Write-Host "========================" -ForegroundColor $Blue
    Write-Status "Passed: $passed"
    Write-Error "Failed: $failed"
    
    $successRate = if (($passed + $failed) -gt 0) { ($passed / ($passed + $failed)) * 100 } else { 0 }
    Write-Host "📈 Success Rate: $([math]::Round($successRate, 1))%" -ForegroundColor White
    
    if ($failed -eq 0) {
        Write-Host ""
        Write-Host "🎉 All verification tests passed!" -ForegroundColor $Green
        Write-Host "The AI Health Analyzer deployment is working correctly." -ForegroundColor $Green
        exit 0
    } else {
        Write-Host ""
        Write-Host "⚠️ Some verification tests failed." -ForegroundColor $Yellow
        Write-Host "Please check the logs above and fix any issues." -ForegroundColor $Yellow
        exit 1
    }
}

# Run the main function
Main