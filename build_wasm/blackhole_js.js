// JavaScript Black Hole Simulation
// Bypasses WebAssembly issues while using the same visual effects

console.log('🕳️ Loading JavaScript Black Hole Simulation...');

class BlackHoleSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        this.mouseX = 0;
        this.mouseY = 0;
        this.time = 0;
        this.initialized = false;
        
        // Render targets for post-processing
        this.renderTargets = {};
        this.programs = {};
        
        // Parameters tuned for Sagittarius A* (Milky Way's supermassive black hole)
        this.params = {
            frontView: 0.0,
            topView: 0.0,
            cameraRoll: 0.0,
            gravatationalLensing: 1.0,
            renderBlackHole: 1.0,
            mouseControl: 1.0,
            fovScale: 1.0,
            // Sgr A* accretion disk parameters (more realistic)
            adiskEnabled: 1.0,
            adiskParticle: 1.0,
            adiskHeight: 0.3,        // Thinner disk like real Sgr A*
            adiskLit: 0.4,           // Brighter emission
            adiskDensityV: 3.0,      // More concentrated vertically
            adiskDensityH: 2.5,      // Realistic radial density
            adiskNoiseScale: 1.2,    // More turbulent
            adiskNoiseLOD: 7.0,      // Higher detail
            adiskSpeed: 0.3,         // Slower rotation (more massive)
            bloomStrength: 0.15,     // Stronger bloom for bright jets
            tonemappingEnabled: 1.0,
            gamma: 1.0               // Default gamma set to 1
        };
    }

    async init() {
        console.log('🔧 Initializing JavaScript Black Hole Simulation...');
        
        if (!this.gl) {
            console.error('❌ WebGL2 not available');
            return false;
        }

        try {
            // Load shaders
            const vertexShaderSource = await this.loadShader('shader/simple.vert');
            const fragmentShaderSource = await this.loadShader('shader/blackhole_main.frag');
            
            console.log('✅ Shaders loaded');
            
            // Create shader program
            this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
            if (!this.program) {
                console.error('❌ Failed to create shader program');
                return false;
            }
            
            console.log('✅ Shader program created');
            
            // Create fullscreen quad
            this.createQuad();
            
            // Load textures
            await this.loadTextures();
            
            // Create post-processing pipeline
            await this.createPostProcessingPipeline();
            
            // Set up mouse controls
            this.setupControls();
            
            console.log('✅ JavaScript Black Hole Simulation initialized!');
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            return false;
        }
    }

    async loadShader(path) {
        try {
            // Add cache busting parameter
            const cacheBuster = Date.now();
            const response = await fetch(`${path}?v=${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`❌ Error loading shader ${path}:`, error);
            
            // Fallback shaders if loading fails
            if (path.includes('simple.vert')) {
                return `#version 300 es
precision mediump float;
in vec3 position;
out vec2 uv;
void main() {
    uv = (position.xy + 1.0) * 0.5;
    gl_Position = vec4(position, 1.0);
}`;
            } else {
                return `#version 300 es
precision mediump float;
in vec2 uv;
out vec4 fragColor;
uniform float time;
void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);
    float blackHole = smoothstep(0.1, 0.2, dist);
    vec3 color = mix(vec3(0.0), vec3(1.0, 0.5, 0.0), blackHole);
    fragColor = vec4(color, 1.0);
}`;
            }
        }
    }

    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    }

    createQuad() {
        const positions = new Float32Array([
            -1, -1, 0,
             1, -1, 0,
            -1,  1, 0,
            -1,  1, 0,
             1, -1, 0,
             1,  1, 0,
        ]);
        
        this.quadVAO = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.quadVAO);
        
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);
    }

    async loadTextures() {
        console.log('📦 Loading textures...');
        
        try {
            // Try to load the actual assets first
            await this.loadActualAssets();
        } catch (error) {
            console.log('⚠️ Could not load actual assets, using procedural textures:', error.message);
            this.createImprovedTextures();
        }
    }

    async loadActualAssets() {
        const gl = this.gl;
        
        // Try to load the actual galaxy cubemap
        console.log('📦 Attempting to load actual galaxy cubemap...');
        
        this.galaxyTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.galaxyTexture);
        
        const faces = [
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: 'assets/skybox_nebula_dark/right.png' },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: 'assets/skybox_nebula_dark/left.png' },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: 'assets/skybox_nebula_dark/top.png' },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: 'assets/skybox_nebula_dark/bottom.png' },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: 'assets/skybox_nebula_dark/front.png' },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: 'assets/skybox_nebula_dark/back.png' }
        ];
        
        const loadPromises = faces.map(face => this.loadCubemapFace(face.target, face.url));
        await Promise.all(loadPromises);
        
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        
        // Load actual color map
        console.log('📦 Loading color map texture...');
        this.colorMapTexture = await this.loadTexture2D('assets/color_map.png');
        
        console.log('✅ Successfully loaded actual asset textures!');
    }

    loadCubemapFace(target, url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => {
                const gl = this.gl;
                gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                resolve();
            };
            image.onerror = () => reject(new Error(`Failed to load ${url}`));
            image.src = url;
        });
    }

    loadTexture2D(url) {
        return new Promise((resolve, reject) => {
            const gl = this.gl;
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                resolve(texture);
            };
            image.onerror = () => reject(new Error(`Failed to load ${url}`));
            image.src = url;
        });
    }

    createImprovedTextures() {
        const gl = this.gl;
        
        // Create galaxy cubemap texture
        this.galaxyTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.galaxyTexture);
        
        // Create simple colored faces for the cubemap (starfield-like)
        const faces = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, // right
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X, // left  
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y, // top
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, // bottom
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z, // front
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z  // back
        ];
        
        const size = 256;
        for (let i = 0; i < faces.length; i++) {
            const data = new Uint8Array(size * size * 4);
            
            // Create Milky Way-like galaxy background
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const idx = (y * size + x) * 4;
                    
                    // Normalized coordinates
                    const nx = (x / size - 0.5) * 2;
                    const ny = (y / size - 0.5) * 2;
                    const dist = Math.sqrt(nx * nx + ny * ny);
                    const angle = Math.atan2(ny, nx);
                    
                    // Create spiral galaxy pattern (like Milky Way)
                    const spiralArms = Math.sin(angle * 2 + dist * 8) * 0.5 + 0.5;
                    const galacticPlane = Math.exp(-Math.abs(ny) * 3) * 0.7;
                    
                    // Dense star field in galactic plane
                    const starDensity = Math.random() > (0.998 - galacticPlane * 0.001) ? 255 : 0;
                    
                    // Milky Way colors: warm yellow/orange core, blue-white arms
                    const coreGlow = Math.exp(-dist * 2) * 40;
                    const armGlow = spiralArms * galacticPlane * 20;
                    
                    // Combine all elements
                    data[idx] = Math.max(starDensity, coreGlow * 1.2 + armGlow * 0.8); // Red/Orange
                    data[idx + 1] = Math.max(starDensity, coreGlow * 1.0 + armGlow * 0.9); // Yellow
                    data[idx + 2] = Math.max(starDensity, coreGlow * 0.6 + armGlow * 1.2); // Blue (spiral arms)
                    data[idx + 3] = 255; // Alpha
                }
            }
            
            gl.texImage2D(faces[i], 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
        
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        
        // Color map texture (gradient for accretion disk)
        this.colorMapTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.colorMapTexture);
        const colorData = new Uint8Array(256 * 4);
        for (let i = 0; i < 256; i++) {
            const t = i / 255.0;
            // Create a hot-to-cold color gradient (orange to red to black)
            colorData[i * 4] = Math.min(255, 255 * (1.0 - t * 0.5)); // Red
            colorData[i * 4 + 1] = Math.min(255, 128 * (1.0 - t)); // Green
            colorData[i * 4 + 2] = Math.min(255, 64 * (1.0 - t)); // Blue
            colorData[i * 4 + 3] = 255; // Alpha
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colorData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        console.log('✅ Created galaxy cubemap and color map textures');
    }

    setupControls() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) / rect.width;
            this.mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
        });
    }

    async createPostProcessingPipeline() {
        console.log('🎨 Creating post-processing pipeline...');
        const gl = this.gl;
        
        // Create render targets
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.renderTargets.blackhole = this.createRenderTarget(width, height);
        this.renderTargets.brightness = this.createRenderTarget(width, height);
        this.renderTargets.bloom = this.createRenderTarget(width, height);
        this.renderTargets.final = this.createRenderTarget(width, height);
        
        // Load post-processing shaders
        try {
            const passthroughVert = await this.loadShader('shader/simple.vert');
            
            // Bloom brightness pass
            const brightnessFragSource = await this.loadShader('shader/bloom_brightness_pass.frag');
            this.programs.brightness = this.createProgram(passthroughVert, brightnessFragSource);
            
            // Bloom composite
            const bloomCompositeFragSource = await this.loadShader('shader/bloom_composite.frag');
            this.programs.bloomComposite = this.createProgram(passthroughVert, bloomCompositeFragSource);
            
            // Tone mapping
            const tonemappingFragSource = await this.loadShader('shader/tonemapping.frag');
            this.programs.tonemapping = this.createProgram(passthroughVert, tonemappingFragSource);
            
            // Passthrough
            const passthroughFragSource = await this.loadShader('shader/passthrough.frag');
            this.programs.passthrough = this.createProgram(passthroughVert, passthroughFragSource);
            
            console.log('✅ Post-processing pipeline created');
        } catch (error) {
            console.log('⚠️ Could not load all post-processing shaders:', error.message);
            console.log('🔧 Using simplified rendering pipeline');
        }
    }

    createRenderTarget(width, height) {
        const gl = this.gl;
        
        const framebuffer = gl.createFramebuffer();
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('❌ Framebuffer not complete');
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        return { framebuffer, texture, width, height };
    }

    render() {
        if (!this.initialized) return;
        
        this.time += 0.016; // Approximate 60 FPS
        const gl = this.gl;
        
        if (this.programs.brightness && this.programs.bloomComposite && this.programs.tonemapping) {
            // Full post-processing pipeline (like local version)
            this.renderWithPostProcessing();
        } else {
            // Simple direct rendering fallback
            this.renderDirect();
        }
    }

    renderWithPostProcessing() {
        const gl = this.gl;
        
        // 1. Render main black hole to render target
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTargets.blackhole.framebuffer);
        gl.viewport(0, 0, this.renderTargets.blackhole.width, this.renderTargets.blackhole.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        this.setUniforms();
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // 2. Brightness pass for bloom
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTargets.brightness.framebuffer);
        gl.viewport(0, 0, this.renderTargets.brightness.width, this.renderTargets.brightness.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.programs.brightness);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTargets.blackhole.texture);
        gl.uniform1i(gl.getUniformLocation(this.programs.brightness, 'texture0'), 0);
        gl.uniform2f(gl.getUniformLocation(this.programs.brightness, 'resolution'), 
                     this.canvas.width, this.canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // 3. Bloom composite
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTargets.bloom.framebuffer);
        gl.viewport(0, 0, this.renderTargets.bloom.width, this.renderTargets.bloom.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.programs.bloomComposite);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTargets.blackhole.texture);
        gl.uniform1i(gl.getUniformLocation(this.programs.bloomComposite, 'texture0'), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTargets.brightness.texture);
        gl.uniform1i(gl.getUniformLocation(this.programs.bloomComposite, 'texture1'), 1);
        gl.uniform1f(gl.getUniformLocation(this.programs.bloomComposite, 'bloomStrength'), this.params.bloomStrength);
        gl.uniform1f(gl.getUniformLocation(this.programs.bloomComposite, 'tone'), 1.0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // 4. Tone mapping
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTargets.final.framebuffer);
        gl.viewport(0, 0, this.renderTargets.final.width, this.renderTargets.final.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.programs.tonemapping);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTargets.bloom.texture);
        gl.uniform1i(gl.getUniformLocation(this.programs.tonemapping, 'texture0'), 0);
        gl.uniform1f(gl.getUniformLocation(this.programs.tonemapping, 'tonemappingEnabled'), this.params.tonemappingEnabled);
        gl.uniform1f(gl.getUniformLocation(this.programs.tonemapping, 'gamma'), this.params.gamma);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // 5. Final pass to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.programs.passthrough);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTargets.final.texture);
        gl.uniform1i(gl.getUniformLocation(this.programs.passthrough, 'texture0'), 0);
        gl.uniform2f(gl.getUniformLocation(this.programs.passthrough, 'resolution'), 
                     this.canvas.width, this.canvas.height);
        gl.uniform1f(gl.getUniformLocation(this.programs.passthrough, 'time'), this.time);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    renderDirect() {
        const gl = this.gl;
        
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        this.setUniforms();
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    setUniforms() {
        const gl = this.gl;
        
        // Bind textures first
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.galaxyTexture);
        const galaxyLoc = gl.getUniformLocation(this.program, 'galaxy');
        if (galaxyLoc) {
            gl.uniform1i(galaxyLoc, 0);
        }
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.colorMapTexture);
        const colorMapLoc = gl.getUniformLocation(this.program, 'colorMap');
        if (colorMapLoc) {
            gl.uniform1i(colorMapLoc, 1);
        }
        
        // Set basic uniforms
        const resolutionLoc = gl.getUniformLocation(this.program, 'resolution');
        if (resolutionLoc) {
            gl.uniform2f(resolutionLoc, this.canvas.width, this.canvas.height);
        }
        
        const timeLoc = gl.getUniformLocation(this.program, 'time');
        if (timeLoc) {
            gl.uniform1f(timeLoc, this.time);
        }
        
        const mouseXLoc = gl.getUniformLocation(this.program, 'mouseX');
        if (mouseXLoc) {
            gl.uniform1f(mouseXLoc, this.mouseX * this.canvas.width);
        }
        
        const mouseYLoc = gl.getUniformLocation(this.program, 'mouseY');
        if (mouseYLoc) {
            gl.uniform1f(mouseYLoc, this.mouseY * this.canvas.height);
        }
        
        // Set all the black hole parameters
        for (const [key, value] of Object.entries(this.params)) {
            const loc = gl.getUniformLocation(this.program, key);
            if (loc) {
                gl.uniform1f(loc, value);
            }
        }
    }

    start() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
        console.log('🚀 JavaScript Black Hole Simulation started!');
    }
}

// Export for use
window.BlackHoleSimulation = BlackHoleSimulation;

console.log('✅ JavaScript Black Hole Simulation loaded');
