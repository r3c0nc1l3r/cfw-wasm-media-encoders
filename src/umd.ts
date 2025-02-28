import {
  createEncoder,
  WasmMediaEncoder,
  initializeWasmModules,
  mp3WasmUrl,
  oggWasmUrl,
} from "./index";
import { name, version } from "../package.json";
import getVersion from "./version";

// In UMD, we can't use dynamic instantiation, so we need to provide URLs
// for the user to fetch and compile the modules themselves
const mp3WasmCdnUrl = `https://unpkg.com/${name}@${version}/wasm/mp3.wasm`;
const oggWasmCdnUrl = `https://unpkg.com/${name}@${version}/wasm/ogg.wasm`;

const UMDEncoder: any = WasmMediaEncoder;
UMDEncoder.createEncoder = createEncoder;
UMDEncoder.initializeWasmModules = initializeWasmModules;
UMDEncoder.createMp3Encoder = createMp3Encoder;
UMDEncoder.createOggEncoder = createOggEncoder;
UMDEncoder.jsLibraryVersion = getVersion;
UMDEncoder.mp3WasmUrl = mp3WasmCdnUrl;
UMDEncoder.oggWasmUrl = oggWasmCdnUrl;

// Helper function to create MP3 encoder after initialization
function createMp3Encoder() {
  if (!UMDEncoder._initialized) {
    throw new Error(
      "WebAssembly modules not initialized. Call initializeWasmModules first."
    );
  }
  return createEncoder(
    "audio/mpeg",
    UMDEncoder._mp3Instance,
    UMDEncoder._mp3Module
  );
}

// Helper function to create OGG encoder after initialization
function createOggEncoder() {
  if (!UMDEncoder._initialized) {
    throw new Error(
      "WebAssembly modules not initialized. Call initializeWasmModules first."
    );
  }
  return createEncoder(
    "audio/ogg",
    UMDEncoder._oggInstance,
    UMDEncoder._oggModule
  );
}

// Flag to track initialization
UMDEncoder._initialized = false;
UMDEncoder._mp3Module = null;
UMDEncoder._mp3Instance = null;
UMDEncoder._oggModule = null;
UMDEncoder._oggInstance = null;

// Override initializeWasmModules to set the flag
const originalInitialize = UMDEncoder.initializeWasmModules;
UMDEncoder.initializeWasmModules = function (
  mp3Module: WebAssembly.Module,
  oggModule: WebAssembly.Module
) {
  UMDEncoder._mp3Module = mp3Module;
  UMDEncoder._mp3Instance = new WebAssembly.Instance(mp3Module, {
    wasi_snapshot_preview1: {
      proc_exit: (code: number) => {
        throw new Error(`fatal error exit(${code})`);
      },
    },
    env: { emscripten_notify_memory_growth: () => {} },
  });

  UMDEncoder._oggModule = oggModule;
  UMDEncoder._oggInstance = new WebAssembly.Instance(oggModule, {
    wasi_snapshot_preview1: {
      proc_exit: (code: number) => {
        throw new Error(`fatal error exit(${code})`);
      },
    },
    env: { emscripten_notify_memory_growth: () => {} },
  });

  UMDEncoder._initialized = true;
};

export default UMDEncoder;
