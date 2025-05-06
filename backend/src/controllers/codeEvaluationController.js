/**
 * Code Evaluation Controller
 * Handles evaluation of user-submitted code for challenges
 */
const { validationResult } = require("express-validator");
const { executeDbOperation } = require("../config/database");
const { ApiError } = require("../middleware/errorHandler");
const { runCode, testSolution } = require("../utils/codeRunner");
const gameProgressService = require("../services/gameProgressService");

/**
 * Get test cases for a challenge
 * @route GET /api/code/challenge/:challengeId/test-cases
 */
const getTestCases = async (req, res, next) => {
  try {
    const { challengeId } = req.params;

    // Get challenge details including test cases
    const result = await executeDbOperation(async (client) => {
      return await client
        .from("challenge_test_cases")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("case_order", { ascending: true });
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch test cases"));
    }

    // Filter out hidden test cases or remove expected output for them
    const visibleTestCases = result.data.map((testCase) => {
      if (testCase.is_hidden) {
        return {
          id: testCase.id,
          case_order: testCase.case_order,
          input: testCase.input,
          description: testCase.description,
          is_hidden: true,
        };
      }
      return {
        id: testCase.id,
        case_order: testCase.case_order,
        input: testCase.input,
        expected: testCase.expected_output,
        description: testCase.description,
        is_hidden: false,
      };
    });

    return res.status(200).json({
      status: "success",
      data: {
        testCases: visibleTestCases,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Run code without evaluating (for debugging)
 * @route POST /api/code/run
 */
const runCodeOnly = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Validation error", errors.array()));
    }

    const { code, language, inputs } = req.body;

    // Run the code in the sandbox
    const result = await runCode(code, language, inputs);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit code solution for a challenge
 * @route POST /api/code/challenge/:challengeId/submit
 */
const submitSolution = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest("Validation error", errors.array()));
    }

    const { challengeId } = req.params;
    const { code, language = "javascript" } = req.body;
    const userId = req.user.id;

    // Get challenge details
    const challengeResult = await executeDbOperation(async (client) => {
      return await client
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
    });

    if (challengeResult.error || !challengeResult.data) {
      return next(ApiError.notFound("Challenge not found"));
    }

    // Get test cases
    const testCasesResult = await executeDbOperation(async (client) => {
      return await client
        .from("challenge_test_cases")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("case_order", { ascending: true });
    });

    if (testCasesResult.error) {
      return next(ApiError.internal("Failed to fetch test cases"));
    }

    // Format test cases for evaluation
    const testCases = testCasesResult.data.map((tc) => ({
      input: JSON.parse(tc.input),
      expected: JSON.parse(tc.expected_output),
      description: tc.description,
      is_hidden: tc.is_hidden,
    }));

    // Run the code in the sandbox
    const executionResult = await runCode(code, language);

    if (!executionResult.success) {
      return res.status(200).json({
        status: "error",
        message: "Code execution failed",
        data: {
          error: executionResult.error,
          console: executionResult.console,
        },
      });
    }

    // Test the solution against all test cases
    const solution = executionResult.output;
    const testResult = testSolution(solution, testCases);

    // Calculate score based on passing tests
    const passedCount = testResult.results.filter((r) => r.passed).length;
    const totalCount = testResult.results.length;
    const score = Math.round((passedCount / totalCount) * 100);

    // Record the submission
    const submissionData = {
      user_id: userId,
      challenge_id: challengeId,
      code,
      language,
      passed: testResult.success,
      score,
      execution_time: executionResult.executionTime,
      submission_date: new Date(),
      console_output: JSON.stringify(executionResult.console),
    };

    await executeDbOperation(async (client) => {
      return await client.from("code_submissions").insert(submissionData);
    });

    // If solution passed all tests, mark challenge as completed
    if (testResult.success) {
      // Calculate time taken (how long since they started the challenge)
      // This assumes they started the challenge before submitting
      const attemptResult = await executeDbOperation(async (client) => {
        return await client
          .from("completed_challenges")
          .select("attempts")
          .eq("user_id", userId)
          .eq("challenge_id", challengeId)
          .single();
      });

      const attempts = attemptResult.data ? attemptResult.data.attempts : 1;
      const timeTaken = executionResult.executionTime; // simplified, real implementation would use start time

      // Mark challenge as completed and award rewards
      const completionResult = await gameProgressService.completeChallenge(
        userId,
        challengeId,
        code,
        Math.round(timeTaken / 1000) // convert to seconds
      );

      return res.status(200).json({
        status: "success",
        message: "Challenge completed successfully!",
        data: {
          passed: true,
          score,
          testResults: testResult.results.map((r) => ({
            ...r,
            input: r.input,
            expected: r.expected,
            actual: r.actual,
            passed: r.passed,
          })),
          console: executionResult.console,
          executionTime: executionResult.executionTime,
          rewards: completionResult.data?.rewards,
          achievements: completionResult.achievements || [],
        },
      });
    } else {
      // Solution didn't pass all tests
      return res.status(200).json({
        status: "partial",
        message: `Passed ${passedCount} out of ${totalCount} tests`,
        data: {
          passed: false,
          score,
          testResults: testResult.results.map((r) => ({
            ...r,
            input: r.input,
            expected: r.is_hidden ? "[hidden]" : r.expected,
            actual: r.actual,
            passed: r.passed,
          })),
          console: executionResult.console,
          executionTime: executionResult.executionTime,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get submission history for a challenge
 * @route GET /api/code/challenge/:challengeId/submissions
 */
const getSubmissions = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const result = await executeDbOperation(async (client) => {
      return await client
        .from("code_submissions")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .order("submission_date", { ascending: false });
    });

    if (result.error) {
      return next(ApiError.internal("Failed to fetch submissions"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        submissions: result.data || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTestCases,
  runCodeOnly,
  submitSolution,
  getSubmissions,
};
