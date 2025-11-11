import { hematologyQuestions, hematologyMultipleChoice, hematologyTrueFalse } from "./hematology-questions"
import type { HematologyQA, MultipleChoiceQuestion, TrueFalseQuestion } from "./hematology-questions"

export interface Subject {
  id: string
  name: string
  description: string
  chapters: Chapter[]
}

export interface Chapter {
  id: string
  name: string
  order: number
}

export interface AllQuestionTypes {
  textBased: HematologyQA[]
  multiChoice: MultipleChoiceQuestion[]
  trueFalse: TrueFalseQuestion[]
}

export const subjects: Subject[] = [
  {
    id: "hematology",
    name: "Hematology",
    description: "Study of blood and blood-forming tissues, including red blood cells, hemoglobin, and various anemias",
    chapters: [
      { id: "ch1", name: "Introduction to Hematology I", order: 1 },
      { id: "ch2", name: "Microcytic Hypochromic Anemia", order: 2 },
      { id: "ch3", name: "Hemolytic Anemia", order: 3 },
      { id: "ch4", name: "Red Cell Membrane", order: 4 },
      { id: "ch5", name: "Morphological Classification of Anemia", order: 5 },
      { id: "ch6", name: "Diagnosis of Anemia", order: 6 },
      { id: "ch7", name: "Iron Deficiency Anemia Pathophysiology", order: 7 },
    ],
  },
]

export function getSubjectById(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id)
}

export function getQuestionsBySubjectAndChapter(subjectId: string, chapterName: string): AllQuestionTypes {
  if (subjectId === "hematology") {
    const textBased = hematologyQuestions.filter((q) => q.chapter === chapterName)
    const multiChoice = hematologyMultipleChoice.filter((q) => q.chapter === chapterName)
    const trueFalse = hematologyTrueFalse.filter((q) => q.chapter === chapterName)
    return { textBased, multiChoice, trueFalse }
  }
  return { textBased: [], multiChoice: [], trueFalse: [] }
}

export function getAllQuestionsForSubject(subjectId: string): AllQuestionTypes {
  if (subjectId === "hematology") {
    return { textBased: hematologyQuestions, multiChoice: hematologyMultipleChoice, trueFalse: hematologyTrueFalse }
  }
  return { textBased: [], multiChoice: [], trueFalse: [] }
}

export function getChaptersBySubject(subjectId: string): Chapter[] {
  const subject = getSubjectById(subjectId)
  return subject ? subject.chapters : []
}
