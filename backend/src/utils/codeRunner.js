/**
 * Code Runner Utility
 * Provides a sandbox for executing user-submitted code safely
 */
const { VM } = require("vm2");
const { promisify } = require("util");
const { performance } = require("perf_hooks");

// Configuration for execution environments
const VM_TIMEOUT_MS = 5000; // 5 seconds max execution time
const VM_MEMORY_LIMIT_MB = 64; // 64MB memory limit

/**
 * Run JavaScript code in a secure sandbox
 * @param {string} code - The code to execute
 * @param {Object} inputs - Input parameters for the code
 * @param {Object} options - Additional execution options
 * @returns {Object} Execution results
 */
const runJavaScript = async (code, inputs = {}, options = {}) => {
  const startTime = performance.now();
  let result = {
    success: false,
    output: null,
    error: null,
    console: [],
    executionTime: 0,
  };

  // Create a sandbox with limited capabilities
  const vm = new VM({
    timeout: options.timeout || VM_TIMEOUT_MS,
    sandbox: {
      ...inputs,
      console: {
        log: (...args) => {
          result.console.push({
            type: "log",
            message: args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : String(arg)
              )
              .join(" "),
          });
        },
        error: (...args) => {
          result.console.push({
            type: "error",
            message: args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : String(arg)
              )
              .join(" "),
          });
        },
        info: (...args) => {
          result.console.push({
            type: "info",
            message: args
              .map((arg) =>
                typeof arg === "object" ? JSON.stringify(arg) : String(arg)
              )
              .join(" "),
          });
        },
      },
    },
    wrapper: "none",
    eval: false,
    wasm: false,
  });

  try {
    // Wrap code in an async function for better error handling
    const wrappedCode = `
      (async function() {
        try {
          ${code}
          return { success: true, result: (typeof solution === 'function' ? solution : null) };
        } catch (error) {
          return { success: false, error: { name: error.name, message: error.message, stack: error.stack } };
        }
      })()
    `;

    const vmResult = await vm.run(wrappedCode);

    if (vmResult.success) {
      result.success = true;
      result.output = vmResult.result;
    } else {
      result.success = false;
      result.error = vmResult.error;
    }
  } catch (error) {
    result.success = false;
    result.error = {
      name: error.name || "Error",
      message: error.message || "An unknown error occurred",
      stack: error.stack,
    };
  } finally {
    result.executionTime = performance.now() - startTime;
  }

  return result;
};

/**
 * Test a solution against test cases
 * @param {Function} solution - The solution function to test
 * @param {Array} testCases - Array of test cases
 * @returns {Object} Test results
 */
const testSolution = (solution, testCases) => {
  if (typeof solution !== "function") {
    return {
      success: false,
      error: "Solution is not a function",
      results: [],
    };
  }

  const results = testCases.map((testCase) => {
    try {
      const startTime = performance.now();
      const actualOutput = solution(...testCase.input);
      const executionTime = performance.now() - startTime;

      const passed =
        JSON.stringify(actualOutput) === JSON.stringify(testCase.expected);

      return {
        input: testCase.input,
        expected: testCase.expected,
        actual: actualOutput,
        passed,
        executionTime,
      };
    } catch (error) {
      return {
        input: testCase.input,
        expected: testCase.expected,
        actual: null,
        passed: false,
        error: {
          name: error.name,
          message: error.message,
        },
      };
    }
  });

  const allPassed = results.every((result) => result.passed);

  return {
    success: allPassed,
    results,
  };
};

/**
 * Run code in the appropriate environment based on language
 * @param {string} code - The code to execute
 * @param {string} language - Programming language
 * @param {Object} inputs - Input parameters
 * @param {Object} options - Additional options
 * @returns {Object} Execution results
 */
const runCode = async (
  code,
  language = "javascript",
  inputs = {},
  options = {}
) => {
  switch (language.toLowerCase()) {
    case "javascript":
    case "js":
      return await runJavaScript(code, inputs, options);
    // Additional languages can be added here
    default:
      return {
        success: false,
        error: `Unsupported language: ${language}`,
        console: [],
      };
  }
};

module.exports = {
  runCode,
  testSolution,
};
