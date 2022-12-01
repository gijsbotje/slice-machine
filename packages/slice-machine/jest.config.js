module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  globals: {
    appRoot: "..",
  },
  moduleNameMapper: {
    "^lib(.*)$": "<rootDir>/lib$1",
    "^src(.*)$": "<rootDir>/src$1",
    "^tests(.*)$": "<rootDir>/tests$1",
    "^components(.*)$": "<rootDir>/components$1",
  },
  transform: {
    "\\.(js|ts|jsx|tsx)$": [
      "babel-jest",
      { configFile: "./babel.next.config.js" },
    ],
  },
  transformIgnorePatterns: [],
  testPathIgnorePatterns: ["node_modules", "cypress"],
};
