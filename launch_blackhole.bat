@echo off
title Black Hole Simulation Launcher

echo.
echo ===============================================
echo    🕳️  BLACK HOLE SIMULATION LAUNCHER  🕳️
echo ===============================================
echo.
echo 🌌 Starting the real-time black hole simulation...
echo 📊 This is the original C++/OpenGL version with:
echo    ✨ Advanced gravitational lensing effects
echo    🔥 Bloom post-processing
echo    🎨 Tone mapping and gamma correction  
echo    🎮 Interactive ImGui controls
echo    🚀 High-performance 60+ FPS rendering
echo.
echo 💡 Controls:
echo    - Mouse: Look around the black hole
echo    - UI Panel: Adjust simulation parameters
echo    - ESC: Exit simulation
echo.
echo 🚀 Launching in 3 seconds...
timeout /t 3 /nobreak > nul

cd build
set PATH=C:\msys64\mingw64\bin;%PATH%
echo 🌟 Starting Black Hole Simulation...
Blackhole.exe

echo.
echo 🌌 Black Hole Simulation has closed.
echo 📝 Check the console above for any error messages.
echo.
pause
