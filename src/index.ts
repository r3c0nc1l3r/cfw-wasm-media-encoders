import { createEncoder, WasmMediaEncoder, jsLibraryVersion } from "./encoder";
// Import WASM modules as URLs, not as modules to be instantiated
import mp3WasmUrl from "./wasm/build/mp3.wasm";
import oggWasmUrl from "./wasm/build/ogg.wasm";

// Define the imports object needed for WebAssembly instantiation
const wasmImports = {
  wasi_snapshot_preview1: {
    proc_exit: (code: number) => {
      throw new Error(`fatal error exit(${code})`);
    },
  },
  env: { emscripten_notify_memory_growth: () => {} },
};

// Pre-compiled WebAssembly modules
let mp3WasmModule: WebAssembly.Module | null = null;
let mp3WasmInstance: WebAssembly.Instance | null = null;
let oggWasmModule: WebAssembly.Module | null = null;
let oggWasmInstance: WebAssembly.Instance | null = null;

/**
 * Initialize the WebAssembly modules
 * This must be called before using any encoder functions
 * @param mp3Module Pre-compiled MP3 WebAssembly module
 * @param oggModule Pre-compiled OGG WebAssembly module
 */
function initializeWasmModules(
  mp3Module: WebAssembly.Module,
  oggModule: WebAssembly.Module
) {
  mp3WasmModule = mp3Module;
  mp3WasmInstance = new WebAssembly.Instance(mp3Module, wasmImports);

  oggWasmModule = oggModule;
  oggWasmInstance = new WebAssembly.Instance(oggModule, wasmImports);
}

/**
 * Create an MP3 encoder using the pre-compiled WebAssembly module
 * Make sure to call initializeWasmModules before using this function
 */
function createMp3Encoder() {
  if (!mp3WasmModule || !mp3WasmInstance) {
    throw new Error(
      "MP3 WASM module not initialized. Call initializeWasmModules first."
    );
  }
  return createEncoder("audio/mpeg", mp3WasmInstance, mp3WasmModule);
}

/**
 * Create an OGG encoder using the pre-compiled WebAssembly module
 * Make sure to call initializeWasmModules before using this function
 */
function createOggEncoder() {
  if (!oggWasmModule || !oggWasmInstance) {
    throw new Error(
      "OGG WASM module not initialized. Call initializeWasmModules first."
    );
  }
  return createEncoder("audio/ogg", oggWasmInstance, oggWasmModule);
}

export {
  createEncoder,
  createMp3Encoder,
  createOggEncoder,
  initializeWasmModules,
  WasmMediaEncoder,
  jsLibraryVersion,
  // Export URLs for external loading
  mp3WasmUrl,
  oggWasmUrl,
};
