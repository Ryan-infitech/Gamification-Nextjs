import { Request, Response } from "express";
import { supabase } from "../config/database";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthRequest } from "../types/auth";
import { ValidationError, ResourceNotFoundError } from "../types/error";
import { executeCode, analyzeCode } from "../utils/codeRunner";
import {
  ProgrammingLanguage,
  Challenge,
  ChallengeSubmission,
  ChallengeSubmissionRequest,
  CodeExecutionRequest,
  CodeExecutionResponse,
  TestCaseResult,
  SubmissionStatus,
  ChallengeEvaluationResponse,
  TestCase,
} from "../types/challenge";
import logger from "../config/logger";
import { notificationService } from "../services/notificationService";
import { calculateExperienceForLevel } from "../utils/gameCalculations";
import { gameProgressService } from "../services/gameProgressService";

/**
 * Execute user code without test cases
 * @route POST /api/code/execute
 */
export const executeUserCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.id;
    const { code, language, input } = req.body;

    // Validate request
    if (!code) {
      throw new ValidationError("Code is required");
    }

    if (!Object.values(ProgrammingLanguage).includes(language)) {
      throw new ValidationError(`Unsupported language: ${language}`);
    }

    // Create execution request
    const executionRequest: CodeExecutionRequest = {
      code,
      language,
      input: input || "",
      timeLimit: 5000, // 5 seconds
      memoryLimit: 50, // 50 MB
    };

    // Execute code
    const executionResponse: CodeExecutionResponse = await executeCode(
      executionRequest
    );

    // Log the execution
    logger.info("Code executed", {
      userId,
      language,
      status: executionResponse.status,
      executionTime: executionResponse.executionTime,
    });

    // Return execution result
    res.status(200).json({
      success: true,
      message: "Code executed successfully",
      data: executionResponse,
    });
  }
);

/**
 * Submit a solution for a specific challenge
 * @route POST /api/code/challenges/:challengeId/submit
 */
