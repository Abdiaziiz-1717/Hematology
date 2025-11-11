"use client"

import type React from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubjectById, getAllQuestionsForSubject } from "@/lib/subjects-data"
import { ChevronLeft, RotateCcw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type QuizQuestionType = "text" | "multiple-choice" | "true-false"

interface QuizQuestion {
  id: string
  chapter: string
  question: string
  questionType: QuizQuestionType
  category?: string
  difficulty?: "easy" | "medium" | "hard"
  answerText: string
  options?: string[]
  correctOptionIndex?: number
  correctBoolean?: boolean
  explanation?: string
}

interface QuizResult {
  questionId: string
  userAnswer: string
  correct: boolean
  score: number
  feedback: string
}

export default function QuizPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const subjectId = searchParams.get("subject") || "hematology"
  const chapterFilter = searchParams.get("chapter")

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [refreshToken, setRefreshToken] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [isRevealed, setIsRevealed] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState<string>(chapterFilter ?? "all")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const subject = getSubjectById(subjectId)
  const chapters = subject?.chapters ?? []

  useEffect(() => {
    if (!chapterFilter) {
      setSelectedChapter("all")
      return
    }

    const chapterExists = chapters.some((chapter) => chapter.name === chapterFilter)
    setSelectedChapter(chapterExists ? chapterFilter : "all")
  }, [chapterFilter, chapters, subjectId])

  useEffect(() => {
    setIsLoadingQuestions(true)

    const activeChapter = selectedChapter !== "all" ? selectedChapter : undefined
    const questionGroups = getAllQuestionsForSubject(subjectId)
    const filterByChapter = <T extends { chapter: string }>(items: T[]) =>
      activeChapter ? items.filter((q) => q.chapter === activeChapter) : items

    const textQuestions = filterByChapter(questionGroups.textBased ?? [])
    const multipleChoiceQuestions = filterByChapter(questionGroups.multiChoice ?? [])
    const trueFalseQuestions = filterByChapter(questionGroups.trueFalse ?? [])

    const normalized: QuizQuestion[] = [
      ...textQuestions.map((q) => ({
        id: q.id,
        chapter: q.chapter,
        question: q.question,
        questionType: "text" as const,
        category: q.category,
        difficulty: q.difficulty,
        answerText: q.answer,
      })),
      ...multipleChoiceQuestions.map((q) => {
        const correctOption = q.options?.[q.correctAnswer] ?? ""
        return {
          id: q.id,
          chapter: q.chapter,
          question: q.question,
          questionType: "multiple-choice" as const,
          answerText: correctOption,
          options: q.options,
          correctOptionIndex: q.correctAnswer,
          explanation: q.explanation,
        }
      }),
      ...trueFalseQuestions.map((q) => ({
        id: q.id,
        chapter: q.chapter,
        question: q.question,
        questionType: "true-false" as const,
        answerText: q.correctAnswer ? "True" : "False",
        correctBoolean: q.correctAnswer,
        explanation: q.explanation,
      })),
    ]

    const shuffled = [...normalized].sort(() => Math.random() - 0.5)

    setQuizQuestions(shuffled.slice(0, 10))
    setCurrentIndex(0)
    setUserAnswers({})
    setIsRevealed(false)
    setQuizComplete(false)
    setResults([])
    setIsEvaluating(false)
    setIsLoadingQuestions(false)
  }, [subjectId, selectedChapter, refreshToken])

  const currentQuestion = quizQuestions[currentIndex]
  const totalResults = results.length
  const totalCorrectAnswers = results.filter((r) => r.correct).length
  const averageScore =
    totalResults > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalResults) : 0
  const accuracyRate = totalResults > 0 ? Math.round((totalCorrectAnswers / totalResults) * 100) : 0

  const updateUserAnswer = (questionId: string, value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleChapterSelect = (value: string) => {
    setIsLoadingQuestions(true)
    setSelectedChapter(value)

    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("chapter")
    } else {
      params.set("chapter", value)
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const handleReveal = () => {
    setIsRevealed(true)
  }

  const evaluateAnswerWithAI = async (userAnswer: string, correctAnswer: string) => {
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer, correctAnswer }),
      })

      if (!response.ok) {
        console.error("API Error:", response.status)
        return getSimpleScore(userAnswer, correctAnswer)
      }

      const data = await response.json()
      return {
        score: data.score || 0,
        feedback: data.feedback || "Unable to generate feedback",
      }
    } catch (error) {
      console.error("Evaluation error:", error)
      return getSimpleScore(userAnswer, correctAnswer)
    }
  }

  const getSimpleScore = (userAnswer: string, correctAnswer: string) => {
    const userWords = userAnswer.toLowerCase().split(/\s+/)
    const correctWords = correctAnswer.toLowerCase().split(/\s+/)
    const matchCount = userWords.filter((word) => correctWords.includes(word)).length
    const score = Math.min((matchCount / correctWords.length) * 100, 100)
    return {
      score: Math.round(score),
      feedback:
        score >= 80
          ? "Excellent! Your answer matches the expected response."
          : score >= 50
            ? "Good attempt! Review the answer for complete understanding."
            : "Your answer needs improvement. Study the correct answer.",
    }
  }

  const formatQuestionType = (type: QuizQuestionType) => {
    switch (type) {
      case "multiple-choice":
        return "Multiple Choice"
      case "true-false":
        return "True / False"
      case "text":
      default:
        return "Free Response"
    }
  }

  const renderAnswerInput = () => {
    if (!currentQuestion) {
      return null
    }

    if (currentQuestion.questionType === "text") {
      return (
        <textarea
          ref={textareaRef}
          value={userAnswers[currentQuestion.id] || ""}
          onChange={(event) => updateUserAnswer(currentQuestion.id, event.target.value)}
          placeholder="Type your answer here..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isRevealed}
        />
      )
    }

    if (currentQuestion.questionType === "multiple-choice") {
      const options = currentQuestion.options ?? []

      return (
        <div className="space-y-3">
          {options.map((option, index) => {
            const optionId = `${currentQuestion.id}-option-${index}`
            const isSelected = userAnswers[currentQuestion.id] === index.toString()
            const isCorrectOption = currentQuestion.correctOptionIndex === index

            let selectionClasses = "border-gray-300 bg-white hover:border-blue-300 cursor-pointer"
            if (isSelected) {
              selectionClasses = "border-blue-500 bg-blue-50 cursor-pointer"
            }
            if (isRevealed) {
              if (isCorrectOption) {
                selectionClasses = "border-green-500 bg-green-50 cursor-default"
              } else if (isSelected) {
                selectionClasses = "border-red-500 bg-red-50 cursor-default"
              } else {
                selectionClasses = "border-gray-200 bg-gray-50 opacity-80 cursor-default"
              }
            }

            return (
              <label
                key={optionId}
                htmlFor={optionId}
                className={`flex items-center gap-3 p-3 border rounded-lg transition ${selectionClasses}`}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={currentQuestion.id}
                  value={index}
                  checked={isSelected}
                  disabled={isRevealed}
                  onChange={() => updateUserAnswer(currentQuestion.id, index.toString())}
                  className="accent-blue-600"
                />
                <span className="text-gray-800">{option}</span>
              </label>
            )
          })}
        </div>
      )
    }

    if (currentQuestion.questionType === "true-false") {
      const buildClasses = (value: boolean, isSelected: boolean) => {
        const baseClasses = "flex items-center gap-3 p-3 border rounded-lg transition "

        if (isRevealed) {
          if (currentQuestion.correctBoolean === value) {
            return `${baseClasses}border-green-500 bg-green-50 cursor-default`
          }
          if (isSelected) {
            return `${baseClasses}border-red-500 bg-red-50 cursor-default`
          }
          return `${baseClasses}border-gray-200 bg-gray-50 opacity-80 cursor-default`
        }

        if (isSelected) {
          return `${baseClasses}border-blue-500 bg-blue-50 cursor-pointer`
        }

        return `${baseClasses}border-gray-300 bg-white hover:border-blue-300 cursor-pointer`
      }

      return (
        <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
          {[true, false].map((value) => {
            const optionId = `${currentQuestion.id}-tf-${value}`
            const isSelected = userAnswers[currentQuestion.id] === String(value)

            return (
              <label key={optionId} htmlFor={optionId} className={buildClasses(value, isSelected)}>
                <input
                  id={optionId}
                  type="radio"
                  name={currentQuestion.id}
                  value={String(value)}
                  checked={isSelected}
                  disabled={isRevealed}
                  onChange={() => updateUserAnswer(currentQuestion.id, String(value))}
                  className="accent-blue-600"
                />
                <span className="text-gray-800">{value ? "True" : "False"}</span>
              </label>
            )
          })}
        </div>
      )
    }

    return null
  }

  const handleNext = async () => {
    if (currentIndex < quizQuestions.length - 1) {
      setIsRevealed(false)
      setCurrentIndex(currentIndex + 1)
    } else {
      await submitQuiz()
    }
  }

  const submitQuiz = async () => {
    setIsEvaluating(true)
    const evaluatedResults: QuizResult[] = []

    for (const question of quizQuestions) {
      const userAnswerRaw = userAnswers[question.id]

      if (question.questionType === "text") {
        const userAnswerText = userAnswerRaw || ""
        const evaluation = await evaluateAnswerWithAI(userAnswerText, question.answerText)

        evaluatedResults.push({
          questionId: question.id,
          userAnswer: userAnswerText,
          correct: evaluation.score >= 80,
          score: evaluation.score,
          feedback: evaluation.feedback,
        })
      } else if (question.questionType === "multiple-choice") {
        const selectedIndex = typeof userAnswerRaw === "string" ? Number(userAnswerRaw) : NaN
        const correctIndex =
          typeof question.correctOptionIndex === "number" ? question.correctOptionIndex : null
        const hasSelection = !Number.isNaN(selectedIndex)
        const selectedOption =
          hasSelection && question.options ? question.options[selectedIndex] ?? "" : ""
        const isCorrect = hasSelection && correctIndex !== null && selectedIndex === correctIndex
        const explanation = question.explanation?.trim()
        const feedback = explanation
          ? `${isCorrect ? "Correct." : "Not quite."} ${explanation}`.trim()
          : isCorrect
            ? "Correct answer."
            : "Incorrect answer."

        evaluatedResults.push({
          questionId: question.id,
          userAnswer: selectedOption,
          correct: isCorrect,
          score: isCorrect ? 100 : 0,
          feedback,
        })
      } else if (question.questionType === "true-false") {
        const normalizedAnswer =
          typeof userAnswerRaw === "string" ? userAnswerRaw.toLowerCase() : ""
        const correctValue =
          typeof question.correctBoolean === "boolean" ? question.correctBoolean : null
        const isCorrect = correctValue !== null && normalizedAnswer === String(correctValue)
        const userAnswerText =
          normalizedAnswer === "true"
            ? "True"
            : normalizedAnswer === "false"
              ? "False"
              : ""
        const explanation = question.explanation?.trim()
        const feedback = explanation
          ? `${isCorrect ? "Correct." : "Not quite."} ${explanation}`.trim()
          : isCorrect
            ? "Correct answer."
            : "Incorrect answer."

        evaluatedResults.push({
          questionId: question.id,
          userAnswer: userAnswerText,
          correct: isCorrect,
          score: isCorrect ? 100 : 0,
          feedback,
        })
      }
    }

    setResults(evaluatedResults)
    setQuizComplete(true)
    setIsEvaluating(false)
  }

  const handleReset = () => {
    setIsLoadingQuestions(true)
    setRefreshToken((token) => token + 1)
    setCurrentIndex(0)
    setUserAnswers({})
    setIsRevealed(false)
    setQuizComplete(false)
    setResults([])
    setIsEvaluating(false)
    if (textareaRef.current) {
      textareaRef.current.value = ""
    }
  }

  if (!subject) {
    return <div className="p-8 text-center">Subject not found</div>
  }

  if (isLoadingQuestions) {
    return <div className="p-8 text-center">Loading questions...</div>
  }

  if (!isLoadingQuestions && quizQuestions.length === 0) {
    return <div className="p-8 text-center">No questions available for this selection.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quiz - {subject.name}</h1>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
              <div className="w-full sm:w-64">
                <label htmlFor="chapter-select" className="sr-only">
                  Choose chapter
                </label>
                <Select value={selectedChapter} onValueChange={handleChapterSelect}>
                  <SelectTrigger id="chapter-select">
                    <SelectValue placeholder="All Chapters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.name}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!quizComplete && (
                <div className="text-sm font-medium text-gray-600 text-right">
                  Question {currentIndex + 1} of {quizQuestions.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!quizComplete ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl mb-4">{currentQuestion.question}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {formatQuestionType(currentQuestion.questionType)}
                </span>
                {currentQuestion.category && (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {currentQuestion.category}
                  </span>
                )}
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {currentQuestion.chapter}
                </span>
                {currentQuestion.difficulty && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-medium ${
                      currentQuestion.difficulty === "easy"
                        ? "bg-green-100 text-green-700"
                        : currentQuestion.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {renderAnswerInput()}

              {isRevealed && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 space-y-2">
                  <h4 className="font-semibold text-gray-900">Expected Answer:</h4>
                  <p className="text-gray-700 leading-relaxed">{currentQuestion.answerText}</p>
                  {currentQuestion.explanation && (
                    <p className="text-sm text-gray-600 leading-relaxed">{currentQuestion.explanation}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {!isRevealed && (
                  <Button onClick={handleReveal} variant="outline" className="flex-1 bg-transparent">
                    Reveal Answer
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={isEvaluating || (!isRevealed && !userAnswers[currentQuestion.id])}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isEvaluating ? "Evaluating..." : currentIndex === quizQuestions.length - 1 ? "Submit Quiz" : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Quiz Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Score</p>
                    <p className="text-3xl font-bold text-blue-600">{averageScore}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Correct Answers</p>
                    <p className="text-3xl font-bold text-green-600">
                      {totalCorrectAnswers}/{totalResults}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Accuracy Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{accuracyRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {results.map((result, index) => (
              <Card key={result.questionId} className={result.correct ? "border-green-200" : "border-red-200"}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {index + 1}. {quizQuestions[index]?.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{result.userAnswer || "No answer provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Expected Answer:</p>
                    <p className="text-gray-600 bg-blue-50 p-3 rounded">
                      {quizQuestions[index]?.answerText}
                    </p>
                    {quizQuestions[index]?.explanation && (
                      <p className="text-sm text-gray-600 bg-blue-50/70 p-3 rounded mt-2">
                        {quizQuestions[index]?.explanation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span className="font-medium text-gray-700">Score:</span>
                    <span className={`text-lg font-bold ${result.correct ? "text-green-600" : "text-red-600"}`}>
                      {result.score}%
                    </span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-700">{result.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-4 pt-6">
              <Button onClick={handleReset} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="w-4 h-4" />
                Retake Quiz
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
