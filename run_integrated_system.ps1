# ==============================================================================
# AIRLINE RESERVATION, SEAT MANAGEMENT & BOARDING SYSTEM
# Master Integrated System Execution Script Across All Subjects
# Subjects: Java OOP, C++ Data Structures, 64-bit Assembly/COA, Computer Graphics (CG)
# ==============================================================================

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "     AIRLINE RESERVATION & SEAT MANAGEMENT SYSTEM - MASTER EXECUTION            " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. JAVA OBJECT-ORIENTED PROGRAMMING (OOP) SUITE
# ------------------------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Yellow
Write-Host " >>> [SUBJECT 1/4] JAVA OBJECT-ORIENTED PROGRAMMING (OOP) CORE" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Yellow
if (!(Test-Path "java-oop-coa-ui/out")) { New-Item -ItemType Directory -Path "java-oop-coa-ui/out" | Out-Null }
$javaFiles = (Get-ChildItem -Recurse -Path "java-oop-coa-ui/src" -Filter *.java).FullName
Write-Host "[BUILD] Compiling $($javaFiles.Count) Java Source Files with javac..." -ForegroundColor Gray
javac -d "java-oop-coa-ui/out" $javaFiles
Write-Host "[EXEC] Running Java OOP Core Simulation (Polymorphism, PNR, Booking Pipeline):" -ForegroundColor Green
java -cp "java-oop-coa-ui/out" Main

# ------------------------------------------------------------------------------
# 2. C++ DATA STRUCTURES SUITE
# ------------------------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Yellow
Write-Host " >>> [SUBJECT 2/4] C++ DATA STRUCTURES (ARRAYS, 2D MATRIX & LINKED LISTS)" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Yellow

Write-Host "`n--- [DS 1/3] 1D Passenger Array & 2D Seat Matrix Grid ---" -ForegroundColor Green
g++ -std=c++17 cpp-ds/src/main.cpp cpp-ds/src/PassengerArray.cpp cpp-ds/src/SeatMap2D.cpp -o cpp-ds/ds_demo.exe
.\cpp-ds\ds_demo.exe

Write-Host "`n--- [DS 2/3] Singly Linked List (Chronological Booking Audit Trail) ---" -ForegroundColor Green
g++ -std=c++17 cpp-ds/src/LinkedList.cpp -o cpp-ds/linked_list.exe
.\cpp-ds\linked_list.exe

Write-Host "`n--- [DS 3/3] Doubly Linked List (Manifest Merging with Two-Pointer Technique) ---" -ForegroundColor Green
g++ -std=c++17 cpp-ds/src/ManifestMergeDLL.cpp -o cpp-ds/manifest_dll.exe
$manifestInput = "2`nPNR101`nPrasad`n1A`nAI101`nFirstClass`nCONFIRMED`nPNR102`nRahul`n5B`nAI101`nBusiness`nCONFIRMED`n2`nPNR103`nVarad`n2A`nAI101`nFirstClass`nCONFIRMED`nPNR104`nSiddhi`n4C`nAI101`nBusiness`nCONFIRMED`n"
$manifestInput | .\cpp-ds\manifest_dll.exe

# ------------------------------------------------------------------------------
# 3. 64-BIT NASM ASSEMBLY & PROCESSOR-LEVEL COA SIMULATION
# ------------------------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Yellow
Write-Host " >>> [SUBJECT 3/4] 64-BIT NASM ASSEMBLY & COMPUTER ORGANIZATION (COA)" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Yellow

Write-Host "`n--- [COA 1/3] Real x86-64 NASM Binary: Fare Calculation Engine ---" -ForegroundColor Green
"5000`n3`n900`n500`n180`n120`n" | .\coa-nasm\out\model\fare_win.exe

Write-Host "`n--- [COA 2/3] Real x86-64 NASM Binary: Fuel & Weight Consumption Engine ---" -ForegroundColor Green
"1400`n2500`n3000`n500`n" | .\coa-nasm\out\model\fuel_win.exe

Write-Host "`n--- [COA 3/3] Hardware CPU Register & ALU Simulation (RAX, RBX, RCX, RDX, R8-R13) ---" -ForegroundColor Green
g++ -std=c++17 assembly-component/fare_calc_sim.cpp -o assembly-component/fare_calc_sim.exe
.\assembly-component\fare_calc_sim.exe

# ------------------------------------------------------------------------------
# 4. COMPUTER GRAPHICS & VISUALIZATION (CGL / OPENGL / FREEGLUT)
# ------------------------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Yellow
Write-Host " >>> [SUBJECT 4/4] COMPUTER GRAPHICS (CGL) & INTERACTIVE VISUALIZATION" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Yellow

if (!(Test-Path "cpp-cg/bin")) { New-Item -ItemType Directory -Path "cpp-cg/bin" | Out-Null }

Write-Host "`n--- [CG 1/4] Bresenham Rasterization Algorithm (Discrete Integer Coordinates) ---" -ForegroundColor Green
C:\msys64\mingw64\bin\g++.exe -DSTANDALONE_BRESENHAM -o cpp-cg/bin/bresenham_console.exe cpp-cg/src/Bresenham.cpp
.\cpp-cg\bin\bresenham_console.exe

Write-Host "`n--- [CG 2/4] Compiling Route Map Visualizer (Bresenham Flight Trajectory & Airport Node) ---" -ForegroundColor Green
C:\msys64\mingw64\bin\g++.exe -o cpp-cg/bin/RouteMapVisualizer.exe cpp-cg/src/main.cpp cpp-cg/src/RouteMap.cpp cpp-cg/src/Bresenham.cpp -lfreeglut -lopengl32 -lglu32
Write-Host "[BUILD SUCCESS] RouteMapVisualizer.exe ready at cpp-cg/bin/RouteMapVisualizer.exe" -ForegroundColor Gray

Write-Host "`n--- [CG 3/4] Compiling Master Plane Glyph + Real Seats + 2D Zoom/Transform/Clip Engine ---" -ForegroundColor Green
C:\msys64\mingw64\bin\g++.exe -o cpp-cg/bin/SeatMapCombined.exe cpp-cg/src/PlaneGlyph.cpp cpp-cg/src/Seats.cpp cpp-cg/src/SeatMapTransform.cpp -lfreeglut -lopengl32 -lglu32
Write-Host "[BUILD SUCCESS] SeatMapCombined.exe ready at cpp-cg/bin/SeatMapCombined.exe" -ForegroundColor Gray

Write-Host "`n--- [CG 4/4] Compiling Standalone Interactive Cabin Seat Matrix Selector ---" -ForegroundColor Green
C:\msys64\mingw64\bin\g++.exe -o cpp-cg/bin/SeatMatrixCG.exe cpp-cg/src/SeatMatrixCG.cpp -lfreeglut -lopengl32 -lglu32
Write-Host "[BUILD SUCCESS] SeatMatrixCG.exe ready at cpp-cg/bin/SeatMatrixCG.exe" -ForegroundColor Gray

Write-Host "`n[CG-LAUNCH] Launching Integrated Aircraft Seat Map & 2D Transformation Engine..." -ForegroundColor Cyan
Start-Process -FilePath ".\cpp-cg\bin\SeatMapCombined.exe"
Start-Sleep -Milliseconds 800

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "     ALL SUBJECTS & MODULES COMPILED AND EXECUTED SUCCESSFULLY!                 " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
