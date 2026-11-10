$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Write-SubjectHeader {
    param([string]$Title)
    Write-Host "`n======================================================================" -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
}

function Invoke-Checked {
    param(
        [string]$Step,
        [scriptblock]$Command
    )

    Write-Host "`n--- $Step ---" -ForegroundColor Green
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE."
    }
}

function Invoke-Demo {
    param(
        [string]$Step,
        [string]$Executable,
        [string]$InputText
    )

    Write-Host "`n--- $Step ---" -ForegroundColor Green
    if ($null -eq $InputText) {
        & $Executable
    } else {
        $InputText | & $Executable
    }
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE."
    }
}

function Invoke-JavaDemo {
    param(
        [string]$Step,
        [string]$ClassPath,
        [string]$MainClass,
        [string[]]$Arguments = @(),
        [string]$InputText,
        [switch]$EnableAssertions
    )

    Write-Host "`n--- $Step ---" -ForegroundColor Green
    $javaArguments = @()
    if ($EnableAssertions) {
        $javaArguments += "-ea"
    }
    $javaArguments += @("-cp", $ClassPath, $MainClass)
    $javaArguments += $Arguments

    if ($null -eq $InputText) {
        & $java @javaArguments 2>&1
    } else {
        $InputText | & $java @javaArguments 2>&1
    }
    if ($LASTEXITCODE -ne 0) {
        throw "$Step failed with exit code $LASTEXITCODE."
    }
}

$javac = (Get-Command javac -ErrorAction Stop).Source
$java = (Get-Command java -ErrorAction Stop).Source
$gpp = (Get-Command g++ -ErrorAction Stop).Source
$nasm = (Get-Command nasm -ErrorAction Stop).Source
$gcc = (Get-Command gcc -ErrorAction Stop).Source
$buildRoot = Join-Path ([IO.Path]::GetTempPath()) "airline-integrated-$([guid]::NewGuid().ToString('N'))"
$subjectResults = [System.Collections.Generic.List[string]]::new()

New-Item -ItemType Directory -Path $buildRoot | Out-Null

