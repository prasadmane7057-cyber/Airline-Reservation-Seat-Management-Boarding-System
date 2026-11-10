$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path ([IO.Path]::GetTempPath()) "airline-fare-parity-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $buildDir | Out-Null

try {
    $gpp = (Get-Command g++ -ErrorAction Stop).Source
    $nasm = (Get-Command nasm -ErrorAction Stop).Source
    $gcc = (Get-Command gcc -ErrorAction Stop).Source
    $simulator = Join-Path $buildDir "fare_simulator.exe"
    $fareObject = Join-Path $buildDir "farecalculator.obj"
    $assemblyProgram = Join-Path $buildDir "farecalculator.exe"

    & $gpp -std=c++17 (Join-Path $projectRoot "assembly-component\fare_calc_sim.cpp") -o $simulator
    if ($LASTEXITCODE -ne 0) { throw "Could not build the 64-bit fare simulator." }

    & $nasm -f win64 (Join-Path $PSScriptRoot "out\model\farecalculator.asm") -o $fareObject
    if ($LASTEXITCODE -ne 0) { throw "Could not assemble farecalculator.asm." }
    & $gcc $fareObject -o $assemblyProgram
    if ($LASTEXITCODE -ne 0) { throw "Could not link the NASM fare calculator." }

    $fareInput = "5000`n3`n900`n500`n180`n120`n"
    $results = @()
    foreach ($demo in @(
        @{ Name = "64-bit register simulator"; Executable = $simulator },
        @{ Name = "NASM fare calculator"; Executable = $assemblyProgram }
    )) {
        Write-Host "`n--- $($demo.Name) ---" -ForegroundColor Cyan
        $output = $fareInput | & $demo.Executable 2>&1
        $exitCode = $LASTEXITCODE
        $text = $output -join "`n"
        Write-Host $text
        if ($exitCode -ne 0) { throw "$($demo.Name) failed with exit code $exitCode." }

        $fare = [regex]::Match($text, '(?im)Total Fare \(Rs\):\s*(\d+)')
        $seats = [regex]::Match($text, '(?im)Seats Available:\s*(\d+)')
        if (-not $fare.Success -or -not $seats.Success) {
            throw "$($demo.Name) did not report both the total fare and seat availability."
        }
        $results += [pscustomobject]@{ Fare = $fare.Groups[1].Value; Seats = $seats.Groups[1].Value }
    }

    if ($results[0].Fare -ne $results[1].Fare -or $results[0].Seats -ne $results[1].Seats) {
        throw "Simulator and assembly disagree: fare/seats $($results[0].Fare)/$($results[0].Seats) vs. $($results[1].Fare)/$($results[1].Seats)."
    }
    if ($results[0].Fare -ne "15400" -or $results[0].Seats -ne "60") {
        throw "Unexpected shared-input result: expected fare 15400 and 60 seats available."
    }
    Write-Host "`n[PASS] Both programs agree: Rs. $($results[0].Fare), $($results[0].Seats) seats available." -ForegroundColor Green
} finally {
    if (Test-Path -LiteralPath $buildDir) {
        Remove-Item -LiteralPath $buildDir -Recurse -Force
    }
}
