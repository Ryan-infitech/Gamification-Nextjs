import { VM, VMScript } from "vm2";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import Docker from "dockerode";
import {
  ProgrammingLanguage,
  CodeExecutionRequest,
  CodeExecutionResponse,
  SubmissionStatus,
  LANGUAGE_CONFIGS,
  DEFAULT_SECURITY_RULES,
  SecurityRules,
} from "../types/challenge";
import logger from "../config/logger";
import { env } from "../config/env";

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Docker instance for container-based execution
const docker = new Docker();

// Base directory for temporary files
const TMP_DIR = env.CODE_RUNNER_TMP_DIR || os.tmpdir();

/**
 * Static code analysis to check for security violations
 * @param code - Code to analyze
 * @param language - Programming language
 * @param securityRules - Security rules to apply
 * @returns Object with violation flag and reason
 */
export function analyzeCode(
  code: string,
  language: ProgrammingLanguage,
  securityRules: SecurityRules = DEFAULT_SECURITY_RULES[language]
): { hasViolation: boolean; reason?: string } {
  // Get security rules for the language
  const { bannedFunctions, bannedModules, bannedKeywords } = securityRules;

  // Simple regex-based security check
  // This is a basic implementation. In production, you'd want to use AST parsing for more accurate detection.
  for (const func of bannedFunctions) {
    const regex = new RegExp(`\\b${func}\\b\\s*\\(`, "g");
    if (regex.test(code)) {
      return { hasViolation: true, reason: `Banned function used: ${func}` };
    }
  }

  for (const module of bannedModules) {
    let regex;

    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        regex = new RegExp(
          `(require\\s*\\(\\s*['"]${module}['"]\\s*\\)|import\\s+.*\\s+from\\s+['"]${module}['"])`,
          "g"
        );
        break;
      case ProgrammingLanguage.PYTHON:
        regex = new RegExp(
          `(import\\s+${module}|from\\s+${module}\\s+import)`,
          "g"
        );
        break;
      case ProgrammingLanguage.JAVA:
        regex = new RegExp(`import\\s+${module}`, "g");
        break;
      case ProgrammingLanguage.CPP:
        regex = new RegExp(`#include\\s+${module}`, "g");
        break;
      default:
        regex = new RegExp(`${module}`, "g");
    }

    if (regex.test(code)) {
      return { hasViolation: true, reason: `Banned module used: ${module}` };
    }
  }

  for (const keyword of bannedKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    if (regex.test(code)) {
      return { hasViolation: true, reason: `Banned keyword used: ${keyword}` };
    }
  }

  return { hasViolation: false };
}

/**
 * Run code in VM2 sandbox (for JavaScript and TypeScript)
 * @param code - Code to execute
 * @param input - Input data
 * @param timeLimit - Time limit in milliseconds
 * @returns Execution result
 */
