"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { subjects } from "@/lib/subjects-data"
import { BookOpen, Brain, FileText } from "lucide-react"

export default function Home() {
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || "hematology")

  const currentSubject = subjects.find((s) => s.id === selectedSubject)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Medical Q&A Platform</h1>
              <p className="text-gray-600 mt-2">Master medical subjects through interactive learning</p>
            </div>
            <Link href="/pdf-export">
              <Button variant="outline" className="gap-2 bg-transparent">
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Subject Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedSubject === subject.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {subject.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentSubject && (
          <div className="space-y-8">
            {/* Subject Overview */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentSubject.name}</h2>
              <p className="text-gray-700 text-lg">{currentSubject.description}</p>
              <div className="mt-4 flex gap-3">
                <Link href={`/study?subject=${currentSubject.id}`}>
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <BookOpen className="w-4 h-4" />
                    Study Guide
                  </Button>
                </Link>
                <Link href={`/quiz?subject=${currentSubject.id}`}>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Brain className="w-4 h-4" />
                    Take Quiz
                  </Button>
                </Link>
              </div>
            </div>

            {/* Chapters Grid */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Chapters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSubject.chapters.map((chapter) => (
                  <Card key={chapter.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="text-lg">{chapter.name}</span>
                        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                          Ch {chapter.order}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">20 comprehensive questions</p>
                      <Link href={`/study?subject=${currentSubject.id}&chapter=${chapter.name}`}>
                        <Button variant="outline" className="w-full text-sm bg-transparent">
                          View Chapter
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Chapters</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{currentSubject.chapters.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{currentSubject.chapters.length * 20}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Learning Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">2</p>
                  <p className="text-xs text-gray-600 mt-2">Study + Quiz</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
