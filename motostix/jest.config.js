const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const configPath = path.join(__dirname, "jest.config.ts");
const source = fs.readFileSync(configPath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
  },
  fileName: configPath,
});

const m = new Module(configPath, module);
m._compile(outputText, configPath);

module.exports = m.exports.default ?? m.exports;