async function runInVM(
  code: string,
  input: string = "",
  timeLimit: number = 5000
): Promise<CodeExecutionResponse> {
  const startTime = process.hrtime();
  const vm = new VM({
    timeout: timeLimit,
    sandbox: {
      input,
      console: {
        log: (...args: any[]) => output.push(args.join(" ")),
        error: (...args: any[]) => errors.push(args.join(" ")),
        info: (...args: any[]) => output.push(args.join(" ")),
        warn: (...args: any[]) => output.push(args.join(" ")),
      },
      Buffer,
      process: {
        hrtime: process.hrtime,
      },
      setTimeout: (callback: Function, time: number) => {
        if (time > 1000) {
          throw new Error("setTimeout with values over 1000ms is not allowed");
        }
        return setTimeout(callback, time);
      },
      clearTimeout,
    },
    require: {
      external: false,
      builtin: [
        "assert",
        "buffer",
        "crypto",
        "path",
        "util",
        "stream",
        "url",
        "querystring",
      ],
      root: "./",
      mock: {
        fs: {
          readFileSync: () => {
            throw new Error("File system access is not allowed");
          },
          writeFileSync: () => {
            throw new Error("File system access is not allowed");
          },
        },
      },
    },
  });

  const output: string[] = [];
  const errors: string[] = [];

  try {
    // Wrap code in a function to handle input and prepare for execution
    const wrappedCode = `
      const __inputLines = input.trim().split('\\n');
      let __inputIndex = 0;
      
      function readline() {
        return __inputLines[__inputIndex++] || '';
      }
      
      ${code}
    `;

    const script = new VMScript(wrappedCode);
    vm.run(script);

    const diff = process.hrtime(startTime);
    const executionTime = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds

    return {
      output: output.join("\n"),
      error: errors.length > 0 ? errors.join("\n") : undefined,
      executionTime,
      status:
        errors.length > 0
          ? SubmissionStatus.RUNTIME_ERROR
          : SubmissionStatus.COMPLETED,
    };
  } catch (error) {
    const diff = process.hrtime(startTime);
    const executionTime = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds

    // Check if the error is a timeout
    if (error.message.includes("Script execution timed out")) {
      return {
        error: "Execution timed out",
        executionTime,
        status: SubmissionStatus.TIMEOUT,
      };
    }

    return {
      error: error.message,
      executionTime,
      status: SubmissionStatus.RUNTIME_ERROR,
    };
  }
}

/**
 * Run code in Docker container (for non-JS languages)
 * @param code - Code to execute
 * @param language - Programming language
 * @param input - Input data
 * @param timeLimit - Time limit in milliseconds
 * @param memoryLimit - Memory limit in MB
 * @returns Execution result
 */
async function runInDocker(
  code: string,
  language: ProgrammingLanguage,
  input: string = "",
  timeLimit: number = 5000,
  memoryLimit: number = 50 // MB
): Promise<CodeExecutionResponse> {
  const langConfig = LANGUAGE_CONFIGS[language];
  const executionId = uuidv4();

  // Create temp directory for this execution
  const executionDir = path.join(TMP_DIR, executionId);
  await fs.promises.mkdir(executionDir, { recursive: true });

  // File paths
  const codeFileName = `main.${langConfig.fileExtension}`;
  const codePath = path.join(executionDir, codeFileName);
  const inputPath = path.join(executionDir, "input.txt");
  const outputPath = path.join(executionDir, "output.txt");
  const errorPath = path.join(executionDir, "error.txt");

  try {
    // Write code and input to files
    await fs.promises.writeFile(codePath, code);
    await fs.promises.writeFile(inputPath, input);

    // Select appropriate Docker image based on language
    let dockerImage = "";
    switch (language) {
      case ProgrammingLanguage.PYTHON:
        dockerImage = "python:3.9-slim";
        break;
      case ProgrammingLanguage.JAVA:
        dockerImage = "openjdk:11-slim";
        break;
      case ProgrammingLanguage.CPP:
        dockerImage = "gcc:11";
        break;
      default:
        throw new Error(
          `Docker execution not supported for language: ${language}`
        );
    }

    // Start time measurement
    const startTime = process.hrtime();

    // Create container
    const container = await docker.createContainer({
      Image: dockerImage,
      Cmd: ["/bin/sh", "-c", buildExecutionCommand(language, codeFileName)],
      HostConfig: {
        Binds: [`${executionDir}:/app`],
        Memory: memoryLimit * 1024 * 1024, // Convert MB to bytes
        MemorySwap: memoryLimit * 1024 * 1024, // Disable swap
        NetworkMode: "none", // Disable network
        PidsLimit: 50, // Limit number of processes
        ReadonlyRootfs: true, // Read-only root filesystem
      },
      WorkingDir: "/app",
    });

    // Start container with timeout
    await container.start();

    // Create timeout promise
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Execution timed out"));
      }, timeLimit);
    });

    // Wait for container to finish or timeout
    try {
      await Promise.race([container.wait(), timeoutPromise]);
    } catch (error) {
      if (error.message === "Execution timed out") {
        await container.stop();

        const diff = process.hrtime(startTime);
        const executionTime = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds

        return {
          error: "Execution timed out",
          executionTime,
          status: SubmissionStatus.TIMEOUT,
        };
      }
      throw error;
    }

    // Calculate execution time
    const diff = process.hrtime(startTime);
    const executionTime = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds

    // Read output and error files
    let output = "";
    let error = "";

    try {
      output = await fs.promises.readFile(outputPath, "utf8");
    } catch (err) {
      // Output file may not exist if there was an error
    }

    try {
      error = await fs.promises.readFile(errorPath, "utf8");
    } catch (err) {
      // Error file may not exist if there was no error
    }

    // Determine status based on error
    const status = error
      ? SubmissionStatus.RUNTIME_ERROR
      : SubmissionStatus.COMPLETED;

    return {
      output: output.trim(),
      error: error.trim() || undefined,
      executionTime,
      status,
    };
  } catch (error) {
    logger.error("Docker execution error:", { error, language, executionId });

    return {
      error: `System error: ${error.message}`,
      status: SubmissionStatus.SYSTEM_ERROR,
    };
  } finally {
    // Cleanup: remove temp files and container
    try {
      await fs.promises.rm(executionDir, { recursive: true, force: true });

      const containers = await docker.listContainers({
        all: true,
        filters: { id: [executionId] },
      });

      for (const containerInfo of containers) {
        const container = docker.getContainer(containerInfo.Id);
        await container.remove({ force: true });
      }
    } catch (error) {
      logger.error("Cleanup error:", { error, executionId });
    }
  }
}

