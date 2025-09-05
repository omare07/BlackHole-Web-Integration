// Main loop initialization fix for WebAssembly
console.log('🔧 Loading main loop fix...');

// Override emscripten functions to handle the main loop timing issue
if (typeof Module === 'undefined') {
    var Module = {};
}

// Store original functions
Module._originalSetMainLoop = Module.setMainLoop;

// Add main loop management
Module.setMainLoop = function(func, fps, simulateInfiniteLoop) {
    console.log('🔧 setMainLoop called with fps:', fps);
    
    if (typeof func !== 'function') {
        console.error('❌ Main loop function is not a function:', typeof func);
        return;
    }
    
    // Use requestAnimationFrame for smooth animation
    let isRunning = false;
    let lastTime = 0;
    const targetFPS = fps || 60;
    const frameTime = 1000 / targetFPS;
    
    function mainLoop(currentTime) {
        if (!isRunning) return;
        
        if (currentTime - lastTime >= frameTime) {
            try {
                func();
                lastTime = currentTime;
            } catch (e) {
                console.error('❌ Error in main loop:', e);
                isRunning = false;
                return;
            }
        }
        
        requestAnimationFrame(mainLoop);
    }
    
    isRunning = true;
    console.log('✅ Starting main loop with target FPS:', targetFPS);
    requestAnimationFrame(mainLoop);
};

// Add emscripten_set_main_loop compatibility
if (typeof _emscripten_set_main_loop === 'undefined') {
    window._emscripten_set_main_loop = function(func, fps, simulateInfiniteLoop) {
        console.log('🔧 _emscripten_set_main_loop called');
        Module.setMainLoop(func, fps, simulateInfiniteLoop);
    };
}

// Add timing function that was causing the error
if (typeof _emscripten_set_main_loop_timing === 'undefined') {
    window._emscripten_set_main_loop_timing = function(mode, value) {
        console.log('🔧 _emscripten_set_main_loop_timing called (ignored):', mode, value);
        // Just ignore this call since we handle timing differently
    };
}

console.log('✅ Main loop fix loaded');
