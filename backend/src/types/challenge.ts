/**
 * Types and interfaces for code challenge functionality
 */

import { TablesRow } from "./supabase";

/**
 * Supported programming languages
 */
export enum ProgrammingLanguage {
  JAVASCRIPT = "javascript",
  TYPESCRIPT = "typescript",
  PYTHON = "python",
  JAVA = "java",
  CPP = "cpp",
}

/**
 * Challenge difficulty levels
 */
export enum ChallengeDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

/**
 * Challenge categories
 */
export enum ChallengeCategory {
  ALGORITHMS = "algorithms",
  DATA_STRUCTURES = "data_structures",
  BASICS = "basics",
  FUNCTIONS = "functions",
  LOOPS = "loops",
  CONDITIONALS = "conditionals",
  OBJECTS = "objects",
  ARRAYS = "arrays",
  STRINGS = "strings",
  RECURSION = "recursion",
  SORTING = "sorting",
  SEARCHING = "searching",
  DYNAMIC_PROGRAMMING = "dynamic_programming",
  GRAPH_THEORY = "graph_theory",
}

/**
 * Test case for challenge validation
 */
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
  timeLimit?: number; // in milliseconds
  memoryLimit?: number; // in MB
}

/**
 * Challenge definition type
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
  subcategories?: string[];
  instructions: string;
  codeTemplate: Record<ProgrammingLanguage, string>;
  testCases: TestCase[];
  hints: string[];
  solution: Record<ProgrammingLanguage, string>;
  timeLimit: number; // in milliseconds
  memoryLimit: number; // in MB
  successRate?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublished?: boolean;
  prerequisites?: string[]; // IDs of challenges that should be completed first
  xpReward: number;
  coinReward: number;
}

/**
 * Type for a challenge submission
 */
export interface ChallengeSubmission {
  id?: string;
  userId: string;
  challengeId: string;
  language: ProgrammingLanguage;
  code: string;
  status: SubmissionStatus;
  results?: TestCaseResult[];
  executionTime?: number; // in milliseconds
  maxMemoryUsage?: number; // in MB
  score?: number;
  feedback?: string;
  createdAt?: string;
  isAutomated?: boolean;
}

/**
 * Status of a challenge submission
 */
export enum SubmissionStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  TIMEOUT = "timeout",
  MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded",
  COMPILATION_ERROR = "compilation_error",
  RUNTIME_ERROR = "runtime_error",
  SYSTEM_ERROR = "system_error",
}

/**
 * Result of a single test case execution
 */
export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  output?: string;
  expectedOutput?: string;
  executionTime?: number; // in milliseconds
  memoryUsage?: number; // in MB
  error?: string;
  isHidden: boolean;
}

/**
 * Request type for code execution
 */
export interface CodeExecutionRequest {
  code: string;
  language: ProgrammingLanguage;
  input?: string;
  timeLimit?: number; // in milliseconds
  memoryLimit?: number; // in MB
}

/**
 * Request type for challenge submission
 */
export interface ChallengeSubmissionRequest {
  challengeId: string;
  code: string;
  language: ProgrammingLanguage;
}

/**
 * Response type for code execution
 */
export interface CodeExecutionResponse {
  output?: string;
  error?: string;
  executionTime?: number; // in milliseconds
  memoryUsage?: number; // in MB
  status: SubmissionStatus;
}

/**
 * Response type for challenge submission evaluation
 */
export interface ChallengeEvaluationResponse {
  submissionId: string;
  status: SubmissionStatus;
  results?: TestCaseResult[];
  score?: number;
  executionTime?: number; // in milliseconds
  maxMemoryUsage?: number; // in MB
  feedback?: string;
  xpEarned?: number;
  coinsEarned?: number;
  success: boolean;
}

/**
 * Error types specific to code evaluation
 */
