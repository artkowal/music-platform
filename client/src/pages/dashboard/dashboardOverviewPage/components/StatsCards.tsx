import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, GraduationCap } from "lucide-react";

interface Props {
    stats: {
        coursesCount: number;
        studentsCount?: number;
    };
    isTeacher: boolean;
}

export function StatsCards({ stats, isTeacher }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
                <div>
                    <div className="text-2xl font-bold">{stats.coursesCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {isTeacher ? "Twoje aktywne kursy" : "Kursy na które uczęszczasz"}
                    </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200">
                    {isTeacher ? <Briefcase className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                </div>
            </CardContent>
        </Card>
        
        {isTeacher && (
            <Card>
                <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
                    <div>
                        <div className="text-2xl font-bold">{stats.studentsCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Unikalnych uczniów</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-200">
                        <Users className="h-5 w-5" />
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}