export const submitChallengeSolution = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.id;
    const { challengeId } = req.params;
    const { code, language } = req.body;

    // Validate request
    if (!code) {
      throw new ValidationError("Code is required");
    }

    if (!Object.values(ProgrammingLanguage).includes(language)) {
      throw new ValidationError(`Unsupported language: ${language}`);
    }

    // Fetch challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      throw new ResourceNotFoundError(
        `Challenge with id ${challengeId} not found`
      );
    }

    // Parse challenge data into our Challenge type
    const challengeData: Challenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category,
      subcategories: challenge.subcategories,
      instructions: challenge.instructions,
      codeTemplate: challenge.code_template,
      testCases: challenge.test_cases,
      hints: challenge.hints,
      solution: challenge.solution,
      timeLimit: challenge.time_limit || 5000,
      memoryLimit: challenge.memory_limit || 50,
      xpReward: challenge.xp_reward,
      coinReward: challenge.coin_reward,
    };

    // Check if user already completed this challenge
    const { data: existingSubmission } = await supabase
      .from("completed_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .single();

    const alreadyCompleted = !!existingSubmission;

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("challenge_submissions")
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        language,
        code,
        status: SubmissionStatus.PENDING,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (submissionError) {
      logger.error("Error creating submission record", {
        error: submissionError,
        userId,
        challengeId,
      });
      throw new Error("Failed to create submission record");
    }

    const submissionId = submission.id;

    // Evaluate the submission
    try {
      // Prepare test case results array
      const results: TestCaseResult[] = [];
      let totalTests = challengeData.testCases.length;
      let passedTests = 0;
      let maxExecutionTime = 0;

      // Run each test case
      for (const testCase of challengeData.testCases) {
        const result = await evaluateTestCase(
          code,
          language,
          testCase,
          challengeData.timeLimit,
          challengeData.memoryLimit
        );

        results.push(result);

        if (result.passed) {
          passedTests++;
        }

        if (result.executionTime && result.executionTime > maxExecutionTime) {
          maxExecutionTime = result.executionTime;
        }
      }

      // Calculate score as a percentage
      const score = Math.round((passedTests / totalTests) * 100);
      const passed = score >= 100; // All tests must pass

      // Determine status
      let status = SubmissionStatus.COMPLETED;
      if (results.some((r) => r.error && r.error.includes("timed out"))) {
        status = SubmissionStatus.TIMEOUT;
      } else if (results.some((r) => r.error)) {
        status = SubmissionStatus.FAILED;
      }

      // Update submission record
      await supabase
        .from("challenge_submissions")
        .update({
          status,
          results,
          execution_time: maxExecutionTime,
          score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      // If passed and not previously completed, add to completed_challenges
      let xpEarned = 0;
      let coinsEarned = 0;

      if (passed && !alreadyCompleted) {
        // Add to completed challenges
        await supabase.from("completed_challenges").insert({
          user_id: userId,
          challenge_id: challengeId,
          completed_at: new Date().toISOString(),
          score,
          solution_code: code,
        });

        // Award XP and coins
        xpEarned = challengeData.xpReward;
        coinsEarned = challengeData.coinReward;

        // Update player stats with rewards
        await gameProgressService.updateStats({
          userId,
          experience:
            (await gameProgressService.getPlayerStats(userId)).experience +
            xpEarned,
          coins:
            (await gameProgressService.getPlayerStats(userId)).coins +
            coinsEarned,
        });

        // Send notification
        await notificationService.sendNotification({
          user_id: userId,
          type: "challenge_complete",
          title: "Challenge Completed",
          message: `You've completed the challenge: ${challengeData.title}`,
          data: {
            challengeId,
            xpEarned,
            coinsEarned,
          },
        });

        // Update success rate for this challenge
        await updateChallengeSuccessRate(challengeId);
      }

      // Prepare feedback message
      let feedback = passed
        ? "Great job! All tests passed!"
        : `You've passed ${passedTests} out of ${totalTests} tests. Keep trying!`;

      // Generate response
      const response: ChallengeEvaluationResponse = {
        submissionId,
        status,
        results: results.map((r) => ({
          ...r,
          expectedOutput: r.isHidden ? undefined : r.expectedOutput,
        })),
        score,
        executionTime: maxExecutionTime,
        feedback,
        xpEarned: passed && !alreadyCompleted ? xpEarned : 0,
        coinsEarned: passed && !alreadyCompleted ? coinsEarned : 0,
        success: passed,
      };

      res.status(200).json({
        success: true,
        message: passed ? "Solution passed all tests!" : "Some tests failed",
        data: response,
      });
    } catch (error) {
      // Update submission record with error
      await supabase
        .from("challenge_submissions")
        .update({
          status: SubmissionStatus.SYSTEM_ERROR,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      logger.error("Error evaluating challenge submission", {
        error,
        userId,
        challengeId,
        submissionId,
      });
      throw error;
    }
  }
);

/**
 * Get challenge details with test cases
 * @route GET /api/code/challenges/:challengeId
 */
export const getChallengeDetails = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.id;
    const { challengeId } = req.params;

    // Fetch challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      throw new ResourceNotFoundError(
        `Challenge with id ${challengeId} not found`
      );
    }

    // Check if user has completed this challenge
    const { data: completedChallenge } = await supabase
      .from("completed_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .single();

    // Filter out hidden test cases if the challenge is not completed
    let testCases = challenge.test_cases;
    if (!completedChallenge) {
      testCases = challenge.test_cases.map((testCase: TestCase) => {
        if (testCase.isHidden) {
          return {
            ...testCase,
            expectedOutput: "(hidden)",
          };
        }
        return testCase;
      });
    }

    // Prepare challenge data for response
    const challengeData = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category,
      subcategories: challenge.subcategories,
      instructions: challenge.instructions,
      codeTemplate: challenge.code_template,
      testCases,
      hints: completedChallenge ? challenge.hints : challenge.hints.slice(0, 1), // Show only first hint if not completed
      timeLimit: challenge.time_limit,
      successRate: challenge.success_rate,
      xpReward: challenge.xp_reward,
      coinReward: challenge.coin_reward,
      isCompleted: !!completedChallenge,
    };

    res.status(200).json({
      success: true,
      message: "Challenge details retrieved successfully",
      data: challengeData,
    });
  }
);