export enum CodeEvaluationErrorType {
  INVALID_CODE = "INVALID_CODE",
  INVALID_LANGUAGE = "INVALID_LANGUAGE",
  INVALID_CHALLENGE = "INVALID_CHALLENGE",
  SECURITY_VIOLATION = "SECURITY_VIOLATION",
  EXECUTION_TIMEOUT = "EXECUTION_TIMEOUT",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
  SANDBOX_ERROR = "SANDBOX_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

/**
 * Type for completed challenge from database
 */
export type CompletedChallenge = TablesRow<"completed_challenges">;

/**
 * Type for user progress in a specific challenge category
 */
export interface CategoryProgress {
  category: ChallengeCategory;
  totalChallenges: number;
  completedChallenges: number;
  percentage: number;
}

/**
 * Type for language-specific configurations
 */
export interface LanguageConfig {
  fileExtension: string;
  compileCommand?: string[];
  runCommand: string[];
  includesRequired?: string[];
  sandbox: "vm" | "docker" | "worker";
}

/**
 * Language configuration map
 */
export const LANGUAGE_CONFIGS: Record<ProgrammingLanguage, LanguageConfig> = {
  [ProgrammingLanguage.JAVASCRIPT]: {
    fileExtension: "js",
    runCommand: ["node"],
    sandbox: "vm",
  },
  [ProgrammingLanguage.TYPESCRIPT]: {
    fileExtension: "ts",
    compileCommand: ["npx", "tsc"],
    runCommand: ["node"],
    sandbox: "vm",
  },
  [ProgrammingLanguage.PYTHON]: {
    fileExtension: "py",
    runCommand: ["python3"],
    sandbox: "docker",
  },
  [ProgrammingLanguage.JAVA]: {
    fileExtension: "java",
    compileCommand: ["javac"],
    runCommand: ["java"],
    sandbox: "docker",
  },
  [ProgrammingLanguage.CPP]: {
    fileExtension: "cpp",
    compileCommand: ["g++", "-std=c++14", "-o", "program"],
    runCommand: ["./program"],
    sandbox: "docker",
  },
};

/**
 * Security rules for code evaluation
 */
export interface SecurityRules {
  bannedFunctions: string[];
  bannedModules: string[];
  bannedKeywords: string[];
  allowedModules?: string[];
  maxLoopIterations?: number;
  maxRecursionDepth?: number;
  maxExecutionTime?: number; // in milliseconds
}

/**
 * Default security rules by language
 */
export const DEFAULT_SECURITY_RULES: Record<
  ProgrammingLanguage,
  SecurityRules
> = {
  [ProgrammingLanguage.JAVASCRIPT]: {
    bannedFunctions: [
      "eval",
      "Function",
      "setTimeout",
      "setInterval",
      "process.exit",
    ],
    bannedModules: [
      "fs",
      "child_process",
      "http",
      "https",
      "net",
      "dgram",
      "dns",
      "os",
      "cluster",
    ],
    bannedKeywords: [],
    allowedModules: [
      "assert",
      "buffer",
      "crypto",
      "path",
      "util",
      "stream",
      "url",
      "querystring",
    ],
    maxLoopIterations: 10000,
    maxRecursionDepth: 1000,
    maxExecutionTime: 5000, // 5 seconds
  },
  [ProgrammingLanguage.TYPESCRIPT]: {
    bannedFunctions: [
      "eval",
      "Function",
      "setTimeout",
      "setInterval",
      "process.exit",
    ],
    bannedModules: [
      "fs",
      "child_process",
      "http",
      "https",
      "net",
      "dgram",
      "dns",
      "os",
      "cluster",
    ],
    bannedKeywords: [],
    allowedModules: [
      "assert",
      "buffer",
      "crypto",
      "path",
      "util",
      "stream",
      "url",
      "querystring",
    ],
    maxLoopIterations: 10000,
    maxRecursionDepth: 1000,
    maxExecutionTime: 5000, // 5 seconds
  },
  [ProgrammingLanguage.PYTHON]: {
    bannedFunctions: ["eval", "exec", "compile", "os.system", "subprocess"],
    bannedModules: [
      "os",
      "subprocess",
      "sys",
      "importlib",
      "builtins",
      "shutil",
    ],
    bannedKeywords: [],
    allowedModules: [
      "math",
      "random",
      "time",
      "collections",
      "heapq",
      "re",
      "json",
      "itertools",
    ],
    maxLoopIterations: 10000,
    maxRecursionDepth: 1000,
    maxExecutionTime: 5000, // 5 seconds
  },
  [ProgrammingLanguage.JAVA]: {
    bannedFunctions: ["System.exit", "Runtime.getRuntime"],
    bannedModules: ["java.io.File", "java.net", "java.nio.file"],
    bannedKeywords: [],
    maxLoopIterations: 10000,
    maxRecursionDepth: 1000,
    maxExecutionTime: 5000, // 5 seconds
  },
  [ProgrammingLanguage.CPP]: {
    bannedFunctions: ["system", "exec", "popen", "fork"],
    bannedModules: ["<fstream>", "<filesystem>"],
    bannedKeywords: [],
    maxLoopIterations: 10000,
    maxRecursionDepth: 1000,
    maxExecutionTime: 5000, // 5 seconds
  },
};
