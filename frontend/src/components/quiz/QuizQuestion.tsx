'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizQuestion as QuizQuestionType } from '@/types/quiz';
import { cn } from '@/lib/utils';
import CodeBlock from '@/components/ui/CodeBlock';

interface QuizQuestionProps {
  /**
   * The question to display
   */
  question: QuizQuestionType;
  
  /**
   * Question number in the quiz
   */
  questionNumber: number;
  
  /**
   * Total number of questions in the quiz
   */
  totalQuestions: number;
  
  /**
   * Callback when an answer is selected
   */
  onAnswerSelected: (questionId: string, answerId: string) => void;
  
  /**
   * The currently selected answer ID
   */
  selectedAnswerId?: string;
  
  /**
   * Whether the quiz is in review mode (showing correct answers)
   */
  reviewMode?: boolean;
  
  /**
   * Whether the question is currently active
   */
  isActive?: boolean;
  
  /**
   * Time limit in seconds (if applicable)
   */
  timeLimit?: number;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Component to display a quiz question with multiple-choice options
 */
const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSelected,
  selectedAnswerId,
  reviewMode = false,
  isActive = true,
  timeLimit,
  className,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(timeLimit || null);
  const [isAnswered, setIsAnswered] = useState<boolean>(!!selectedAnswerId);
  
  // Handle time limit countdown
  useEffect(() => {
    if (!timeLimit || !isActive || reviewMode || isAnswered) return;
    
    setTimeRemaining(timeLimit);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLimit, isActive, reviewMode, isAnswered]);
  
  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !isAnswered) {
      setIsAnswered(true);
      // Submit empty or forced answer when time expires
      onAnswerSelected(question.id, '');
    }
  }, [timeRemaining, isAnswered, question.id, onAnswerSelected]);
  
  // Handle answer selection
  const handleSelectAnswer = (answerId: string) => {
    if (isAnswered && !reviewMode) return;
    
    setIsAnswered(true);
    onAnswerSelected(question.id, answerId);
  };
  
  // Get CSS class for an option based on review mode and selection
  const getOptionClassName = (optionId: string) => {
    if (reviewMode) {
      // In review mode, show correct and incorrect selections
      if (optionId === question.correctOptionId) {
        return "border-accent bg-accent/20 hover:bg-accent/30";
      } else if (optionId === selectedAnswerId) {
        return "border-danger bg-danger/20 hover:bg-danger/30";
      }
      return "border-dark-600 bg-dark-700/50 hover:bg-dark-700";
    }
    
    // During quiz, highlight selected option
    if (optionId === selectedAnswerId) {
      return "border-primary bg-primary/20 hover:bg-primary/30";
    }
    
    return "border-dark-600 bg-dark-700/50 hover:bg-dark-700";
  };
  
  return (
    <div 
      className={cn(
        "quiz-question p-6 rounded-lg border-2 border-pixel bg-dark-800/90",
        className
      )}
    >
      {/* Progress and time information */}
      <div className="flex justify-between items-center mb-4">
        <div className="question-progress text-sm font-medium">
          Question {questionNumber} of {totalQuestions}
        </div>
        
        {timeLimit && isActive && !reviewMode && (
          <div className="time-remaining flex items-center">
            <svg 
              className="w-4 h-4 mr-1" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span 
              className={cn(
                "text-sm font-mono",
                timeRemaining && timeRemaining < 10 ? "text-danger animate-pulse" : ""
              )}
            >
              {timeRemaining !== null ? timeRemaining : timeLimit}s
            </span>
          </div>
        )}
      </div>
      
      {/* Question text */}
      <h3 className="question-text text-xl font-pixel mb-2">
        {question.text}
      </h3>
      
      {/* Code snippet if present */}
      {question.codeSnippet && (
        <div className="code-snippet mb-6">
          <CodeBlock
            code={question.codeSnippet}
            language={question.codeLanguage || 'javascript'}
            showLineNumbers
          />
        </div>
      )}
      
      {/* Answer options */}
      <div className="answer-options mt-6 space-y-3">
        <AnimatePresence>
          {question.options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
              className={cn(
                "option p-3 border-2 rounded-lg cursor-pointer transition-all",
                getOptionClassName(option.id),
                (!isActive || (isAnswered && !reviewMode)) && "pointer-events-none opacity-80"
              )}
              onClick={() => handleSelectAnswer(option.id)}
            >
              <div className="flex items-start">
                <div className={cn(
                  "option-marker w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0",
                  option.id === selectedAnswerId 
                    ? "bg-primary text-white" 
                    : "bg-dark-600 text-gray-300"
                )}>
                  {String.fromCharCode(65 + index)}
                </div>
                
                <div className="option-content">
                  {option.text}
                  
                  {/* Code in option if present */}
                  {option.code && (
                    <div className="mt-2 text-sm">
                      <CodeBlock
                        code={option.code}
                        language={question.codeLanguage || 'javascript'}
                        showLineNumbers={false}
                      />
                    </div>
                  )}
                </div>
                
                {/* Feedback in review mode */}
                {reviewMode && option.id === selectedAnswerId && option.id !== question.correctOptionId && (
                  <div className="incorrect-icon ml-auto flex-shrink-0">
                    <svg 
                      className="w-5 h-5 text-danger" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M6 18L18 6M6 6L18 18" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                
                {reviewMode && option.id === question.correctOptionId && (
                  <div className="correct-icon ml-auto flex-shrink-0">
                    <svg 
                      className="w-5 h-5 text-accent" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M5 13L9 17L19 7" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Explanation (only in review mode) */}
      {reviewMode && question.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="explanation mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <h4 className="font-medium mb-2 text-primary">Explanation:</h4>
          <p className="text-sm">{question.explanation}</p>
        </motion.div>
      )}
    </div>
  );
};

export default QuizQuestion;
