/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { workplacesApi } from '@/api/workplaces';
import type { Workplace } from '@/types/Workplace';

interface WorkplaceContextType {
  workplaces: Workplace[];
  activeWorkplace: Workplace | null;
  setActiveWorkplace: (workplace: Workplace | null) => void;
  refreshWorkplaces: () => Promise<void>;
  isLoading: boolean;
}

const WorkplaceContext = createContext<WorkplaceContextType | undefined>(undefined);

export const useWorkplace = () => {
  const context = useContext(WorkplaceContext);
  if (!context) throw new Error('useWorkplace must be used within a WorkplaceProvider');
  return context;
};

export const WorkplaceProvider = ({ children }: { children: ReactNode }) => {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [activeWorkplace, setActiveWorkplaceState] = useState<Workplace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveWorkplace = (workplace: Workplace | null) => {
    setActiveWorkplaceState(workplace);
    if (workplace) {
      localStorage.setItem('active_workplace_id', workplace.workplace_id.toString());
    } else {
      localStorage.removeItem('active_workplace_id');
    }
  };

  const refreshWorkplaces = async () => {
    setIsLoading(true);
    try {
      const data = await workplacesApi.getAll();
      setWorkplaces(data);

      const storedId = localStorage.getItem('active_workplace_id');
      
      if (data.length > 0) {
        const found = data.find((w) => w.workplace_id.toString() === storedId);
        setActiveWorkplaceState(found || data[0]);
      } else {
        setActiveWorkplaceState(null);
      }
    } catch (error) {
      console.error("Błąd pobierania placówek", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshWorkplaces();
  }, []);

  return (
    <WorkplaceContext.Provider value={{ workplaces, activeWorkplace, setActiveWorkplace, refreshWorkplaces, isLoading }}>
      {children}
    </WorkplaceContext.Provider>
  );
};