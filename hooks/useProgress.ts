'use client';

import { useState, useEffect } from 'react';
import {
  getProgress,
  addToProgress as addProgress,
  setLastLesson,
  getLastLesson,
  getAllProgress
} from '@/lib/storage';
import { getAllLessons } from '@/lib/courseData';

export const useProgress = (courseId: string = 'brow-master-pro') => {
  const [progress, setProgressState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentProgress = getProgress(courseId);
    setProgressState(currentProgress);
    setIsLoading(false);
  }, [courseId]);

  const addLesson = (lessonId: string, cId?: string): void => {
    const targetCourseId = cId || courseId;
    addProgress(lessonId, targetCourseId);
    setProgressState(getProgress(targetCourseId));
    setLastLesson(lessonId, targetCourseId);
  };

  const getLastLessonId = (cId?: string): string | null => {
    const targetCourseId = cId || courseId;
    return getLastLesson(targetCourseId);
  };

  const getProgressPercentage = (cId?: string): number => {
    const targetCourseId = cId || courseId;
    const totalLessons = getAllLessons(targetCourseId).length;
    if (totalLessons === 0) return 0;
    const courseProgress = getProgress(targetCourseId);
    return Math.round((courseProgress.length / totalLessons) * 100);
  };

  const isLessonCompleted = (lessonId: string, cId?: string): boolean => {
    const targetCourseId = cId || courseId;
    const courseProgress = getProgress(targetCourseId);
    return courseProgress.includes(lessonId);
  };

  const getCompletedCount = (cId?: string): number => {
    const targetCourseId = cId || courseId;
    return getProgress(targetCourseId).length;
  };

  const getTotalCount = (cId?: string): number => {
    const targetCourseId = cId || courseId;
    return getAllLessons(targetCourseId).length;
  };

  const isFullyCompleted = (cId?: string): boolean => {
    const targetCourseId = cId || courseId;
    return getProgress(targetCourseId).length === getAllLessons(targetCourseId).length;
  };

  // Получить общий прогресс по всем курсам
  const getOverallProgress = (): number => {
    const allProgress = getAllProgress();
    const totalCompleted = Object.values(allProgress).flat().length;
    const totalLessons = getAllLessons().length;
    if (totalLessons === 0) return 0;
    return Math.round((totalCompleted / totalLessons) * 100);
  };

  return {
    progress,
    isLoading,
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
