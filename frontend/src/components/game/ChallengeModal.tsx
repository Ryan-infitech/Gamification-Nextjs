'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChallengeType, ProgrammingLanguage, ChallengeSubmission, TestCaseResult } from '@/types/challenges';
import CodeEditor from './CodeEditor';
import { useCodeEvaluation } from '@/hooks/useCodeEvaluation';
import { Spinner } from '@/components/ui/spinner';

interface ChallengeModalProps {
  /**
   * The challenge to display
   */
  challenge: ChallengeType;
  
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Callback when the modal is closed
   */
  onClose: () => void;
  
  /**
   * Callback when a challenge is completed
   */
  onComplete?: (challengeId: string, score: number) => void;
  
  /**
   * Callback when a challenge is started
   */
  onStart?: (challengeId: string) => void;
  
  /**
   * User ID (for saving progress)
   */
  userId?: string;
  
  /**
   * Previously saved code (if any)
   */
  savedCode?: string;
  
  /**
   * Previously selected language (if any)
   */
  savedLanguage?: ProgrammingLanguage;
  
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Enum for Challenge modal tabs
 */
type ModalTab = 'description' | 'code' | 'results';

/**
 * Modal component displaying a coding challenge with editor and results
 */
const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onComplete,
  onStart,
  userId,
  savedCode,
  savedLanguage,
  className,
}) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  
  // Determine active tab
  const [activeTab, setActiveTab] = useState<ModalTab>('description');
  
  // Selected programming language
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(
    savedLanguage || 
    (challenge.supportedLanguages && challenge.supportedLanguages.length > 0 
      ? challenge.supportedLanguages[0] 
      : 'javascript')
  );
  
  // Current code
  const [code, setCode] = useState<string>(
    savedCode || 
    (challenge.boilerplate ? challenge.boilerplate[selectedLanguage] : '')
  );
  
  // Use code evaluation hook
  const { 
    evaluateCode, 
    isEvaluating, 
    result, 
    error,
    resetEvaluation 
  } = useCodeEvaluation();
  
  // Testing status
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Handle language change
  const handleLanguageChange = (language: ProgrammingLanguage) => {
    // Don't change during evaluation
    if (isEvaluating) return;
    
    // Confirm if code has been modified
    const currentBoilerplate = challenge.boilerplate?.[selectedLanguage] || '';
    const isCodeModified = code !== currentBoilerplate && code !== savedCode;
    
    if (isCodeModified) {
      const confirmed = window.confirm(
        'Changing language will reset your code. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }
    
    setSelectedLanguage(language);
    setCode(challenge.boilerplate?.[language] || '');
  };
  
  // Handle code change
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  // Handle code submission
  const handleSubmit = async () => {
    if (!challenge || isEvaluating) return;
    
    // Call onStart callback if provided
    if (onStart && !isSubmitted) {
      onStart(challenge.id);
    }
    
    // Reset previous evaluation
    resetEvaluation();
    
    // Set submitted flag
    setIsSubmitted(true);
    
    // Switch to results tab
    setActiveTab('results');
    
    // Evaluate code
    try {
      await evaluateCode({
        code,
        language: selectedLanguage,
        challengeId: challenge.id,
        userId: userId || 'anonymous'
      });
    } catch (err) {
      console.error('Code evaluation error:', err);
    }
  };
  
  // When evaluation result is available
  useEffect(() => {
    if (result && isSubmitted && onComplete) {
      // If all tests pass, call onComplete
      const allTestsPassed = result.testResults?.every(test => test.passed) ?? false;
      if (allTestsPassed) {
        onComplete(challenge.id, result.score || 100);
      }
    }
  }, [result, isSubmitted, challenge.id, onComplete]);
  
  // When language changes, update code with boilerplate
  useEffect(() => {
    if (challenge.boilerplate && !savedCode) {
      setCode(challenge.boilerplate[selectedLanguage] || '');
    }
  }, [selectedLanguage, challenge.boilerplate, savedCode]);
  
  // Body variants for modal animation
  const variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
  };
  
  // Function to calculate test passing rate
  const getTestPassRate = (): string => {
    if (!result || !result.testResults || result.testResults.length === 0) {
      return '0%';
    }
    
    const passedTests = result.testResults.filter(test => test.passed).length;
    const totalTests = result.testResults.length;
    const passRate = Math.round((passedTests / totalTests) * 100);
    
    return `${passRate}%`;
  };
  
  // Add the return to description link
  const renderReturnToDescription = () => (
    <button
      onClick={() => setActiveTab('description')}
      className="text-xs text-primary hover:underline mb-4 flex items-center"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back to Description
    </button>
  );
  
  // Render test case results
  const renderTestResults = (testResults?: TestCaseResult[]) => {
    if (!testResults || testResults.length === 0) {
      return <p className="text-center text-gray-500 my-8">No test results available</p>;
    }
    
    return (
      <div className="test-results-container space-y-4 mt-4">
        {testResults.map((test, index) => (
          <div 
            key={`test-${index}-${test.testCaseId}`}
            className={cn(
              "test-result p-3 rounded-lg border-2",
              test.passed 
                ? "bg-accent/10 border-accent/30 text-accent-foreground" 
                : "bg-danger/10 border-danger/30 text-danger-foreground"
            )}
          >
            <div className="flex items-center mb-2">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center mr-2",
                test.passed ? "bg-accent text-white" : "bg-danger text-white"
              )}>
                {test.passed ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <h4 className="font-bold text-sm">Test Case #{index + 1} - {test.passed ? 'Passed' : 'Failed'}</h4>
              
              {test.executionTime !== undefined && (
                <span className="ml-auto text-xs opacity-70">{test.executionTime}ms</span>
              )}
            </div>
            
            {!test.passed && test.errorMessage && (
              <div className="error-message bg-danger/5 p-2 rounded text-sm font-mono overflow-auto max-h-20">
                {test.errorMessage}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <p className="font-medium mb-1">Expected:</p>
                <div className="bg-black/10 p-2 rounded font-mono text-xs overflow-auto max-h-20">
                  {JSON.stringify(test.actualOutput, null, 2)}
                </div>
              </div>
              <div>
                <p className="font-medium mb-1">Actual:</p>
                <div className="bg-black/10 p-2 rounded font-mono text-xs overflow-auto max-h-20">
                  {JSON.stringify(test.actualOutput, null, 2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Handle modal close (via ESC key or outside click)
  useEffect(() => {
    const handleEscClose = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscClose);
    return () => window.removeEventListener('keydown', handleEscClose);
  }, [isOpen, onClose]);

  if (!challenge) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "challenge-modal w-[90%] max-w-5xl h-[90vh] bg-white dark:bg-dark-800 rounded-lg",
              "flex flex-col border-2 border-pixel shadow-lg overflow-hidden",
              "z-10 relative",
              isDarkTheme ? "border-dark-600" : "border-gray-300",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="challenge-header px-6 py-4 border-b-2 dark:border-dark-600 flex justify-between items-center bg-gray-50 dark:bg-dark-700">
              <div>
                <h2 className="text-xl font-pixel text-dark-900 dark:text-white">
                  {challenge.title}
                </h2>
                <div className="flex items-center mt-1 space-x-3">
                  <span className={cn(
                    "px-2 py-0.5 text-xs rounded font-medium",
                    challenge.difficulty === 'easy' ? "bg-accent/20 text-accent" :
                    challenge.difficulty === 'medium' ? "bg-warning/20 text-warning" :
                    "bg-danger/20 text-danger"
                  )}>
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {challenge.category}
                  </span>
                  {challenge.xpReward && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      {challenge.xpReward} XP
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="challenge-tabs border-b-2 dark:border-dark-600 grid grid-cols-3">
              <button 
                onClick={() => setActiveTab('description')}
                className={cn(
                  "py-2 px-4 text-sm font-medium transition-colors",
                  activeTab === 'description'
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-300"
                )}
              >
                Description
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={cn(
                  "py-2 px-4 text-sm font-medium transition-colors",
                  activeTab === 'code'
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-300"
                )}
              >
                Code Editor
              </button>
              <button 
                onClick={() => setActiveTab('results')}
                className={cn(
                  "py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center",
                  activeTab === 'results'
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-300"
                )}
              >
                Results
                {isSubmitted && result && (
                  <span className={cn(
                    "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                    result.testResults?.every(t => t.passed)
                      ? "bg-accent text-white"
                      : "bg-danger text-white"
                  )}>
                    {getTestPassRate()}
                  </span>
                )}
              </button>
            </div>
            
            {/* Content */}
            <div className="challenge-content flex-grow overflow-y-auto p-6">
              {activeTab === 'description' && (
                <div className="description">
                  <div 
                    className="description-text prose dark:prose-invert max-w-none" 
                    dangerouslySetInnerHTML={{ __html: challenge.description.replace(/\n/g, '<br>') }}
                  />
                  
                  {/* Examples section */}
                  {'examples' in challenge && challenge.examples && challenge.examples.length > 0 && (
                    <div className="examples-section mt-6">
                      <h3 className="text-lg font-bold mb-4">Examples</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {challenge.examples.map((example, idx) => (
                          <div key={idx} className="example p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border-2 border-gray-200 dark:border-dark-600">
                            <div className="mb-3">
                              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">Input:</h4>
                              <pre className="font-mono text-xs bg-gray-100 dark:bg-dark-600 p-2 rounded overflow-x-auto">
                                {example.input}
                              </pre>
                            </div>
                            <div className="mb-3">
                              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">Output:</h4>
                              <pre className="font-mono text-xs bg-gray-100 dark:bg-dark-600 p-2 rounded overflow-x-auto">
                                {example.output}
                              </pre>
                            </div>
                            {example.explanation && (
                              <div>
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">Explanation:</h4>
                                <p className="text-xs text-gray-700 dark:text-gray-300">{example.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Hints section */}
                  {challenge.hints && challenge.hints.length > 0 && (
                    <div className="hints-section mt-6">
                      <details className="bg-primary/10 rounded-lg p-4">
                        <summary className="font-bold cursor-pointer text-primary">Hints</summary>
                        <ul className="mt-3 list-disc pl-5 space-y-1">
                          {challenge.hints.map((hint, idx) => (
                            <li key={idx} className="text-sm">{hint}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                  
                  {/* Constraints section */}
                  {challenge.constraints && challenge.constraints.length > 0 && (
                    <div className="constraints-section mt-6">
                      <h3 className="text-lg font-bold mb-2">Constraints</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {challenge.constraints.map((constraint, idx) => (
                          <li key={idx} className="text-sm">{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setActiveTab('code')}
                      className="px-6 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white font-pixel transition-colors"
                    >
                      Start Coding
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'code' && (
                <div className="code-section flex flex-col h-full">
                  {renderReturnToDescription()}
                  
                  <div className="language-selector mb-3 flex items-center">
                    <label className="block text-sm font-medium mr-3">Language:</label>
                    <div className="flex space-x-2">
                      {challenge.supportedLanguages?.map(language => (
                        <button
                          key={language}
                          onClick={() => handleLanguageChange(language)}
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                            selectedLanguage === language
                              ? "bg-primary text-white"
                              : "bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-500"
                          )}
                          disabled={isEvaluating}
                        >
                          {language.charAt(0).toUpperCase() + language.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <CodeEditor
                      initialValue={code}
                      language={selectedLanguage}
                      onChange={handleCodeChange}
                      onSubmit={handleSubmit}
                      height="calc(100vh - 400px)"
                      fontSize={14}
                      minimap={true}
                      readOnly={isEvaluating}
                    />
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isEvaluating}
                      className={cn(
                        "px-6 py-2 rounded-lg text-white font-pixel transition-colors",
                        isEvaluating
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-primary hover:bg-primary/80"
                      )}
                    >
                      {isEvaluating ? (
                        <span className="flex items-center">
                          <Spinner size="sm" className="mr-2" />
                          Running Tests...
                        </span>
                      ) : (
                        'Submit Solution'
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'results' && (
                <div className="results-section">
                  {renderReturnToDescription()}
                  
                  <h3 className="text-lg font-bold mb-4">Test Results</h3>
                  
                  {isEvaluating ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Spinner size="lg" className="mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Running your code...</p>
                    </div>
                  ) : error ? (
                    <div className="error-container bg-danger/10 border-2 border-danger/30 rounded-lg p-4 text-danger">
                      <h4 className="font-bold mb-2">Error</h4>
                      <p className="font-mono text-sm whitespace-pre-wrap overflow-auto max-h-40">
                        {error}
                      </p>
                    </div>
                  ) : !isSubmitted ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p>Submit your solution to see test results.</p>
                    </div>
                  ) : result ? (
                    <div className="results-container">
                      <div className={cn(
                        "summary-box p-4 rounded-lg mb-6 flex items-center",
                        result.testResults?.every(t => t.passed)
                          ? "bg-accent/20 border-2 border-accent/30"
                          : "bg-danger/20 border-2 border-danger/30"
                      )}>
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center mr-4",
                          result.testResults?.every(t => t.passed)
                            ? "bg-accent text-white"
                            : "bg-danger text-white"
                        )}>
                          {result.testResults?.every(t => t.passed) ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg">
                            {result.testResults?.every(t => t.passed)
                              ? 'All Tests Passed!'
                              : 'Some Tests Failed'}
                          </h3>
                          <p>
                            {result.testResults?.filter(t => t.passed).length || 0} of {result.testResults?.length || 0} tests passing
                            {result.score !== undefined && ` (Score: ${result.score})`}
                            {result.executionTime !== undefined && ` · ${result.executionTime}ms`}
                          </p>
                        </div>
                      </div>
                      
                      {renderTestResults(result.testResults)}
                      
                      {result.testResults?.every(t => t.passed) && (
                        <div className="success-actions mt-8 text-center">
                          <div className="p-6 bg-accent/10 rounded-lg mb-4">
                            <h3 className="font-pixel text-xl text-accent mb-2">Challenge Completed!</h3>
                            <p>
                              Great job! You've successfully completed this challenge.
                              {result.score !== undefined && ` You earned ${result.score} points and ${challenge.xpReward || 0} XP.`}
                            </p>
                          </div>
                          
                          <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white font-pixel transition-colors"
                          >
                            Continue
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChallengeModal;
