import { useEffect, useState } from "react";
import { useWorkplace } from "@/context/WorkplaceContext";
import { useAuth } from "@/hooks/useAuth";
import { RecentActivity } from "./components/RecentActivity";
import { WeeklySchedule } from "./components/WeeklySchedule";
import { DashboardClock } from "./components/DashboardClock"; 
import { StatsCards } from "./components/StatsCards";
import { LessonsToComplete } from "./components/LessonsToComplete";
import { DashboardOverviewHeader } from "./components/DashboardOverviewHeader";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardData } from "@/types/Dashboard";

export default function DashboardOverviewPage() {
  const { setActiveWorkplace } = useWorkplace();
  const { user } = useAuth();
  
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

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Ładowanie pulpitu...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      <DashboardOverviewHeader user={user} />

      <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-8">
        
        {/* SEKCJA GÓRNA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                {data && <StatsCards stats={data.stats} isTeacher={isTeacher} />}
            </div>
            
            <div className="lg:col-span-1 h-full">
                <DashboardClock />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEWA STRONA */}
            <div className="lg:col-span-2 space-y-6 h-full">
               {data && <WeeklySchedule meetings={data.upcomingMeetings} />}
            </div>

            {/* PRAWA STRONA */}
            <div className="lg:col-span-1 space-y-6 h-full min-h-[400px]">
               {isTeacher ? (
                   <RecentActivity />
               ) : (
                   data?.lessonsToComplete && (
                      <LessonsToComplete lessons={data.lessonsToComplete} />
                   )
               )}
            </div>
            
        </div>
      </div>
    </div>
  );
}