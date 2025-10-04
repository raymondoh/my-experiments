import type { Config } from "jest";

const sharedProjectConfig = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.jest.json",
      isolatedModules: false,
      diagnostics: false,
    },
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^server-only$": "<rootDir>/__mocks__/emptyModule.js",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  transformIgnorePatterns: ["node_modules/(?!lucide-react|next-auth|@auth/core)"],
} satisfies Config;

const config: Config = {
  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/__tests__/**/*.(test|spec).ts"],
      ...sharedProjectConfig,
    },
    {
      displayName: "jsdom",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/__tests__/**/*.(test|spec).tsx"],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      ...sharedProjectConfig,
    },
  ],
};

export default config;