/**
 * Get user's challenge submissions history
 * @route GET /api/code/submissions
 */
export const getUserSubmissions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.id;
    const { limit = 20, offset = 0, challengeId } = req.query;

    // Build query
    let query = supabase
      .from("challenge_submissions")
      .select("*, challenge:challenges(title, difficulty, category)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Add challenge filter if provided
    if (challengeId) {
      query = query.eq("challenge_id", challengeId);
    }

    // Execute query
    const { data: submissions, error, count } = await query;

    if (error) {
      logger.error("Error fetching user submissions", { error, userId });
      throw new Error("Failed to fetch user submissions");
    }

    res.status(200).json({
      success: true,
      message: "User submissions retrieved successfully",
      data: {
        submissions,
        pagination: {
          total: count || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      },
    });
  }
);

/**
 * Get popular or recommended challenges
 * @route GET /api/code/challenges/recommended
 */
export const getRecommendedChallenges = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.id;
    const { limit = 10, category, difficulty } = req.query;

    // Get user's stats to determine level
    const { level } = await gameProgressService.getPlayerStats(userId);

    // Get completed challenges by the user
    const { data: completedChallenges } = await supabase
      .from("completed_challenges")
      .select("challenge_id")
      .eq("user_id", userId);

    const completedIds = completedChallenges?.map((c) => c.challenge_id) || [];

    // Build query for challenges
    let query = supabase
      .from("challenges")
      .select(
        "id, title, difficulty, category, success_rate, xp_reward, coin_reward"
      );

    // Exclude completed challenges
    if (completedIds.length > 0) {
      query = query.not("id", "in", `(${completedIds.join(",")})`);
    }

    // Apply category filter if provided
    if (category) {
      query = query.eq("category", category);
    }

    // Apply difficulty filter if provided
    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    } else {
      // If no difficulty provided, recommend based on user level
      if (level <= 5) {
        query = query.eq("difficulty", "easy");
      } else if (level <= 15) {
        query = query.in("difficulty", ["easy", "medium"]);
      }
      // Above level 15, all difficulties are fine
    }

    // Limit results and randomize a bit for variety
    query = query
      .order("success_rate", { ascending: false })
      .limit(Number(limit) * 2);

    const { data: challenges, error } = await query;

    if (error) {
      logger.error("Error fetching recommended challenges", { error, userId });
      throw new Error("Failed to fetch recommended challenges");
    }

    // Shuffle the challenges a bit to add variety
    const shuffled = [...(challenges || [])].sort(() => 0.5 - Math.random());
    const recommended = shuffled.slice(0, Number(limit));

    res.status(200).json({
      success: true,
      message: "Recommended challenges retrieved successfully",
      data: recommended,
    });
  }
);

/**
 * Get user progress across challenge categories
 * @route GET /api/code/progress
 */
export const getUserProgress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.id;

    // Get challenge categories counts
    const { data: categoryCounts, error: countError } = await supabase
      .from("challenges")
      .select("category, count")
      .group("category");

    if (countError) {
      logger.error("Error fetching challenge categories", {
        error: countError,
        userId,
      });
      throw new Error("Failed to fetch challenge categories");
    }

    // Get completed challenges by category for this user
    const { data: completedCounts, error: completedError } = await supabase
      .from("completed_challenges")
      .select("challenges(category)")
      .eq("user_id", userId);

    if (completedError) {
      logger.error("Error fetching completed challenges", {
        error: completedError,
        userId,
      });
      throw new Error("Failed to fetch completed challenges");
    }

    // Count completed challenges by category
    const completedByCategory: Record<string, number> = {};
    completedCounts?.forEach((item) => {
      const category = item.challenges?.category;
      if (category) {
        completedByCategory[category] =
          (completedByCategory[category] || 0) + 1;
      }
    });

    // Generate progress data
    const progress = categoryCounts?.map((item) => {
      const completed = completedByCategory[item.category] || 0;
      const total = Number(item.count);
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        category: item.category,
        totalChallenges: total,
        completedChallenges: completed,
        percentage,
      };
    });

    res.status(200).json({
      success: true,
      message: "User progress retrieved successfully",
      data: {
        progress,
        overall: {
          totalChallenges:
            categoryCounts?.reduce(
              (acc, item) => acc + Number(item.count),
              0
            ) || 0,
          completedChallenges: completedCounts?.length || 0,
        },
      },
    });
  }
);

