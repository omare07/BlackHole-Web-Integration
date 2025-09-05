# Interactive Schwarzschild Black Hole Simulation

A real-time, interactive black hole simulation featuring advanced gravitational lensing effects, built with C++/OpenGL and compiled to WebAssembly for web deployment.

## Features

- **Real-time gravitational lensing simulation** using ray-tracing techniques
- **Interactive controls** for all simulation parameters
- **High-quality post-processing pipeline** with bloom effects and tone mapping
- **Sagittarius A* configuration** with Milky Way background
- **WebGL2-based rendering** for cross-platform compatibility
- **Responsive design** with draggable control panel

## Live Demo

Open `build_wasm/index.html` in a web browser to run the simulation. For best performance, use a modern browser with WebGL2 support.

## Technical Implementation

### Core Technologies
- **C++/OpenGL** - Native simulation engine
- **Emscripten** - WebAssembly compilation toolchain
- **WebGL2** - Web-based graphics rendering
- **GLSL ES 3.0** - Shader programming
- **JavaScript** - Web interface and fallback implementation

### Rendering Pipeline
1. **Main Render Pass** - Ray-traced gravitational lensing
2. **Brightness Pass** - Extract bright regions for bloom
3. **Bloom Composite** - Multi-pass bloom effect
4. **Tone Mapping** - HDR to LDR conversion with gamma correction
5. **Final Pass** - Composite to screen

### Physics Model
The simulation implements the Schwarzschild metric for black hole spacetime, calculating light ray trajectories through curved spacetime to produce accurate gravitational lensing effects.

## Controls

- **Mouse**: Rotate camera around black hole
- **Mouse Wheel**: Zoom in/out
- **H Key**: Toggle control panel
- **F Key**: Toggle fullscreen mode

### Adjustable Parameters
- **Black Hole**: Gravitational lensing intensity
- **Accretion Disk**: Enable/disable, height, inner/outer radius, rotation speed
- **Post-Processing**: Bloom strength, gamma correction
- **Camera**: Zoom level, pitch, yaw, roll

## Project Structure

```
├── src/                    # C++ source code
│   ├── main.cpp           # Native application entry point
│   ├── main_wasm.cpp      # WebAssembly entry point
│   ├── render.cpp         # Core rendering engine
│   ├── shader.cpp         # Shader management
│   └── texture.cpp        # Texture loading and management
├── shader/                # GLSL shader files
├── assets/                # Textures and skybox images
├── build_wasm/            # WebAssembly build output
│   ├── index.html         # Main web interface
│   ├── blackhole_js.js    # JavaScript fallback implementation
│   └── assets/            # Web-optimized assets
└── libs/                  # Third-party libraries (GLM, ImGui, STB)
```

## Building from Source

### Prerequisites
- CMake 3.10+
- Emscripten SDK
- Modern C++ compiler (C++17 support)

### WebAssembly Build
```bash
# Install Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Build WebAssembly version
mkdir build_wasm && cd build_wasm
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release
emmake make
```

### Native Build
```bash
# Build native version
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make
```

## Deployment

The WebAssembly version requires a web server due to CORS restrictions. Use the included Python server:

```bash
cd build_wasm
python ../serve_wasm.py
```

Then open `http://localhost:8000` in your browser.

## Performance Optimization

- Uses WebGL2 for hardware-accelerated rendering
- Implements efficient ray-tracing algorithms
- Multi-pass rendering pipeline for visual quality
- Optimized shader code for real-time performance
- Asset preloading for smooth experience

## Browser Compatibility

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

Requires WebGL2 support for optimal performance.

## License

This project is based on the original black hole simulation. Please refer to the original repository for licensing information.

## Acknowledgments

This implementation builds upon existing black hole visualization techniques and incorporates modern web technologies for accessibility. Special thanks to the original developers and the computer graphics community for their contributions to real-time ray-tracing and gravitational lensing simulation.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests to improve the simulation.

## Technical Notes

### WebGL2 Compatibility
The simulation automatically handles differences between desktop OpenGL and WebGL2, including:
- SRGB texture format conversion
- GLSL version compatibility (OpenGL 3.3 Core to GLSL ES 3.0)
- Precision qualifier requirements
- Texture binding and uniform management

### Fallback Implementation
If WebAssembly fails to load, the simulation automatically falls back to a pure JavaScript/WebGL2 implementation that maintains visual fidelity and all interactive features.