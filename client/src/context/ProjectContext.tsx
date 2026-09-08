import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '../types';
import { projectsApi } from '../services/api';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsApi.list();
      setProjects(data);
      if (data.length > 0) {
        if (!selectedProject || !data.find((p) => p.id === selectedProject.id)) {
          setSelectedProject(data[0]);
        } else {
          // update current selected project reference
          const updated = data.find((p) => p.id === selectedProject.id);
          if (updated) setSelectedProject(updated);
        }
      } else {
        setSelectedProject(null);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, [user]);

  return (
    <ProjectContext.Provider value={{ projects, selectedProject, setSelectedProject, refreshProjects, loading }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within a ProjectProvider');
  return context;
};
