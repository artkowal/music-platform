import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkplace } from "@/context/WorkplaceContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { RecentActivity } from "./components/RecentActivity";
import { UpcomingMeetings } from "./components/UpcomingMeetings";
import { StatsCards } from "./components/StatsCards";
import { LessonsToComplete } from "./components/LessonsToComplete";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardData } from "@/types/Dashboard";

export default function DashboardOverviewPage() {
  const { setActiveWorkplace } = useWorkplace();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    setActiveWorkplace(null);
    
    const fetchData = async () => {
        try {
            const result = await dashboardApi.getData();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="p-8">Ładowanie pulpitu...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Przegląd</h2>
            <p className="text-muted-foreground">
                Cześć {user?.first_name}! Oto co się dzieje w Twojej muzyce.
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/calendar')}>
                <Calendar className="mr-2 h-4 w-4"/> Otwórz Kalendarz
            </Button>
        </div>
      </div>

      {data && <StatsCards stats={data.stats} isTeacher={isTeacher} />}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          
          <div className="col-span-1 flex flex-col gap-6">
             {data && <UpcomingMeetings meetings={data.upcomingMeetings} />}
          </div>

          <div className="col-span-1 flex flex-col gap-6">
             {!isTeacher && data?.lessonsToComplete && (
                <LessonsToComplete lessons={data.lessonsToComplete} />
             )}
             
             <RecentActivity />
          </div>
          
      </div>
    </div>
  );
}