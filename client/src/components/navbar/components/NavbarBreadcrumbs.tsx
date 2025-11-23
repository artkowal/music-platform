import { Fragment, useEffect, useState } from "react";
import { useLocation, Link, matchPath } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useWorkplace } from "@/context/WorkplaceContext";
import { coursesApi } from "@/api/courses";
import { lessonsApi } from "@/api/lessons";
import type { Lesson } from "@/types/Lesson";

export function NavbarBreadcrumbs() {
  const location = useLocation();
  const { user } = useAuth();
  const { workplaces } = useWorkplace();
  const path = location.pathname;

  const [courseInfo, setCourseInfo] = useState<{ title: string, workplaceId?: number, workplaceName?: string } | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>("");

  const isTeacher = user?.role === "teacher";

  const courseMatch = matchPath("/dashboard/courses/:id/*", path) || matchPath("/dashboard/courses/:id", path);
  const courseId = courseMatch?.params.id;
  
  const lessonMatch = matchPath("/dashboard/courses/:courseId/lessons/:lessonId", path);
  const lessonId = lessonMatch?.params.lessonId;

  useEffect(() => {
    if (courseId) {
        coursesApi.getDetails(courseId)
            .then(res => {
                setCourseInfo({
                    title: res.course.title,
                    workplaceId: res.course.workplace_id,
                    workplaceName: res.course.workplace_name
                });
            })
            .catch(() => setCourseInfo(null));

        if (lessonId) {
             lessonsApi.getByCourseId(courseId)
                .then((lessons: Lesson[]) => {
                    const found = lessons.find(l => l.lesson_id === Number(lessonId));
                    setLessonTitle(found?.title || "Lekcja");
                })
                .catch(() => setLessonTitle("Lekcja"));
        } else {
            setLessonTitle("");
        }
    } else {
        setCourseInfo(null);
        setLessonTitle("");
    }
  }, [courseId, lessonId]);

  const getCrumbs = () => {
    const crumbs: { label: string; to?: string }[] = [];

    // 1. ROOT
    crumbs.push({ label: "Pulpit", to: "/dashboard" });

    // --- SCENARIUSZ 1: Jesteśmy w Placówce ---
    if (path === "/dashboard/workplaces") {
      crumbs.push({ label: "Zarządzaj placówkami" });
    }
    else if (matchPath("/dashboard/workplace/:id", path)) {
      const match = matchPath("/dashboard/workplace/:id", path);
      const wpId = match?.params.id;
      const workplace = workplaces.find(w => w.workplace_id.toString() === wpId);
      
      crumbs.push({ label: workplace ? workplace.name : "Placówka" });
    }

    // --- SCENARIUSZ 2: Jesteśmy w Kursie (lub liście kursów) ---
    else if (path.startsWith("/dashboard/courses")) {
        
        if (path === "/dashboard/courses") {
            crumbs.push({ label: isTeacher ? "Wszystkie kursy" : "Moje kursy" });
        } 
        
        else if (courseId && courseInfo) {
            
            if (isTeacher && courseInfo.workplaceId && courseInfo.workplaceName) {
                crumbs.push({ 
                    label: courseInfo.workplaceName, 
                    to: `/dashboard/workplace/${courseInfo.workplaceId}` 
                });
            } else {
                crumbs.push({ 
                    label: isTeacher ? "Wszystkie kursy" : "Moje kursy", 
                    to: "/dashboard/courses" 
                });
            }

            const isCourseRoot = path === `/dashboard/courses/${courseId}`;
            crumbs.push({ 
                label: courseInfo.title, 
                to: isCourseRoot ? undefined : `/dashboard/courses/${courseId}` 
            });

            if (path.endsWith("/settings")) {
                crumbs.push({ label: "Ustawienia kursu" });
            } 
            else if (lessonId) {
                crumbs.push({ label: lessonTitle });
            }
        }
    }

    else if (path.endsWith("/settings")) {
      crumbs.push({ label: "Ustawienia konta" });
    } else if (path.endsWith("/about")) {
      crumbs.push({ label: "O Projekcie" });
    } else if (path.endsWith("/students")) {
      crumbs.push({ label: "Uczniowie" });
    } else if (path.endsWith("/calendar")) {
      crumbs.push({ label: "Kalendarz" });
    }

    return crumbs;
  };

  const crumbs = getCrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={index}>
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem className="hidden md:block">
                {isLast || !crumb.to ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}