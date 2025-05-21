import { Request, Response, NextFunction } from "express";
import { createClient } from "../config/database";
import { v4 as uuidv4 } from "uuid";
import { QuizQuestion, QuizAnswer } from "../types/quiz";
import logger from "../config/logger";

/**
 * Interface for quiz creation
 */
interface CreateQuizData {
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  timeLimit?: number;
  topics: string[];
  questions: QuizQuestion[];
}

/**
 * Interface for quiz submission
 */
interface QuizSubmission {
  quizId: string;
  userId: string;
  answers: QuizAnswer[];
}

/**
 * Get all quizzes with filters
 */
export const getQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, difficulty, limit, offset = 0 } = req.query;

    // Initialize Supabase client
    const supabase = createClient();

    let query = supabase.from("quizzes").select(`
      id,
      title,
      description,
      category,
      difficulty,
      xp_reward,
      topics,
      time_limit,
      estimated_minutes,
      question_count,
      status
    `);

    // Apply filters if provided
    if (category) {
      query = query.eq("category", category);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    // Only return active quizzes
    query = query.eq("status", "published");

    // Apply pagination
    if (limit) {
      query = query.limit(Number(limit));
    }

    query = query.range(
      Number(offset),
      Number(offset) + (Number(limit) || 100) - 1
    );

    // Execute query
    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching quizzes:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch quizzes",
        error: error.message,
      });
    }

    // If user is authenticated, fetch their attempts for these quizzes
    const userId = req.user?.id;

    if (userId && data.length > 0) {
      const quizIds = data.map((quiz) => quiz.id);

      const { data: attempts, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, score, completed_at")
        .eq("user_id", userId)
        .in("quiz_id", quizIds)
        .order("completed_at", { ascending: false });

      if (attemptsError) {
        logger.error("Error fetching quiz attempts:", attemptsError);
      } else {
        // Group attempts by quiz_id, keeping only the latest per quiz
        const latestAttempts = attempts.reduce((acc, attempt) => {
          if (
            !acc[attempt.quiz_id] ||
            new Date(attempt.completed_at) >
              new Date(acc[attempt.quiz_id].completed_at)
          ) {
            acc[attempt.quiz_id] = attempt;
          }
          return acc;
        }, {} as Record<string, any>);

        // Enhance quiz data with user attempt data
        data.forEach((quiz) => {
          const attempt = latestAttempts[quiz.id];
          if (attempt) {
            quiz.isCompleted = true;
            quiz.bestScore = attempt.score;
          } else {
            quiz.isCompleted = false;
          }
        });
      }
    }

    // Format response to match frontend expectations
    const formattedQuizzes = data.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      xpReward: quiz.xp_reward,
      topics: quiz.topics || [],
      timeLimit: quiz.time_limit,
      estimatedMinutes: quiz.estimated_minutes,
      questionCount: quiz.question_count,
      isCompleted: quiz.isCompleted || false,
      bestScore: quiz.bestScore || null,
    }));

    return res.status(200).json({
      success: true,
      data: formattedQuizzes,
      meta: {
        total: formattedQuizzes.length,
        offset: Number(offset),
        limit: Number(limit) || formattedQuizzes.length,
      },
    });
  } catch (error) {
    logger.error("Unexpected error in getQuizzes:", error);
    next(error);
  }
};

/**
 * Get a specific quiz by ID with its questions
 */