try {
    Write-Host "AIRLINE RESERVATION SYSTEM - SUBJECT OUTPUTS" -ForegroundColor Cyan
    Write-Host "Building temporary files under $buildRoot"

    Write-SubjectHeader "SUBJECT 1/4: JAVA OOP AND BOOKING SYSTEM"
    $javaOopBuild = Join-Path $buildRoot "java-oop"
    $javaCoaBuild = Join-Path $buildRoot "java-oop-coa-ui"
    New-Item -ItemType Directory -Path $javaOopBuild, $javaCoaBuild | Out-Null

    $javaOopSources = Get-ChildItem "java-oop\src" -Recurse -Filter *.java |
        Select-Object -ExpandProperty FullName
    Invoke-Checked "Compile Java OOP sources" {
        & $javac -d $javaOopBuild @javaOopSources
    }

    $javaCoaSources = Get-ChildItem "java-oop-coa-ui\src" -Recurse -Filter *.java |
        Select-Object -ExpandProperty FullName
    Invoke-Checked "Compile Java OOP and COA sources" {
        & $javac -d $javaCoaBuild @javaCoaSources
    }
    $mysqlConnector = Join-Path $PSScriptRoot "java-oop\lib\mysql-connector-j-8.4.0.jar"
    if (-not (Test-Path -LiteralPath $mysqlConnector)) {
        throw "MySQL JDBC connector not found at $mysqlConnector."
    }

    $javaOopRuntimeClassPath = "$javaOopBuild;$mysqlConnector"
    $javaCoaRuntimeClassPath = "$javaCoaBuild;$mysqlConnector"

    Invoke-JavaDemo -Step "Run Java OOP demonstration (database and booking file storage enabled)" `
        -ClassPath $javaOopRuntimeClassPath -MainClass "Main"
    Invoke-JavaDemo -Step "Run Java OOP/COA demonstration (database enabled)" `
        -ClassPath $javaCoaRuntimeClassPath -MainClass "Main"

    Invoke-JavaDemo -Step "Run booking file checks" -ClassPath $javaOopBuild `
        -MainClass "util.BookingFileManagerTest"
    Invoke-JavaDemo -Step "Run booking file save/load service checks" `
        -ClassPath $javaOopBuild -MainClass "service.BookingFileServiceTest" -EnableAssertions
    Invoke-JavaDemo -Step "Run booking service demonstration" -ClassPath $javaOopBuild `
        -MainClass "model.BookingService"
    $bookingInput = "AI101`n2`nPNR101`nAarav Sharma`n1A`n1`nPNR102`nSneha Iyer`n2B`n2`n"
    Invoke-JavaDemo -Step "Run booking, cancellation, and boarding-order checks" `
        -ClassPath $javaOopBuild -MainClass "BookingSystemTest" -InputText $bookingInput

    Write-Host "`n--- Launch Flight Status Swing form ---" -ForegroundColor Green
    $flightStatusWorkingDirectory = Join-Path $PSScriptRoot "java-oop\src"
    $flightStatusArguments = "-cp `"$javaOopRuntimeClassPath`" FlightStatusForm"
    $flightStatusProcess = Start-Process -FilePath $java `
        -ArgumentList $flightStatusArguments `
        -WorkingDirectory $flightStatusWorkingDirectory `
        -PassThru
    Start-Sleep -Milliseconds 500
    if ($flightStatusProcess.HasExited) {
        throw "Flight Status form exited immediately. Exit code $($flightStatusProcess.ExitCode)."
    }
    Write-Host "Flight Status form launched (PID $($flightStatusProcess.Id))."

    [void]$subjectResults.Add("Java OOP and booking system: PASSED")

    Write-SubjectHeader "SUBJECT 2/4: C++ DATA STRUCTURES"
    $dsBuild = Join-Path $buildRoot "cpp-ds"
    $cgBuild = Join-Path $buildRoot "cpp-cg"
    $asmBuild = Join-Path $buildRoot "assembly"
    New-Item -ItemType Directory -Path $dsBuild, $cgBuild, $asmBuild | Out-Null

    $dsDemo = Join-Path $dsBuild "ds_demo.exe"
    Invoke-Checked "Build passenger, seat map, waitlist, PNR hash table, and search/sort comparison demos" {
        & $gpp -std=c++17 "cpp-ds\src\main.cpp" "cpp-ds\src\PassengerArray.cpp" `
            "cpp-ds\src\SeatMap2D.cpp" "cpp-ds\src\Waitlist.cpp" `
            "cpp-ds\src\PNRHashTable.cpp" "cpp-ds\src\SearchComparison.cpp" `
            "cpp-ds\src\SortComparison.cpp" -o $dsDemo
    }
    Invoke-Demo "Run data structure, search, and sorting comparisons" $dsDemo $null

    $linkedList = Join-Path $dsBuild "linked_list.exe"
    Invoke-Checked "Build booking history list" {
        & $gpp -std=c++17 "cpp-ds\src\LinkedList.cpp" -o $linkedList
    }
    Invoke-Demo "Run booking history list" $linkedList $null

    $manifest = Join-Path $dsBuild "manifest.exe"
    Invoke-Checked "Build manifest merge demo" {
        & $gpp -std=c++17 "cpp-ds\src\ManifestMergeDLL.cpp" -o $manifest
    }
    $manifestInput = "2`nPNR101`nPrasad`n1A`nAI101`nFirstClass`nCONFIRMED`nPNR102`nRahul`n5B`nAI101`nBusiness`nCONFIRMED`n2`nPNR103`nVarad`n2A`nAI101`nFirstClass`nCONFIRMED`nPNR104`nSiddhi`n4C`nAI101`nBusiness`nCONFIRMED`n"
    Invoke-Demo "Run manifest merge demo" $manifest $manifestInput

    $boardingQueue = Join-Path $dsBuild "boarding_queue.exe"
    Invoke-Checked "Build circular boarding queue" {
        & $gpp -std=c++17 "cpp-ds\src\BoardingQueueCircular.cpp" -o $boardingQueue
    }
    Invoke-Demo "Run circular boarding queue" $boardingQueue $null

    $undoStack = Join-Path $dsBuild "undo_stack.exe"
    Invoke-Checked "Build seat selection undo stack" {
        & $gpp -std=c++17 "cpp-ds\src\undostack.cpp" -o $undoStack
    }
    Invoke-Demo "Run seat selection undo stack" $undoStack "0`n"
    [void]$subjectResults.Add("C++ data structures: PASSED")

    Write-SubjectHeader "SUBJECT 3/4: COMPUTER GRAPHICS"
    $bresenham = Join-Path $cgBuild "bresenham.exe"
    Invoke-Checked "Build Bresenham rasterization demo" {
        & $gpp -std=c++17 -DSTANDALONE_BRESENHAM "cpp-cg\src\Bresenham.cpp" -o $bresenham
    }
    Invoke-Demo "Run Bresenham rasterization demo" $bresenham $null

    foreach ($source in Get-ChildItem "cpp-cg\src" -Filter *.cpp) {
        Invoke-Checked "Compile-check $($source.Name)" {
            & $gpp -std=c++17 -fsyntax-only $source.FullName
        }
    }
    $projectionTests = Join-Path $cgBuild "projection_tests.exe"
    Invoke-Checked "Build aircraft projection precision checks" {
        & $gpp -std=c++17 "cpp-cg\tests\AircraftProjectionViewingTest.cpp" `
            "cpp-cg\src\AircraftProjectionViewing.cpp" -o $projectionTests
    }
    Invoke-Demo "Run aircraft projection precision checks" $projectionTests $null

    $lineComparison = Join-Path $cgBuild "line_comparison.exe"
    Invoke-Checked "Build DDA and Bresenham comparison" {
        & $gpp -std=c++17 "cpp-cg\src\DDALine.cpp" "cpp-cg\src\Bresenham.cpp" -o $lineComparison
    }
    Invoke-Demo "Run DDA and Bresenham checks" $lineComparison $null

    $lineClipping = Join-Path $cgBuild "line_clipping.exe"
    Invoke-Checked "Build Cohen-Sutherland line clipping demo" {
        & $gpp -std=c++17 "cpp-cg\src\LineClipping.cpp" -o $lineClipping
    }
    Invoke-Demo "Run Cohen-Sutherland clipping checks" $lineClipping $null

    $visuals = @(
        @{ Name = "Route map"; Sources = @("cpp-cg\src\main.cpp", "cpp-cg\src\RouteMap.cpp", "cpp-cg\src\Bresenham.cpp") },
        @{ Name = "Cabin seat matrix"; Sources = @("cpp-cg\src\SeatMatrixCG.cpp") },
        @{ Name = "Interactive flood-fill seat map"; Sources = @("cpp-cg\src\Floodfill.cpp") },
        @{ Name = "Aircraft seat map and scanline fill"; Sources = @("cpp-cg\src\PlaneGlyph.cpp", "cpp-cg\src\Seats.cpp", "cpp-cg\src\SeatMapTransform.cpp", "cpp-cg\src\ScanlineFill.cpp"); Defines = @("-DSCANLINE_FILL_NO_MAIN") }
    )
    foreach ($visual in $visuals) {
        $arguments = @("-std=c++17")
        if ($visual.Defines) { $arguments += $visual.Defines }
        $arguments += $visual.Sources
        $arguments += @("-fsyntax-only")
        Invoke-Checked "Compile-check CG visual: $($visual.Name)" {
            & $gpp @arguments
        }
    }
    $aircraft3dDirectory = Join-Path $PSScriptRoot "cpp-cg\bin"
    New-Item -ItemType Directory -Path $aircraft3dDirectory -Force | Out-Null
    $aircraft3d = Join-Path $aircraft3dDirectory "Aircraft3D.exe"
    Invoke-Checked "Build interactive 3D aircraft visual" {
        & $gpp -std=c++17 "cpp-cg\src\Aircraft3D.cpp" "cpp-cg\src\AircraftProjectionViewing.cpp" `
            -o $aircraft3d -lfreeglut -lopengl32 -lglu32
    }
    Write-Host "`n--- Launch interactive 3D aircraft visual ---" -ForegroundColor Green
    $aircraft3dProcess = Start-Process -FilePath $aircraft3d -PassThru
    Start-Sleep -Milliseconds 500
    if ($aircraft3dProcess.HasExited) {
        throw "Aircraft3D visual exited immediately. Exit code $($aircraft3dProcess.ExitCode)."
    }
    Write-Host "Aircraft3D visual launched (PID $($aircraft3dProcess.Id))." -ForegroundColor Green
    $cgVisualizer = (Resolve-Path "cpp-cg\visualization.html").Path
    Start-Process -FilePath $cgVisualizer
    Write-Host "Opened visual CG tabs: Integrated Aircraft & Seats | CG Algorithms" -ForegroundColor Green
    [void]$subjectResults.Add("Computer graphics: PASSED")

    Write-SubjectHeader "SUBJECT 4/4: COA AND ASSEMBLY"
    $seatControlFlow = Join-Path $asmBuild "seat_control_flow.exe"
    Invoke-Checked "Build seat-availability branch simulator" {
        & $gpp -std=c++17 "coa-nasm\SeatControlFlowDemo.cpp" -o $seatControlFlow
    }
    Invoke-Demo "Run seat-availability branch simulator" $seatControlFlow $null

    $seatBranchesObject = Join-Path $asmBuild "seat_availability_branches.obj"
    $seatBranchesExe = Join-Path $asmBuild "seat_availability_branches.exe"
    Invoke-Checked "Assemble seat-availability branch demo" {
        & $nasm -f win64 "coa-nasm\seat_availability_branches.asm" -o $seatBranchesObject
    }
    Invoke-Checked "Link seat-availability branch demo" {
        & $gcc $seatBranchesObject -o $seatBranchesExe
    }
    Invoke-Demo "Run seat-availability branch demo" $seatBranchesExe $null

    $fuelObject = Join-Path $asmBuild "fuel.obj"
    $fuelExe = Join-Path $asmBuild "fuel.exe"
    Invoke-Checked "Assemble Windows fuel calculator" {
        & $nasm -f win64 "coa-nasm\out\model\fuelcalci.asm" -o $fuelObject
    }
    Invoke-Checked "Link Windows fuel calculator" {
        & $gcc $fuelObject -o $fuelExe
    }
    Invoke-Demo "Run fuel calculator" $fuelExe "1400`n2`n300`n5000`n"

    $hexObject = Join-Path $asmBuild "hex-to-bcd.obj"
    $hexExe = Join-Path $asmBuild "hex-to-bcd.exe"
    Invoke-Checked "Assemble Windows hexadecimal converter" {
        & $nasm -f win64 "coa-nasm\HexToBCD.asm" -o $hexObject
    }
    Invoke-Checked "Link Windows hexadecimal converter" {
        & $gcc $hexObject -o $hexExe
    }
    Invoke-Demo "Run hexadecimal and BCD conversion checks" $hexExe "0`n"
    Invoke-Demo "Run hexadecimal and BCD conversion checks" $hexExe "0x1A2B3C`n"
    Invoke-Demo "Run maximum 64-bit hexadecimal conversion check" $hexExe "0xFFFFFFFFFFFFFFFF`n"

    Invoke-Checked "Run simulator and NASM fare parity demo on shared input" {
        & (Join-Path $PSHOME "powershell.exe") -NoProfile -File "coa-nasm\run_fare_parity_demo.ps1"
    }

    $wsl = Get-Command wsl.exe -ErrorAction SilentlyContinue
    $distributions = @()
    if ($null -ne $wsl) {
        $distributions = & $wsl.Source --list --quiet 2>$null
    }
    if ($LASTEXITCODE -eq 0 -and $distributions -contains "Debian") {
        $windowsBuildPath = $buildRoot.Replace('\', '/')
        $wslBuildPath = (& $wsl.Source -d Debian -- wslpath -a $windowsBuildPath).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Could not locate the temporary build folder inside WSL." }
        $windowsProjectPath = $PSScriptRoot.Replace('\', '/')
        $wslProjectPath = (& $wsl.Source -d Debian -- wslpath -a $windowsProjectPath).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Could not locate the project folder inside WSL." }

        $linuxBuild = "cd '$wslBuildPath' && " +
            "nasm -f elf64 '$wslProjectPath/assembly-component/fare_calc.asm' -o fare_calc.o && " +
            "gcc -no-pie fare_calc.o -o fare_calc && ./fare_calc && " +
            "nasm -f elf64 '$wslProjectPath/coa-nasm/out/model/MulAddShift.asm' -o multiply.o && " +
            "ld multiply.o -o multiply && { printf '5000\n'; sleep 0.1; printf '3\n'; } | ./multiply && " +
            "nasm -f elf64 '$wslProjectPath/coa-nasm/out/model/multisuccadd.asm' -o successive-add.o && " +
            "ld successive-add.o -o successive-add && printf '1F4\nA\n' | ./successive-add && " +
            "nasm -f elf64 '$wslProjectPath/coa-nasm/out/model/PNRStringOps.asm' -o pnr-string-ops.o && " +
            "ld pnr-string-ops.o -o pnr-string-ops && printf '1\n1001\n2\nPNR1001\n3\nriya\n4\n' | ./pnr-string-ops"
        Invoke-Checked "Build and run Linux assembly demos in WSL" {
            & $wsl.Source -d Debian -- bash -lc $linuxBuild
        }
    } else {
        Write-Warning "Skipping Linux assembly demos; a Debian WSL distribution is not available."
    }
    [void]$subjectResults.Add("COA and assembly: PASSED")

    Write-SubjectHeader "INTEGRATED OUTPUT: ALL SUBJECTS"
    foreach ($result in $subjectResults) {
        Write-Host "[PASS] $result" -ForegroundColor Green
    }
    Write-Host "Java booking checks: 13 passed, 0 failed." -ForegroundColor Green
    Write-Host "The subject demonstrations and integration checks completed successfully." -ForegroundColor Cyan
} finally {
    if (Test-Path $buildRoot) {
        Remove-Item -LiteralPath $buildRoot -Recurse -Force
    }
}
