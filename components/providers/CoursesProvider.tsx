'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CourseMaterial = { id: string; title: string; url: string; type: 'PDF' | 'LINK' | 'PRODUCT' };
export type CourseLesson = {
  id: string;
  title: string;
  duration: string;
  isFree: boolean;
  videoUrl: string;
  content: string;
  order: number;
  materials: CourseMaterial[];
};
export type CourseModule = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
};
export type CoursePricingPlan = {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  accessPeriod: string;
  accessDays: number | null;
  price: number;
  currency: string;
  isActive: boolean;
  isRecommended: boolean;
  order: number;
};
export type CourseDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  modules: CourseModule[];
  pricingPlans: CoursePricingPlan[];
};

type Ctx = {
  courses: CourseDTO[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getCourseById: (idOrSlug: string) => CourseDTO | undefined;
  getAllLessons: (courseId?: string) => CourseLesson[];
  getLessonById: (lessonId: string) => { lesson: CourseLesson; course: CourseDTO } | null;
};

const CoursesContext = createContext<Ctx | null>(null);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [isLoading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/courses');
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCourses(data.courses ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getCourseById = useCallback(
    (idOrSlug: string) => courses.find((c) => c.id === idOrSlug || c.slug === idOrSlug),
    [courses]
  );

  const getAllLessons = useCallback(
    (courseId?: string) => {
      const list = courseId ? courses.filter((c) => c.id === courseId || c.slug === courseId) : courses;
      return list.flatMap((c) => c.modules.flatMap((m) => m.lessons));
    },
    [courses]
  );

  const getLessonById = useCallback(
    (lessonId: string) => {
      for (const c of courses) {
        for (const m of c.modules) {
          const l = m.lessons.find((x) => x.id === lessonId);
          if (l) return { lesson: l, course: c };
        }
      }
      return null;
    },
    [courses]
  );

  const value = useMemo<Ctx>(
    () => ({ courses, isLoading, refresh, getCourseById, getAllLessons, getLessonById }),
    [courses, isLoading, refresh, getCourseById, getAllLessons, getLessonById]
  );

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>;
}

export function useCourses(): Ctx {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error('useCourses must be used inside CoursesProvider');
  return ctx;
}
