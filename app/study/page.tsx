"use client"

import { useSearchParams } from "next/navigation"
import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubjectById, getAllQuestionsForSubject } from "@/lib/subjects-data"
import { ChevronLeft, Filter } from "lucide-react"

export default function StudyPage() {
  const searchParams = useSearchParams()
  const subjectId = searchParams.get("subject") || "hematology"
  const chapterFilter = searchParams.get("chapter")

  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [questionType, setQuestionType] = useState<"all" | "textbased" | "multiplechoice" | "truefalse">("all")

  const subject = getSubjectById(subjectId)
  const allQuestionsData = getAllQuestionsForSubject(subjectId)

  const filteredQuestions = useMemo(() => {
    let allQuestions: any[] = []

    if (questionType === "all" || questionType === "textbased") {
      allQuestions = [...allQuestions, ...allQuestionsData.textBased]
    }
    if (questionType === "all" || questionType === "multiplechoice") {
      allQuestions = [
        ...allQuestions,
        ...allQuestionsData.multiChoice.map((q: any) => ({
          ...q,
          questionType: "multiplechoice",
          answer: q.explanation,
        })),
      ]
    }
    if (questionType === "all" || questionType === "truefalse") {
      allQuestions = [
        ...allQuestions,
        ...allQuestionsData.trueFalse.map((q: any) => ({
          ...q,
          questionType: "truefalse",
          answer: q.explanation,
        })),
      ]
    }

    let filtered = allQuestions

    if (chapterFilter) {
      filtered = filtered.filter((question) => question.chapter === chapterFilter)
    }

    if (difficulty !== "all") {
      filtered = filtered.filter((question) => question.difficulty === difficulty)
    }

    return filtered
  }, [allQuestionsData, chapterFilter, difficulty, questionType])

  if (!subject) {
    return <div className="p-8 text-center">Subject not found</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{subject.name} - Study Guide</h1>
              {chapterFilter && <p className="text-gray-600 mt-1">Chapter: {chapterFilter}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Question Type:</span>
            <div className="flex gap-2">
              {(["all", "textbased", "multiplechoice", "truefalse"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setQuestionType(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    questionType === type ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {type === "textbased"
                    ? "Text-Based"
                    : type === "multiplechoice"
                      ? "Multiple Choice"
                      : type === "truefalse"
                        ? "True/False"
                        : "All"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by difficulty:</span>
            <div className="flex gap-2">
              {(["all", "easy", "medium", "hard"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    difficulty === level ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <span className="ml-auto text-sm text-gray-600">Showing {filteredQuestions.length} questions</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-4">
          {filteredQuestions.map((qa, index) => (
            <Card
              key={qa.id}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setExpandedId(expandedId === qa.id ? null : qa.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {index + 1}. {qa.question}
                    </CardTitle>
                    <CardDescription>
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs mr-2 font-medium">
                        {qa.questionType === "multiplechoice"
                          ? "Multiple Choice"
                          : qa.questionType === "truefalse"
                            ? "True/False"
                            : "Text-Based"}
                      </span>
                      {qa.category && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs mr-2">
                          {qa.category}
                        </span>
                      )}
                      {qa.difficulty && (
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            qa.difficulty === "easy"
                              ? "bg-green-100 text-green-700"
                              : qa.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {qa.difficulty.charAt(0).toUpperCase() + qa.difficulty.slice(1)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {expandedId === qa.id && (
                <CardContent className="border-t pt-6 space-y-4">
                  {qa.questionType === "multiplechoice" && qa.options && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Options:</h4>
                      {qa.options.map((option: string, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2 rounded ${
                            idx === qa.correctAnswer
                              ? "bg-green-100 border-l-4 border-green-600"
                              : "bg-gray-50 border-l-4 border-gray-300"
                          }`}
                        >
                          <p className="text-gray-700">
                            {String.fromCharCode(65 + idx)}. {option}
                            {idx === qa.correctAnswer && (
                              <span className="text-green-600 font-bold ml-2">(Correct)</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {qa.questionType === "truefalse" && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Correct Answer:</h4>
                      <p className={`text-lg font-bold ${qa.correctAnswer ? "text-green-600" : "text-red-600"}`}>
                        {qa.correctAnswer ? "TRUE" : "FALSE"}
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {qa.questionType === "multiplechoice" || qa.questionType === "truefalse"
                        ? "Explanation:"
                        : "Answer:"}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{qa.answer}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
