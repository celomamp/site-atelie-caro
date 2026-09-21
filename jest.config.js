// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  // tsconfig usa jsx "preserve" (Next.js); para testes de componentes o
  // ts-jest precisa transformar JSX para runtime.
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
};
