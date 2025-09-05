#!/usr/bin/env python3
"""
Web server for the WebAssembly black hole simulation.
Serves the REAL C++ simulation compiled to WebAssembly.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class WASMHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS and WASM-specific headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()

    def guess_type(self, path):
        """Ensure proper MIME types for WebAssembly"""
        if path.endswith('.wasm'):
            return 'application/wasm'
        elif path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.html'):
            return 'text/html'
        elif path.endswith('.data'):
            return 'application/octet-stream'
        return super().guess_type(path)

def main():
    # Change to the build_wasm directory
    build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_wasm')
    if not os.path.exists(build_dir):
        print(f"❌ Build directory not found: {build_dir}")
        print(f"🔨 Make sure to build the WebAssembly version first")
        return 1
    
    os.chdir(build_dir)
    
    # Check if deployment files exist
    deployment_files = ['index.html', 'BlackholeWASM.js', 'BlackholeWASM.wasm', 'BlackholeWASM.data', 'blackhole_js.js']
    missing_files = [f for f in deployment_files if not os.path.exists(f)]
    
    if missing_files:
        print(f"❌ Missing deployment files: {missing_files}")
        print(f"🔨 Make sure all deployment files are present")
        return 1
    
    print(f"🕳️  SCHWARZSCHILD BLACK HOLE SIMULATION")
    print(f"=" * 60)
    print(f"✅ Deployment files found:")
    for file in deployment_files:
        if os.path.exists(file):
            size = os.path.getsize(file) / (1024 * 1024)  # MB
            print(f"   📁 {file} ({size:.1f} MB)")
    
    with socketserver.TCPServer(("", PORT), WASMHandler) as httpd:
        print(f"🌐 Server running at: http://localhost:{PORT}")
        print(f"🚀 Interactive simulation: http://localhost:{PORT}/")
        print(f"🔧 Deployment test: http://localhost:{PORT}/VERIFY_DEPLOYMENT.html")
        print(f"⭐ WebAssembly + JavaScript fallback for maximum compatibility")
        print(f"✨ Sagittarius A* with full post-processing pipeline")
        print(f"🎮 Draggable controls, mouse zoom, keyboard shortcuts")
        print(f"⭐ Press Ctrl+C to stop the server")
        print(f"=" * 60)
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}/')
            print(f"🌐 Browser opening automatically...")
            print(f"🚀 Loading Schwarzschild black hole simulation...")
        except:
            print(f"🌐 Please open your browser manually to:")
            print(f"   http://localhost:{PORT}/")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped. The universe thanks you for your visit!")
            sys.exit(0)

if __name__ == "__main__":
    main()
