/**
 * @file main_wasm.cpp
 * @brief Real-time black hole rendering compiled to WebAssembly
 * This is the ACTUAL C++ simulation running in the browser via WASM
 */

#include <assert.h>
#include <map>
#include <stdio.h>
#include <vector>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#define GL_GLEXT_PROTOTYPES
#include <GLES3/gl3.h>
#include <GLFW/glfw3.h>
#else
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#endif

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtx/euler_angles.hpp>
#include <imgui.h>

#include "GLDebugMessageCallback.h"
#include "imgui_impl_glfw.h"
#include "imgui_impl_opengl3.h"
#include "render.h"
#include "shader.h"
#include "texture.h"

// Optimized resolution for web
static const int SCR_WIDTH = 1024;
static const int SCR_HEIGHT = 768;

static float mouseX = 0.0f, mouseY = 0.0f;
static GLFWwindow* g_window = nullptr;

// Global state for the main loop
struct AppState {
    GLuint galaxy = 0;
    GLuint colorMap = 0;
    GLuint uvChecker = 0;
    GLuint texBlackhole = 0;
    GLuint texBrightness = 0;
    GLuint texDownsampled[8] = {0};
    GLuint texUpsampled[8] = {0};
    GLuint texBloomFinal = 0;
    GLuint texTonemapped = 0;
    GLuint quadVAO = 0;
    bool initialized = false;
};

static AppState g_state;

// Simplified PostProcessPass for WASM
class PostProcessPass {
private:
    GLuint program;

public:
    PostProcessPass(const std::string &fragShader) {
        this->program = createShaderProgram("shader/simple.vert", fragShader);
        if (this->program) {
            glUseProgram(this->program);
            glUniform1i(glGetUniformLocation(program, "texture0"), 0);
            glUseProgram(0);
        }
    }

    void render(GLuint inputColorTexture, GLuint destFramebuffer = 0) {
        if (!this->program) return;
        
        glBindFramebuffer(GL_FRAMEBUFFER, destFramebuffer);
        glDisable(GL_DEPTH_TEST);
        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        glUseProgram(this->program);

        glUniform2f(glGetUniformLocation(this->program, "resolution"),
                    (float)SCR_WIDTH, (float)SCR_HEIGHT);

        glUniform1f(glGetUniformLocation(this->program, "time"),
                    (float)glfwGetTime());

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, inputColorTexture);

        glDrawArrays(GL_TRIANGLES, 0, 6);
        glUseProgram(0);
    }
};