/**
 * Build execution command based on language
 * @param language - Programming language
 * @param fileName - Source code file name
 * @returns Execution command string
 */
function buildExecutionCommand(
  language: ProgrammingLanguage,
  fileName: string
): string {
  switch (language) {
    case ProgrammingLanguage.PYTHON:
      return `python3 ${fileName} < input.txt > output.txt 2> error.txt`;

    case ProgrammingLanguage.JAVA:
      return `javac ${fileName} && java Main < input.txt > output.txt 2> error.txt`;

    case ProgrammingLanguage.CPP:
      return `g++ -std=c++14 ${fileName} -o program && ./program < input.txt > output.txt 2> error.txt`;

    default:
      throw new Error(`Unsupported language for Docker execution: ${language}`);
  }
}

/**
 * Main function to execute code
 * @param request - Code execution request
 * @returns Code execution response
 */
export async function executeCode(
  request: CodeExecutionRequest
): Promise<CodeExecutionResponse> {
  const {
    code,
    language,
    input = "",
    timeLimit = 5000,
    memoryLimit = 50,
  } = request;

  // Check code for security violations
  const securityAnalysis = analyzeCode(code, language);
  if (securityAnalysis.hasViolation) {
    return {
      error: `Security violation: ${securityAnalysis.reason}`,
      status: SubmissionStatus.FAILED,
    };
  }

  // Execute code based on language
  try {
    const langConfig = LANGUAGE_CONFIGS[language];

    if (
      langConfig.sandbox === "vm" &&
      (language === ProgrammingLanguage.JAVASCRIPT ||
        language === ProgrammingLanguage.TYPESCRIPT)
    ) {
      return await runInVM(code, input, timeLimit);
    } else if (langConfig.sandbox === "docker") {
      return await runInDocker(code, language, input, timeLimit, memoryLimit);
    } else {
      throw new Error(`Unsupported sandbox type for language: ${language}`);
    }
  } catch (error) {
    logger.error("Code execution error:", { error, language });

    return {
      error: `System error: ${error.message}`,
      status: SubmissionStatus.SYSTEM_ERROR,
    };
  }
}
