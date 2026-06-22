'use client';

import { useSession } from '@/components/providers/SessionProvider';
import { useCourses } from '@/components/providers/CoursesProvider';

export const useProgress = (courseId: string = 'brow-master-pro') => {
  const session = useSession();
  const { getAllLessons } = useCourses();

  const progress = session.getProgressForCourse(courseId);

  const addLesson = (lessonId: string, _cId?: string) => {
    return session.markCompleted(lessonId);
  };

  const getLastLessonId = (cId?: string) => session.getLastLesson(cId ?? courseId);

  const getProgressPercentage = (cId?: string): number => {
    const targetCourseId = cId ?? courseId;
    const totalLessons = getAllLessons(targetCourseId).length;
    if (totalLessons === 0) return 0;
    const courseProgress = session.getProgressForCourse(targetCourseId);
    return Math.round((courseProgress.length / totalLessons) * 100);
  };

  const isLessonCompleted = (lessonId: string, cId?: string): boolean => {
    const targetCourseId = cId ?? courseId;
    return session.getProgressForCourse(targetCourseId).includes(lessonId);
  };

  const getCompletedCount = (cId?: string): number =>
    session.getProgressForCourse(cId ?? courseId).length;

  const getTotalCount = (cId?: string): number => getAllLessons(cId ?? courseId).length;

  const isFullyCompleted = (cId?: string): boolean => {
    const targetCourseId = cId ?? courseId;
    return (
      session.getProgressForCourse(targetCourseId).length === getAllLessons(targetCourseId).length
    );
  };

  const getOverallProgress = (): number => {
    const totalCompleted = session.progress.length;
    const totalLessons = getAllLessons().length;
    if (totalLessons === 0) return 0;
    return Math.round((totalCompleted / totalLessons) * 100);
  };

  return {
    progress,
    isLoading: session.isLoading,
    addLesson,
    getProgressPercentage,
    isLessonCompleted,
    getCompletedCount,
    getTotalCount,
    isFullyCompleted,
    getOverallProgress,
    getLastLessonId,
  };
};
