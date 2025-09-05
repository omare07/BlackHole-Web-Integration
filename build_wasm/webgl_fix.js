// WebGL compatibility patch for black hole simulation
console.log('🔧 Loading WebGL compatibility patch...');

// Patch WebGL context to fix texture format issues
(function() {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    
    HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
        const context = originalGetContext.call(this, contextType, contextAttributes);
        
        if (contextType === 'webgl2' && context) {
            console.log('🔧 Patching WebGL2 context for compatibility...');
            
            // Store original texImage2D
            const originalTexImage2D = context.texImage2D;
            
            // Patch texImage2D to fix format issues
            context.texImage2D = function(target, level, internalformat, width, height, border, format, type, pixels) {
                // Fix SRGB format issues for WebGL2
                if (internalformat === context.SRGB) {
                    console.log('🔧 Converting SRGB to RGB8 for WebGL2 compatibility');
                    internalformat = context.RGB8;
                }
                if (internalformat === context.SRGB_ALPHA) {
                    console.log('🔧 Converting SRGB_ALPHA to RGBA8 for WebGL2 compatibility');
                    internalformat = context.RGBA8;
                }
                
                // Handle different argument patterns
                if (arguments.length === 6) {
                    // texImage2D(target, level, internalformat, format, type, source)
                    return originalTexImage2D.call(this, target, level, internalformat, width, height, border);
                } else if (arguments.length === 9) {
                    // texImage2D(target, level, internalformat, width, height, border, format, type, pixels)
                    return originalTexImage2D.call(this, target, level, internalformat, width, height, border, format, type, pixels);
                } else {
                    return originalTexImage2D.apply(this, arguments);
                }
            };
            
            console.log('✅ WebGL2 context patched successfully');
        }
        
        return context;
    };
})();

console.log('✅ WebGL compatibility patch loaded');
