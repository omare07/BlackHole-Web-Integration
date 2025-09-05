# Simple Deployment Guide

## Quick Deploy (30 seconds)

1. **Download** the `build_wasm` folder from this repository
2. **Copy** the entire `build_wasm` folder to your web server
3. **Access** via browser - that's it!

## What You Get

A complete, self-contained black hole simulation that works immediately without any setup, compilation, or dependencies.

## Deployment Package Contents

```
build_wasm/                    # <- Deploy this entire folder
├── index.html                 # Main page (open this in browser)
├── BlackholeWASM.wasm         # WebAssembly binary
├── BlackholeWASM.js           # WebAssembly JavaScript glue
├── BlackholeWASM.data         # Embedded assets (18.7MB)
├── blackhole_js.js            # JavaScript fallback
├── webgl_fix.js               # WebGL compatibility
├── main_loop_fix.js           # Emscripten fixes
├── assets/                    # Textures and skybox images
└── shader/                    # GLSL shaders
```

## Deployment Options

### Option 1: Static Web Hosting
- Upload `build_wasm` folder to any web server
- Access via `https://yourdomain.com/build_wasm/`

### Option 2: GitHub Pages
- Push `build_wasm` contents to a GitHub Pages repository
- Enable Pages in repository settings

### Option 3: Local Testing
- Open `build_wasm/index.html` directly in browser
- Or run a local server: `python -m http.server 8000`

### Option 4: CDN/Cloud Storage
- Upload to AWS S3, Google Cloud Storage, etc.
- Enable static website hosting

## Browser Requirements

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

Requires WebGL2 support for optimal performance.

## No Dependencies Required

- ✅ No Node.js installation
- ✅ No npm packages
- ✅ No build process
- ✅ No compilation
- ✅ No server-side code
- ✅ No database setup
- ✅ Works entirely client-side

## Features Included

- Real-time gravitational lensing simulation
- Interactive draggable control panel
- Mouse controls (rotate, zoom)
- Keyboard shortcuts (H: controls, F: fullscreen)
- Sagittarius A* black hole configuration
- Milky Way background
- Post-processing effects (bloom, tone mapping)
- Automatic fallback if WebAssembly fails

## File Size

Total deployment package: ~20MB
- Most of the size is high-quality texture assets
- Compresses well for web delivery
- Loads progressively

## Troubleshooting

If the simulation doesn't load:
1. Check browser console for errors
2. Ensure files are served over HTTP/HTTPS (not file://)
3. Verify WebGL2 support in browser
4. Check that all files copied correctly

The simulation includes automatic fallbacks and error handling for maximum compatibility.