export const getQuizById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Initialize Supabase client
    const supabase = createClient();

    // Get quiz details
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        description,
        category,
        difficulty,
        xp_reward,
        topics,
        time_limit,
        estimated_minutes,
        question_count,
        status
      `
      )
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (quizError) {
      logger.error(`Error fetching quiz with ID ${id}:`, quizError);
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Get quiz questions
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select(
        `
        id,
        quiz_id,
        question,
        options,
        correct_answer,
        explanation,
        code_snippet,
        code_language,
        difficulty,
        order_index
      `
      )
      .eq("quiz_id", id)
      .order("order_index", { ascending: true });

    if (questionsError) {
      logger.error(`Error fetching questions for quiz ${id}:`, questionsError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch quiz questions",
        error: questionsError.message,
      });
    }

    // Check if user has attempted this quiz before
    const userId = req.user?.id;
    let userAttempt = null;

    if (userId) {
      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select("id, score, completed_at")
        .eq("user_id", userId)
        .eq("quiz_id", id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (!attemptError && attempt) {
        userAttempt = {
          id: attempt.id,
          score: attempt.score,
          completedAt: attempt.completed_at,
        };
      }
    }

    // Format questions for frontend
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      quizId: q.quiz_id,
      text: q.question,
      options: q.options.map((opt: any, index: number) => ({
        id: `option_${index}`,
        text: opt.text,
        code: opt.code || null,
      })),
      correctOptionId: q.correct_answer,
      explanation: q.explanation,
      codeSnippet: q.code_snippet,
      codeLanguage: q.code_language,
      difficulty: q.difficulty,
    }));

    // For security, don't send correct answers to frontend initially
    // We'll only show them after the quiz is completed
    const sanitizedQuestions = formattedQuestions.map((q) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { correctOptionId, explanation, ...rest } = q;
      return rest;
    });

    return res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          xpReward: quiz.xp_reward,
          topics: quiz.topics || [],
          timeLimit: quiz.time_limit,
          estimatedMinutes: quiz.estimated_minutes,
          questionCount: quiz.question_count,
          isCompleted: userAttempt !== null,
          bestScore: userAttempt?.score || null,
        },
        questions: sanitizedQuestions,
        userAttempt,
      },
    });
  } catch (error) {
    logger.error("Unexpected error in getQuizById:", error);
    next(error);
  }
};

/**
 * Create a new quiz
 */
export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only admin and teachers can create quizzes
    if (!req.user?.role || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only admins and teachers can create quizzes.",
      });
    }

    const quizData: CreateQuizData = req.body;

    // Validate required fields
    if (
      !quizData.title ||
      !quizData.category ||
      !quizData.difficulty ||
      !Array.isArray(quizData.questions)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        id: uuidv4(),
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        difficulty: quizData.difficulty,
        xp_reward: quizData.xpReward,
        topics: quizData.topics,
        time_limit: quizData.timeLimit,
        estimated_minutes: Math.ceil(quizData.questions.length * 1.5 || 5), // Estimate 1.5 min per question
        question_count: quizData.questions.length,
        created_by: req.user.id,
        status: "published",
      })
      .select("id")
      .single();

    if (quizError) {
      logger.error("Error creating quiz:", quizError);
      return res.status(500).json({
        success: false,
        message: "Failed to create quiz",
        error: quizError.message,
      });
    }

    const quizId = quiz.id;

    // Insert questions
    const questionsToInsert = quizData.questions.map((question, index) => ({
      id: uuidv4(),
      quiz_id: quizId,
      question: question.text,
      options: question.options,
      correct_answer: question.correctOptionId,
      explanation: question.explanation || null,
      code_snippet: question.codeSnippet || null,
      code_language: question.codeLanguage || null,
      difficulty: question.difficulty || quizData.difficulty,
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      logger.error("Error creating quiz questions:", questionsError);

      // Rollback quiz creation if questions failed
      await supabase.from("quizzes").delete().eq("id", quizId);

      return res.status(500).json({
        success: false,
        message: "Failed to create quiz questions",
        error: questionsError.message,
      });
    }

    // Return success response with created quiz
    return res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: {
        id: quizId,
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        difficulty: quizData.difficulty,
        questionCount: quizData.questions.length,
      },
    });
  } catch (error) {
    logger.error("Unexpected error in createQuiz:", error);
    next(error);
  }
};

/**
 * Update an existing quiz
 */
export const updateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const quizData = req.body;

    // Only admin and teachers can update quizzes
    if (!req.user?.role || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only admins and teachers can update quizzes.",
      });
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Check if quiz exists
    const { data: existingQuiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (fetchError) {
      logger.error(`Error fetching quiz with ID ${id}:`, fetchError);
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Additional permission check - only creator or admin can update
    if (req.user.role !== "admin" && existingQuiz.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this quiz",
      });
    }

    // Update quiz data
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        difficulty: quizData.difficulty,
        xp_reward: quizData.xpReward,
        topics: quizData.topics,
        time_limit: quizData.timeLimit,
        estimated_minutes:
          quizData.estimatedMinutes ||
          Math.ceil((quizData.questions?.length || 5) * 1.5),
        question_count: quizData.questions?.length || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      logger.error(`Error updating quiz with ID ${id}:`, updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update quiz",
        error: updateError.message,
      });
    }

    // If questions are provided, update them
    if (quizData.questions && Array.isArray(quizData.questions)) {
      // First, get existing questions to determine what to keep, update, or delete
      const { data: existingQuestions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("quiz_id", id);

      if (questionsError) {
        logger.error(
          `Error fetching questions for quiz ${id}:`,
          questionsError
        );
        // Continue anyway, as the main quiz was updated successfully
      } else {
        // Identify existing question IDs
        const existingIds = new Set(existingQuestions.map((q) => q.id));

        // Process questions to insert, update, or delete
        const toInsert = [];
        const toUpdate = [];
        const toKeep = new Set();

        quizData.questions.forEach((question, index) => {
          if (question.id && existingIds.has(question.id)) {
            // Update existing question
            toUpdate.push({
              id: question.id,
              quiz_id: id,
              question: question.text,
              options: question.options,
              correct_answer: question.correctOptionId,
              explanation: question.explanation || null,
              code_snippet: question.codeSnippet || null,
              code_language: question.codeLanguage || null,
              difficulty: question.difficulty || quizData.difficulty,
              order_index: index,
              updated_at: new Date().toISOString(),
            });
            toKeep.add(question.id);
          } else {
            // Insert new question
            toInsert.push({
              id: uuidv4(),
              quiz_id: id,
              question: question.text,
              options: question.options,
              correct_answer: question.correctOptionId,
              explanation: question.explanation || null,
              code_snippet: question.codeSnippet || null,
              code_language: question.codeLanguage || null,
              difficulty: question.difficulty || quizData.difficulty,
              order_index: index,
            });
          }
        });

        // Identify questions to delete (those in existingIds but not in toKeep)
        const toDelete = Array.from(existingIds).filter(
          (id) => !toKeep.has(id)
        );

        // Execute updates in transaction if possible
        // Insert new questions
        if (toInsert.length > 0) {
          const { error: insertError } = await supabase
            .from("quiz_questions")
            .insert(toInsert);

          if (insertError) {
            logger.error(
              `Error inserting questions for quiz ${id}:`,
              insertError
            );
          }
        }

        // Update existing questions
        if (toUpdate.length > 0) {
          // Supabase doesn't support bulk updates, so we need to do them one by one
          for (const question of toUpdate) {
            const { error: updateQErr } = await supabase
              .from("quiz_questions")
              .update(question)
              .eq("id", question.id);

            if (updateQErr) {
              logger.error(
                `Error updating question ${question.id}:`,
                updateQErr
              );
            }
          }
        }

        // Delete removed questions
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("quiz_questions")
            .delete()
            .in("id", toDelete);

          if (deleteError) {
            logger.error(
              `Error deleting questions for quiz ${id}:`,
              deleteError
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: {
        id,
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        difficulty: quizData.difficulty,
      },
    });
  } catch (error) {
    logger.error("Unexpected error in updateQuiz:", error);
    next(error);
  }
};

/**
 * Delete a quiz
 */
export const deleteQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Only admin and teachers can delete quizzes
    if (!req.user?.role || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only admins and teachers can delete quizzes.",
      });
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Check if quiz exists and if user has permission
    const { data: existingQuiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (fetchError) {
      logger.error(`Error fetching quiz with ID ${id}:`, fetchError);
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Additional permission check - only creator or admin can delete
    if (req.user.role !== "admin" && existingQuiz.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this quiz",
      });
    }

    // Delete related questions first
    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", id);

    if (questionsError) {
      logger.error(`Error deleting questions for quiz ${id}:`, questionsError);
      // Continue anyway to attempt deleting the quiz
    }

    // Delete the quiz
    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error(`Error deleting quiz with ID ${id}:`, deleteError);
      return res.status(500).json({
        success: false,
        message: "Failed to delete quiz",
        error: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    logger.error("Unexpected error in deleteQuiz:", error);
    next(error);
  }
};

/**
 * Process a quiz submission
 */
export const submitQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const submission: QuizSubmission = req.body;

    // Validate required fields
    if (!submission.quizId || !Array.isArray(submission.answers)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: quizId, answers",
      });
    }

    // Ensure userId is set from authenticated user
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. You must be logged in to submit a quiz.",
      });
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Get quiz questions with correct answers for grading
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, correct_answer")
      .eq("quiz_id", submission.quizId);

    if (questionsError) {
      logger.error(
        `Error fetching questions for quiz ${submission.quizId}:`,
        questionsError
      );
      return res.status(500).json({
        success: false,
        message: "Failed to validate quiz answers",
        error: questionsError.message,
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this quiz",
      });
    }

    // Create a lookup for correct answers
    const correctAnswers = questions.reduce((acc, q) => {
      acc[q.id] = q.correct_answer;
      return acc;
    }, {} as Record<string, string>);

    // Calculate score
    let correctCount = 0;
    submission.answers.forEach((answer) => {
      if (correctAnswers[answer.questionId] === answer.selectedOptionId) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    // Get quiz details for XP reward
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("xp_reward, title")
      .eq("id", submission.quizId)
      .single();

    if (quizError) {
      logger.error(
        `Error fetching quiz details for ${submission.quizId}:`,
        quizError
      );
      // Continue anyway, defaulting xpReward to 0
    }

    const xpReward = quiz?.xp_reward || 0;

    // Calculate actual XP based on score percentage
    const xpEarned = Math.round((score / 100) * xpReward);

    // Check for existing attempts to see if this is a highest score
    const { data: previousAttempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("id, score")
      .eq("user_id", userId)
      .eq("quiz_id", submission.quizId)
      .order("score", { ascending: false })
      .limit(1);

    let isNewBest = false;
    let shouldAwardXp = true;

    if (!attemptsError && previousAttempts.length > 0) {
      const highestPreviousScore = previousAttempts[0].score;
      isNewBest = score > highestPreviousScore;

      // Only award XP if this is a new best score or first attempt
      shouldAwardXp = isNewBest;
    }

    // Save the attempt
    const completedAt = new Date().toISOString();

    const { data: attemptData, error: insertError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: userId,
        quiz_id: submission.quizId,
        score,
        answers: submission.answers,
        completed_at: completedAt,
      })
      .select("id")
      .single();

    if (insertError) {
      logger.error("Error saving quiz attempt:", insertError);
      return res.status(500).json({
        success: false,
        message: "Failed to save quiz attempt",
        error: insertError.message,
      });
    }

    // Award XP if this is a best score or first attempt
    if (shouldAwardXp && xpEarned > 0) {
      const { error: xpError } = await supabase.rpc("increment_player_xp", {
        p_user_id: userId,
        p_xp_amount: xpEarned,
      });

      if (xpError) {
        logger.error("Error awarding XP:", xpError);
        // Continue anyway since the quiz attempt was saved
      }
    }

    // Create achievement notification for perfect score
    if (score === 100) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "achievement",
        title: "Perfect Score!",
        message: `You got a perfect score on ${quiz?.title || "a quiz"}!`,
        data: {
          quizId: submission.quizId,
          score,
          xpEarned: shouldAwardXp ? xpEarned : 0,
        },
      });
    }

    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        attemptId: attemptData.id,
        quizId: submission.quizId,
        score,
        correctCount,
        totalQuestions: questions.length,
        answers: submission.answers,
        xpEarned: shouldAwardXp ? xpEarned : 0,
        isNewBest,
        completedAt,
      },
    });
  } catch (error) {
    logger.error("Unexpected error in submitQuiz:", error);
    next(error);
  }
};

/**
 * Get quiz attempt history for a user
 */
export const getQuizAttempts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. You must be logged in to view quiz attempts.",
      });
    }

    // Initialize Supabase client
    const supabase = createClient();

    let query = supabase
      .from("quiz_attempts")
      .select(
        `
        id,
        quiz_id,
        score,
        completed_at,
        time_taken,
        quizzes!inner(title, category, difficulty)
      `
      )
      .eq("user_id", userId);

    // Filter by quizId if provided
    if (quizId) {
      query = query.eq("quiz_id", quizId);
    }

    // Order by completion date, newest first
    query = query.order("completed_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching quiz attempts:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch quiz attempts",
        error: error.message,
      });
    }

    // Format response
    const formattedAttempts = data.map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quiz_id,
      quizTitle: attempt.quizzes.title,
      category: attempt.quizzes.category,
      difficulty: attempt.quizzes.difficulty,
      score: attempt.score,
      completedAt: attempt.completed_at,
      timeTaken: attempt.time_taken,
    }));

    return res.status(200).json({
      success: true,
      data: formattedAttempts,
    });
  } catch (error) {
    logger.error("Unexpected error in getQuizAttempts:", error);
    next(error);
  }
};

/**
 * Get detailed quiz attempt
 */
export const getQuizAttemptDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. You must be logged in to view attempt details.",
      });
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Get attempt data
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select(
        `
        id,
        quiz_id,
        score,
        answers,
        completed_at,
        time_taken,
        quizzes!inner(title, category, difficulty)
      `
      )
      .eq("id", attemptId)
      .eq("user_id", userId)
      .single();

    if (attemptError) {
      logger.error(`Error fetching quiz attempt ${attemptId}:`, attemptError);
      return res.status(404).json({
        success: false,
        message: "Quiz attempt not found or unauthorized",
      });
    }

    // Get quiz questions to provide correct answers for review
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select(
        `
        id,
        question,
        options,
        correct_answer,
        explanation,
        code_snippet,
        code_language
      `
      )
      .eq("quiz_id", attempt.quiz_id);

    if (questionsError) {
      logger.error(
        `Error fetching questions for quiz ${attempt.quiz_id}:`,
        questionsError
      );
      // Continue anyway to return at least the attempt data
    }

    // Format questions for response
    const formattedQuestions =
      questions?.map((q) => ({
        id: q.id,
        text: q.question,
        options: q.options,
        correctOptionId: q.correct_answer,
        explanation: q.explanation,
        codeSnippet: q.code_snippet,
        codeLanguage: q.code_language,
      })) || [];

    // Format response
    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt.id,
        quizId: attempt.quiz_id,
        quizTitle: attempt.quizzes.title,
        category: attempt.quizzes.category,
        difficulty: attempt.quizzes.difficulty,
        score: attempt.score,
        completedAt: attempt.completed_at,
        timeTaken: attempt.time_taken,
        answers: attempt.answers,
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    logger.error("Unexpected error in getQuizAttemptDetail:", error);
    next(error);
  }
};

/**
 * Get quiz statistics for admin
 */
export const getQuizStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId } = req.params;

    // Only admins and teachers can view stats
    if (!req.user?.role || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized. Only admins and teachers can view quiz statistics.",
      });
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Get quiz details
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("title, category, difficulty, question_count")
      .eq("id", quizId)
      .single();

    if (quizError) {
      logger.error(`Error fetching quiz ${quizId}:`, quizError);
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Get attempt statistics
    const { data: attemptStats, error: statsError } = await supabase
      .from("quiz_attempts")
      .select("id, score, time_taken")
      .eq("quiz_id", quizId);

    if (statsError) {
      logger.error(
        `Error fetching attempt stats for quiz ${quizId}:`,
        statsError
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch quiz statistics",
        error: statsError.message,
      });
    }

    // Calculate statistics
    const totalAttempts = attemptStats.length;
    const scores = attemptStats.map((a) => a.score);
    const avgScore =
      totalAttempts > 0
        ? scores.reduce((sum, score) => sum + score, 0) / totalAttempts
        : 0;

    const timeTaken = attemptStats
      .filter((a) => a.time_taken) // Filter out null/undefined
      .map((a) => a.time_taken);

    const avgTimeTaken =
      timeTaken.length > 0
        ? timeTaken.reduce((sum, time) => sum + time, 0) / timeTaken.length
        : 0;

    // Calculate difficulty distribution
    const scoreRanges = {
      easy: scores.filter((s) => s >= 80).length,
      medium: scores.filter((s) => s >= 50 && s < 80).length,
      hard: scores.filter((s) => s < 50).length,
    };

    // Calculate completion rate
    const passRate =
      totalAttempts > 0
        ? (scores.filter((s) => s >= 70).length / totalAttempts) * 100
        : 0;

    // Return statistics
    return res.status(200).json({
      success: true,
      data: {
        quizId,
        title: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        questionCount: quiz.question_count,
        statistics: {
          totalAttempts,
          averageScore: avgScore,
          averageTimeTaken: avgTimeTaken,
          passRate,
          difficultyDistribution: {
            easy: (scoreRanges.easy / totalAttempts) * 100 || 0,
            medium: (scoreRanges.medium / totalAttempts) * 100 || 0,
            hard: (scoreRanges.hard / totalAttempts) * 100 || 0,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Unexpected error in getQuizStats:", error);
    next(error);
  }
};

export default {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  getQuizAttempts,
  getQuizAttemptDetail,
  getQuizStats,
};
