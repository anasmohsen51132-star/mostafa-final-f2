"use client";
// src/hooks/useCourses.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "./useAuth";
import { useToast } from "@/store/uiStore";
import type { Course, CourseForm } from "@/types";

export function useCourses() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["courses"],
    queryFn:  () => fetchWithAuth("/api/courses"),
  });

  const courses: (Course & { unlocked?: boolean })[] = data?.data ?? [];
  const myCourses   = courses.filter((c) => c.unlocked);
  const allCourses  = courses.filter((c) => c.isPublished);

  return { courses, myCourses, allCourses, isLoading, error };
}

export function useAdminCourses() {
  return useQuery({
    queryKey: ["admin-courses"],
    queryFn:  () => fetchWithAuth("/api/courses"),
    select:   (res) => (res?.data ?? []) as Course[],
  });
}

export function useCreateCourse() {
  const toast = useToast();
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CourseForm>) =>
      fetchWithAuth("/api/courses", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم إنشاء الكورس");
        qc.invalidateQueries({ queryKey: ["admin-courses"] });
        qc.invalidateQueries({ queryKey: ["courses"] });
      } else {
        toast.error(res.error ?? "فشل الإنشاء");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });
}

export function useUpdateCourse() {
  const toast = useToast();
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseForm> }) =>
      fetchWithAuth(`/api/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم تحديث الكورس");
        qc.invalidateQueries({ queryKey: ["admin-courses"] });
        qc.invalidateQueries({ queryKey: ["courses"] });
      } else {
        toast.error(res.error ?? "فشل التحديث");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });
}

export function useDeleteCourse() {
  const toast = useToast();
  const qc    = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/courses/${id}`, { method: "DELETE" }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم حذف الكورس");
        qc.invalidateQueries({ queryKey: ["admin-courses"] });
        qc.invalidateQueries({ queryKey: ["courses"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });
}
