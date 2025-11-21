import { Fragment } from "react";
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

export function NavbarBreadcrumbs() {
  const location = useLocation();
  const { user } = useAuth();
  const { workplaces } = useWorkplace();
  const path = location.pathname;

  const isTeacher = user?.role === "teacher";
  const rootLabel = isTeacher ? "Panel Nauczyciela" : "Panel Ucznia";

  // Generowanie crumbów
  const getCrumbs = () => {
    const crumbs: { label: string; to?: string }[] = [];

    crumbs.push({ label: rootLabel, to: "/dashboard" });

    // Przegląd (Dashboard Root)
    if (path === "/dashboard") {
      crumbs.push({ label: "Przegląd" });
    }
    
    // Zarządzanie placówkami
    else if (path === "/dashboard/workplaces") {
      crumbs.push({ label: "Zarządzaj placówkami" });
    }

    // Konkretna placówka (/dashboard/workplace/:id)
    else if (matchPath("/dashboard/workplace/:id", path)) {
      const match = matchPath("/dashboard/workplace/:id", path);
      const workplaceId = match?.params.id;
      
      // Nazwa w kontekście
      const workplace = workplaces.find(w => w.workplace_id.toString() === workplaceId);
      const workplaceName = workplace ? workplace.name : "Placówka";

      crumbs.push({ label: workplaceName });
    }

    // Wszystkie kursy 
    else if (path === "/dashboard/courses") {
      crumbs.push({ label: isTeacher ? "Wszystkie kursy" : "Moje kursy" });
    }

    // Ustawienia konkretnego kursu
    else if (matchPath("/dashboard/courses/:id/settings", path)) {
      crumbs.push({ label: isTeacher ? "Wszystkie kursy" : "Moje kursy", to: "/dashboard/courses" });
      crumbs.push({ label: "Ustawienia kursu" });
    }

    // Inne trasy
    else if (path.endsWith("/settings")) {
      crumbs.push({ label: "Ustawienia" });
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