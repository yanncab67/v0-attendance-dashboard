"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AppData, JourData, Typologie } from "./types";

interface DataContextType {
  data: AppData;
  isLoading: boolean;
  saveJour: (jour: JourData) => Promise<void>;
  deleteJour: (date: string) => Promise<void>;
  addTypologie: (typologie: Omit<Typologie, "id" | "ordre">) => Promise<void>;
  updateTypologie: (typologie: Typologie) => Promise<void>;
  deleteTypologie: (id: string) => Promise<void>;
  reorderTypologies: (typologies: Typologie[]) => Promise<void>;
  exportToJson: () => string;
  importFromJson: (json: string) => Promise<boolean>;
  resetData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    jours: [],
    typologies: [],
    version: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/data");
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const apiCall = useCallback(async (action: string, data: any) => {
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error(`Error with ${action}:`, error);
      throw error;
    }
  }, []);

  const saveJour = useCallback(
    async (jour: JourData) => {
      await apiCall("saveJour", jour);
    },
    [apiCall],
  );

  const deleteJour = useCallback(
    async (date: string) => {
      await apiCall("deleteJour", date);
    },
    [apiCall],
  );

  const addTypologie = useCallback(
    async (typologie: Omit<Typologie, "id" | "ordre">) => {
      await apiCall("addTypologie", typologie);
    },
    [apiCall],
  );

  const updateTypologie = useCallback(
    async (typologie: Typologie) => {
      await apiCall("updateTypologie", typologie);
    },
    [apiCall],
  );

  const deleteTypologieHandler = useCallback(
    async (id: string) => {
      await apiCall("deleteTypologie", id);
    },
    [apiCall],
  );

  const reorderTypologies = useCallback(
    async (typologies: Typologie[]) => {
      await apiCall("reorderTypologies", typologies);
    },
    [apiCall],
  );

  const exportToJson = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importFromJson = useCallback(
    async (json: string) => {
      try {
        const importedData = JSON.parse(json) as AppData;
        await apiCall("importData", importedData);
        return true;
      } catch {
        return false;
      }
    },
    [apiCall],
  );

  const resetData = useCallback(async () => {
    await apiCall("importData", {
      jours: [],
      typologies: [],
      version: 1,
    });
    await fetchData();
  }, [apiCall, fetchData]);

  const clearAllData = useCallback(async () => {
    await apiCall("importData", {
      jours: [],
      typologies: [],
      version: 1,
    });
  }, [apiCall]);

  return (
    <DataContext.Provider
      value={{
        data,
        isLoading,
        saveJour,
        deleteJour,
        addTypologie,
        updateTypologie,
        deleteTypologie: deleteTypologieHandler,
        reorderTypologies,
        exportToJson,
        importFromJson,
        resetData,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
