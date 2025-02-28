import { XOR } from "./utils";

type IWasmModuleExports = {
  enc_init(params: number): number;
  enc_encode(cfg: number, num_samples: number): number;
  enc_flush(cfg: number): number;
  enc_free(cfg: number): void;
  enc_get_pcm(cfg: number, num_samples: number): number;
  enc_get_out_buf(cfg: number): number;
  version(): number;
  mime_type(): number;
  malloc(size: number): number;
  free(ptr: number): void;
  memory: WebAssembly.Memory;
  _initialize(): void;
};

type IWasmModulePublicExports = Omit<
  IWasmModuleExports,
  "memory" | "_initialize"
>;

interface IWasmEncoderPublic extends IWasmModulePublicExports {
  module: WebAssembly.Module;
  getInt32Array(ptr: number, length?: number): Int32Array;
  getUint8Array(ptr: number, length?: number): Uint8Array;
  getFloat32Array(ptr: number, length?: number): Float32Array;
  getString(ptr: number): string;
}

interface IWasmEncoderPrivate extends IWasmModuleExports, IWasmEncoderPublic {}

// Function to create an encoder from a pre-compiled WebAssembly module
export default function createModuleFromInstance(
  instance: WebAssembly.Instance,
  module: WebAssembly.Module
): IWasmEncoderPublic {
  const exports = instance.exports as IWasmModuleExports;

  const ret: IWasmEncoderPrivate = {
    ...exports,
    module,
    getInt32Array(ptr, length) {
      return new Int32Array(this.memory.buffer, ptr, length);
    },
    getFloat32Array(ptr, length) {
      return new Float32Array(this.memory.buffer, ptr, length);
    },
    getUint8Array(ptr, length) {
      return new Uint8Array(this.memory.buffer, ptr, length);
    },
    getString(ptr: number) {
      const buf = this.getUint8Array(ptr);
      const nullBytePtr = buf.indexOf(0);
      const stringBuffer = buf.slice(0, nullBytePtr);
      return String.fromCharCode(...stringBuffer);
    },
  };

  ret._initialize();
  return ret;
}