// ======== Helper functions ========

/**
 * Evaluate a single test case
 * @param code - User's code
 * @param language - Programming language
 * @param testCase - Test case to evaluate
 * @param timeLimit - Time limit in milliseconds
 * @param memoryLimit - Memory limit in MB
 * @returns Test case result
 */
async function evaluateTestCase(
  code: string,
  language: ProgrammingLanguage,
  testCase: TestCase,
  timeLimit: number = 5000,
  memoryLimit: number = 50
): Promise<TestCaseResult> {
  try {
    // Execute the code with the test input
    const executionRequest: CodeExecutionRequest = {
      code,
      language,
      input: testCase.input,
      timeLimit: testCase.timeLimit || timeLimit,
      memoryLimit: testCase.memoryLimit || memoryLimit,
    };

    const executionResponse = await executeCode(executionRequest);

    // Check if there was an error during execution
    if (executionResponse.status !== SubmissionStatus.COMPLETED) {
      return {
        testCaseId: testCase.id,
        passed: false,
        output: executionResponse.output,
        expectedOutput: testCase.expectedOutput,
        executionTime: executionResponse.executionTime,
        error: executionResponse.error,
        isHidden: testCase.isHidden,
      };
    }

    // Compare output with expected output
    const normalizedOutput = normalizeOutput(executionResponse.output || "");
    const normalizedExpected = normalizeOutput(testCase.expectedOutput);
    const passed = normalizedOutput === normalizedExpected;

    return {
      testCaseId: testCase.id,
      passed,
      output: executionResponse.output,
      expectedOutput: testCase.expectedOutput,
      executionTime: executionResponse.executionTime,
      memoryUsage: executionResponse.memoryUsage,
      isHidden: testCase.isHidden,
    };
  } catch (error) {
    logger.error("Error evaluating test case", {
      error,
      testCaseId: testCase.id,
    });

    return {
      testCaseId: testCase.id,
      passed: false,
      expectedOutput: testCase.expectedOutput,
      error: `System error: ${error.message}`,
      isHidden: testCase.isHidden,
    };
  }
}

/**
 * Normalize output string for comparison
 * @param output - Output string to normalize
 * @returns Normalized output string
 */
function normalizeOutput(output: string): string {
  return output.trim().replace(/\r\n/g, "\n").replace(/\s+/g, " ");
}

/**
 * Update success rate for a challenge
 * @param challengeId - Challenge ID
 */
async function updateChallengeSuccessRate(challengeId: string): Promise<void> {
  try {
    // Get total submissions
    const { count: totalCount, error: totalError } = await supabase
      .from("challenge_submissions")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId);

    if (totalError) {
      throw totalError;
    }

    // Get successful submissions
    const { count: successCount, error: successError } = await supabase
      .from("challenge_submissions")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId)
      .eq("status", SubmissionStatus.COMPLETED)
      .gte("score", 100);

    if (successError) {
      throw successError;
    }

    // Calculate success rate
    const successRate =
      totalCount && totalCount > 0
        ? Math.round(((successCount || 0) / totalCount) * 100)
        : 0;

    // Update challenge
    const { error: updateError } = await supabase
      .from("challenges")
      .update({ success_rate: successRate })
      .eq("id", challengeId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    logger.error("Error updating challenge success rate", {
      error,
      challengeId,
    });
  }
}

export default {
  executeUserCode,
  submitChallengeSolution,
  getChallengeDetails,
  getUserSubmissions,
  getRecommendedChallenges,
  getUserProgress,
};