#define IMGUI_TOGGLE(NAME, DEFAULT)                                            \
  static bool NAME = DEFAULT;                                                  \
  ImGui::Checkbox(#NAME, &NAME);                                               \
  rtti.floatUniforms[#NAME] = NAME ? 1.0f : 0.0f;

#define IMGUI_SLIDER(NAME, DEFAULT, MIN, MAX)                                  \
  static float NAME = DEFAULT;                                                 \
  ImGui::SliderFloat(#NAME, &NAME, MIN, MAX);                                  \
  rtti.floatUniforms[#NAME] = NAME;

static void glfwErrorCallback(int error, const char *description) {
    printf("GLFW Error %d: %s\n", error, description);
}

void mouseCallback(GLFWwindow *window, double x, double y) {
    mouseX = (float)x;
    mouseY = (float)y;
}

// Main loop function for Emscripten
void main_loop() {
    static PostProcessPass* passthrough = nullptr;
    
    if (!g_state.initialized) {
        printf("🔧 Initializing black hole simulation...\n");
        
        // Check OpenGL state
        GLenum error = glGetError();
        if (error != GL_NO_ERROR) {
            printf("❌ OpenGL error before initialization: %d\n", error);
        }
        
        // Initialize textures with error handling
        printf("📦 Loading assets...\n");
        
        // Test basic texture creation first
        printf("🧪 Testing basic texture creation...\n");
        GLuint testTex;
        glGenTextures(1, &testTex);
        glBindTexture(GL_TEXTURE_2D, testTex);
        
        // Create a simple 1x1 texture to test format compatibility
        unsigned char testData[4] = {255, 0, 0, 255}; // Red pixel
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, 1, 1, 0, GL_RGBA, GL_UNSIGNED_BYTE, testData);
        GLenum error = glGetError();
        if (error != GL_NO_ERROR) {
            printf("❌ Basic texture test failed with error: %d\n", error);
        } else {
            printf("✅ Basic texture format test passed\n");
        }
        glDeleteTextures(1, &testTex);
        
        // Try to load actual assets
        printf("📦 Loading galaxy cubemap...\n");
        g_state.galaxy = loadCubemap("assets/skybox_nebula_dark");
        if (g_state.galaxy == 0) {
            printf("❌ Failed to load galaxy cubemap\n");
            return; // Don't continue if assets fail
        } else {
            printf("✅ Galaxy cubemap loaded: %d\n", g_state.galaxy);
        }
        
        printf("📦 Loading color map...\n");
        g_state.colorMap = loadTexture2D("assets/color_map.png");
        if (g_state.colorMap == 0) {
            printf("❌ Failed to load color map\n");
            return;
        } else {
            printf("✅ Color map loaded: %d\n", g_state.colorMap);
        }
        
        printf("📦 Loading UV checker...\n");
        g_state.uvChecker = loadTexture2D("assets/uv_checker.png");
        if (g_state.uvChecker == 0) {
            printf("❌ Failed to load UV checker\n");
            return;
        } else {
            printf("✅ UV checker loaded: %d\n", g_state.uvChecker);
        }
        
        printf("🖼️ Creating render textures...\n");
        g_state.texBlackhole = createColorTexture(SCR_WIDTH, SCR_HEIGHT);
        g_state.texBrightness = createColorTexture(SCR_WIDTH, SCR_HEIGHT);
        g_state.texBloomFinal = createColorTexture(SCR_WIDTH, SCR_HEIGHT);
        g_state.texTonemapped = createColorTexture(SCR_WIDTH, SCR_HEIGHT);
        
        if (g_state.texBlackhole == 0 || g_state.texBrightness == 0 || 
            g_state.texBloomFinal == 0 || g_state.texTonemapped == 0) {
            printf("❌ Failed to create main render textures\n");
            return;
        }
        printf("✅ Main render textures created\n");
        
        // Initialize bloom textures (reduced for web performance)
        printf("✨ Creating bloom textures...\n");
        for (int i = 0; i < 6; i++) {
            g_state.texDownsampled[i] = createColorTexture(SCR_WIDTH >> (i + 1), SCR_HEIGHT >> (i + 1));
            g_state.texUpsampled[i] = createColorTexture(SCR_WIDTH >> i, SCR_HEIGHT >> i);
            if (g_state.texDownsampled[i] == 0 || g_state.texUpsampled[i] == 0) {
                printf("❌ Failed to create bloom texture level %d\n", i);
            }
        }
        printf("✅ Bloom textures created\n");
        
        printf("📐 Creating quad VAO...\n");
        g_state.quadVAO = createQuadVAO();
        if (g_state.quadVAO == 0) {
            printf("❌ Failed to create quad VAO\n");
            return;
        }
        glBindVertexArray(g_state.quadVAO);
        printf("✅ Quad VAO created: %d\n", g_state.quadVAO);
        
        printf("🎨 Creating post-process pass...\n");
        passthrough = new PostProcessPass("shader/passthrough.frag");
        if (!passthrough) {
            printf("❌ Failed to create passthrough shader\n");
            return;
        }
        printf("✅ Post-process pass created\n");
        
        // Final OpenGL error check
        error = glGetError();
        if (error != GL_NO_ERROR) {
            printf("❌ OpenGL error after initialization: %d\n", error);
        } else {
            printf("✅ OpenGL state clean after initialization\n");
        }
        
        g_state.initialized = true;
        printf("🚀 Black hole simulation fully initialized and ready!\n");
    }

    glfwPollEvents();

    // ImGui frame
    ImGui_ImplOpenGL3_NewFrame();
    ImGui_ImplGlfw_NewFrame();
    ImGui::NewFrame();

    int width, height;
    glfwGetFramebufferSize(g_window, &width, &height);
    glViewport(0, 0, width, height);

    // Main black hole rendering - THE REAL SIMULATION
    {
        RenderToTextureInfo rtti;
        rtti.fragShader = "shader/blackhole_main.frag";
        rtti.cubemapUniforms["galaxy"] = g_state.galaxy;
        rtti.textureUniforms["colorMap"] = g_state.colorMap;
        rtti.floatUniforms["mouseX"] = mouseX;
        rtti.floatUniforms["mouseY"] = mouseY;
        rtti.targetTexture = g_state.texBlackhole;
        rtti.width = SCR_WIDTH;
        rtti.height = SCR_HEIGHT;

        // Real ImGui controls from original simulation
        IMGUI_TOGGLE(gravatationalLensing, true);
        IMGUI_TOGGLE(renderBlackHole, true);
        IMGUI_TOGGLE(mouseControl, true);
        IMGUI_SLIDER(cameraRoll, 0.0f, -180.0f, 180.0f);
        IMGUI_TOGGLE(frontView, false);
        IMGUI_TOGGLE(topView, false);
        IMGUI_TOGGLE(adiskEnabled, true);
        IMGUI_TOGGLE(adiskParticle, true);
        IMGUI_SLIDER(adiskDensityV, 2.0f, 0.0f, 10.0f);
        IMGUI_SLIDER(adiskDensityH, 4.0f, 0.0f, 10.0f);
        IMGUI_SLIDER(adiskHeight, 0.55f, 0.0f, 1.0f);
        IMGUI_SLIDER(adiskLit, 0.25f, 0.0f, 4.0f);
        IMGUI_SLIDER(adiskNoiseLOD, 5.0f, 1.0f, 12.0f);
        IMGUI_SLIDER(adiskNoiseScale, 0.8f, 0.0f, 10.0f);
        IMGUI_SLIDER(adiskSpeed, 0.5f, 0.0f, 1.0f);

        renderToTexture(rtti);
    }

    // Bloom brightness pass - REAL BLOOM EFFECTS
    {
        RenderToTextureInfo rtti;
        rtti.fragShader = "shader/bloom_brightness_pass.frag";
        rtti.textureUniforms["texture0"] = g_state.texBlackhole;
        rtti.targetTexture = g_state.texBrightness;
        rtti.width = SCR_WIDTH;
        rtti.height = SCR_HEIGHT;
        renderToTexture(rtti);
    }

    // Bloom downsampling - REAL POST-PROCESSING
    static int bloomIterations = 4; // Optimized for web
    ImGui::SliderInt("bloomIterations", &bloomIterations, 1, 6);
    
    for (int level = 0; level < bloomIterations; level++) {
        RenderToTextureInfo rtti;
        rtti.fragShader = "shader/bloom_downsample.frag";
        rtti.textureUniforms["texture0"] = level == 0 ? g_state.texBrightness : g_state.texDownsampled[level - 1];
        rtti.targetTexture = g_state.texDownsampled[level];
        rtti.width = SCR_WIDTH >> (level + 1);
        rtti.height = SCR_HEIGHT >> (level + 1);
        renderToTexture(rtti);
    }

    // Bloom upsampling
    for (int level = bloomIterations - 1; level >= 0; level--) {
        RenderToTextureInfo rtti;
        rtti.fragShader = "shader/bloom_upsample.frag";
        rtti.textureUniforms["texture0"] = level == bloomIterations - 1 ? g_state.texDownsampled[level] : g_state.texUpsampled[level + 1];
        rtti.textureUniforms["texture1"] = level == 0 ? g_state.texBrightness : g_state.texDownsampled[level - 1];
        rtti.targetTexture = g_state.texUpsampled[level];
        rtti.width = SCR_WIDTH >> level;
        rtti.height = SCR_HEIGHT >> level;
        renderToTexture(rtti);
    }

    // Bloom composite
    {
        RenderToTextureInfo rtti;
        rtti.fragShader = "shader/bloom_composite.frag";
        rtti.textureUniforms["texture0"] = g_state.texBlackhole;
        rtti.textureUniforms["texture1"] = g_state.texUpsampled[0];
        rtti.targetTexture = g_state.texBloomFinal;
        rtti.width = SCR_WIDTH;
        rtti.height = SCR_HEIGHT;

        IMGUI_SLIDER(bloomStrength, 0.1f, 0.0f, 1.0f);

        renderToTexture(rtti);
    }

    // Tone mapping - REAL TONE MAPPING
    {
        RenderToTextureInfo rtti;
        rtti.fragShader = "shader/tonemapping.frag";
        rtti.textureUniforms["texture0"] = g_state.texBloomFinal;
        rtti.targetTexture = g_state.texTonemapped;
        rtti.width = SCR_WIDTH;
        rtti.height = SCR_HEIGHT;

        IMGUI_TOGGLE(tonemappingEnabled, true);
        IMGUI_SLIDER(gamma, 2.5f, 1.0f, 4.0f);

        renderToTexture(rtti);
    }

    // Final render to screen
    if (passthrough) {
        passthrough->render(g_state.texTonemapped);
    } else {
        // Fallback: render something basic to test if rendering works at all
        printf("⚠️ No passthrough shader - rendering fallback test\n");
        glClearColor(0.2f, 0.0f, 0.5f, 1.0f);  // Purple to test if anything renders
        glClear(GL_COLOR_BUFFER_BIT);
    }

    ImGui::Render();
    ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

    glfwSwapBuffers(g_window);
}

int main(int, char **) {
    printf("🕳️ Starting WebAssembly Black Hole Simulation...\n");
    
    // Setup GLFW
    glfwSetErrorCallback(glfwErrorCallback);
    if (!glfwInit()) {
        printf("❌ Failed to initialize GLFW\n");
        return 1;
    }

    // OpenGL ES 3.0 for WebGL2
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 0);
    glfwWindowHint(GLFW_CLIENT_API, GLFW_OPENGL_ES_API);

    g_window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "Black Hole Simulation - WebAssembly", NULL, NULL);
    if (g_window == NULL) {
        printf("❌ Failed to create GLFW window\n");
        return 1;
    }

    glfwMakeContextCurrent(g_window);
    glfwSwapInterval(1); // VSync
    glfwSetCursorPosCallback(g_window, mouseCallback);

    // Setup Dear ImGui
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO &io = ImGui::GetIO();
    (void)io;

    ImGui::StyleColorsDark();

    // Platform/Renderer bindings
    ImGui_ImplGlfw_InitForOpenGL(g_window, true);
    ImGui_ImplOpenGL3_Init("#version 300 es");

    printf("✅ WebAssembly environment initialized\n");
    printf("🌌 Starting real-time black hole physics simulation...\n");

#ifdef __EMSCRIPTEN__
    // Use Emscripten main loop - this runs the REAL simulation in browser
    emscripten_set_main_loop(main_loop, 0, 1);
#else
    // Traditional main loop for native compilation
    while (!glfwWindowShouldClose(g_window)) {
        main_loop();
    }
#endif

    // Cleanup
    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();

    glfwDestroyWindow(g_window);
    glfwTerminate();

    return 0;
}
