import { useState, useEffect } from "react";
import { financesApi, type WorkplaceStats } from "@/api/finances";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, Wallet, CalendarDays } from "lucide-react";
import { WorkplaceDetailsDialog } from "../../../components/dialogs/WorkplaceDetailsDialog";
import { FinancesHeader } from "./components/FinancesHeader";

export default function DashboardFinancesPage() {
  const [stats, setStats] = useState<WorkplaceStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedWorkplace, setSelectedWorkplace] = useState<WorkplaceStats | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await financesApi.getMonthlyStats(Number(selectedMonth), Number(selectedYear));
        setStats(data);
      } catch (error) {
        console.error("Błąd pobierania finansów", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const calculateWorkplaceTotal = (wp: WorkplaceStats) => {
    const amount = Number(wp.payment_amount);
    if (isNaN(amount)) return 0;
    if (wp.payment_type === 'monthly') return amount;
    if (wp.payment_type === 'per_lesson') return amount * wp.completed_count;
    return 0;
  };

  const totalIncome = stats.reduce((sum, wp) => sum + calculateWorkplaceTotal(wp), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
  };

  const handleOpenDetails = (wp: WorkplaceStats) => {
      setSelectedWorkplace(wp);
      setDetailsOpen(true);
  };

  return (
    <div className="relative min-h-screen pb-20 animate-in fade-in duration-500">
        
        <FinancesHeader 
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            years={years}
        />

        <div className="space-y-8 max-w-6xl mx-auto px-2 md:px-0">
        
            {loading ? (
                <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : stats.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-xl bg-muted/10">
                <p className="text-muted-foreground">Nie masz zdefiniowanych żadnych placówek.</p>
                <Button variant="link" onClick={() => window.location.href='/dashboard/workplaces'}>
                    Dodaj placówkę w ustawieniach
                </Button>
                </div>
            ) : (
                <div className="grid gap-6">
                {stats.map((wp) => {
                    const wpTotal = calculateWorkplaceTotal(wp);
                    const isPaid = wp.payment_type !== 'none';

                    return (
                    <Card key={wp.workplace_id} className="overflow-hidden border-l-4" style={{ borderLeftColor: wp.color_hex }}>
                        <CardHeader className="bg-muted/20 pb-4 relative pr-14 md:pr-6">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-3 right-3 md:hidden text-muted-foreground hover:bg-background/50"
                                onClick={() => handleOpenDetails(wp)}
                            >
                                <CalendarDays className="h-5 w-5" />
                            </Button>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                <div 
                                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shrink-0"
                                    style={{ backgroundColor: wp.color_hex }}
                                >
                                    {wp.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="leading-tight">{wp.name}</CardTitle>
                                    <CardDescription className="flex flex-wrap items-center gap-2 mt-0.5">
                                    <span className="capitalize text-xs sm:text-sm">
                                        {wp.payment_type === 'none' && 'Wolontariat'}
                                        {wp.payment_type === 'monthly' && 'Stała pensja'}
                                        {wp.payment_type === 'per_lesson' && 'Płatność za lekcję'}
                                    </span>
                                    {isPaid && wp.payment_type === 'per_lesson' && (
                                        <Badge variant="outline" className="text-[10px] h-5">
                                        {Number(wp.payment_amount)} PLN / lekcja
                                        </Badge>
                                    )}
                                    </CardDescription>
                                </div>
                                </div>

                                <div className="flex items-center gap-6 mt-1 md:mt-0">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-muted-foreground hover:text-foreground gap-2 hidden md:flex"
                                        onClick={() => handleOpenDetails(wp)}
                                    >
                                        <CalendarDays className="h-4 w-4" /> Szczegóły
                                    </Button>

                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
                                        <CheckCircle2 className="h-4 w-4" /> Odbyte
                                    </div>
                                    <div className="text-2xl font-bold">{wp.completed_count}</div>
                                    <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                                        <span>Online: <b>{wp.online_count}</b></span>
                                        <span>Stacjonarne: <b>{wp.stationary_count}</b></span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50">
                                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium text-sm">
                                        <Clock className="h-4 w-4" /> Oczekujące
                                    </div>
                                    <div className="text-2xl font-bold">{wp.pending_count}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Do potwierdzenia</p>
                                </div>

                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm">
                                        <XCircle className="h-4 w-4" /> Odwołane
                                    </div>
                                    <div className="text-2xl font-bold">{wp.cancelled_count}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Brak płatności</p>
                                </div>

                                {isPaid ? (
                                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium text-sm">
                                            <Wallet className="h-4 w-4" /> 
                                            {wp.payment_type === 'monthly' ? 'Pensja stała' : 'Należność'}
                                        </div>
                                        <div className="text-lg font-bold truncate" title={formatCurrency(wpTotal)}>
                                            {formatCurrency(wpTotal)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {wp.payment_type === 'monthly' ? 'Stała kwota' : `Za ${wp.completed_count} lekcji`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-dashed">
                                        <span className="text-sm text-muted-foreground italic">Wolontariat</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    );
                })}
                </div>
            )}
        </div>

        {/* STICKY SUMMARY */}
        {!loading && stats.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="bg-background/95 backdrop-blur-sm shadow-xl border rounded-full px-5 py-2 flex items-center gap-4 transition-all hover:scale-105 hover:shadow-2xl">
                    <div className="flex items-center justify-center bg-primary/10 p-2 rounded-full shrink-0">
                        <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                            Razem {selectedMonth}/{selectedYear}:
                        </span>
                        <span className="text-lg font-bold text-foreground tabular-nums leading-none">
                            {formatCurrency(totalIncome)}
                        </span>
                    </div>
                </div>
            </div>
        )}

        <WorkplaceDetailsDialog 
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            workplace={selectedWorkplace}
            month={Number(selectedMonth)}
            year={Number(selectedYear)}
        />
    </div>
  );
}