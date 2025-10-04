// jest.setup.ts
import "@testing-library/jest-dom";
// jest.setup.ts

import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
