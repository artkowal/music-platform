import { useEffect, useState } from "react";
import { useWorkplace } from "@/context/WorkplaceContext";
import { useAuth } from "@/hooks/useAuth";
import { RecentActivity } from "./components/RecentActivity";
import { UpcomingMeetings } from "./components/UpcomingMeetings";
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

  if (loading) return <div className="p-8">Ładowanie pulpitu...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      <DashboardOverviewHeader user={user} />

      <div className="max-w-7xl mx-auto space-y-8 px-2 md:px-0">
        
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
    </div>
  );
}