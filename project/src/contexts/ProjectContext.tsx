
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, User } from '../types';
import { currentProject as defaultProject, teamMembers as defaultMembers, fetchProjectData, getProjectIdFromUrl } from '../data/appConfig';

interface ProjectContextType {
    project: Project;
    teamMembers: User[];
    loading: boolean;
    projectFound: boolean;
    isMock: boolean;
    refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [project, setProject] = useState<Project>(defaultProject);
    const [teamMembers, setTeamMembers] = useState<User[]>(defaultMembers);
    const [loading, setLoading] = useState(true);
    const [projectFound, setProjectFound] = useState(false);
    const [isMock, setIsMock] = useState(true);

    const refreshProject = async () => {
        setLoading(true);
        const projectId = getProjectIdFromUrl();

        if (!projectId) {
            setProject(defaultProject);
            setTeamMembers(defaultMembers);
            setProjectFound(false);
            setIsMock(true);
            setLoading(false);
            return;
        }

        try {
            // This part is now active to check for the project
            const data = await fetchProjectData(projectId);
            if (data) {
                setProject(data.project);
                setTeamMembers(data.members);
                setProjectFound(true);
                setIsMock(false);
            } else {
                setProject(defaultProject);
                setTeamMembers(defaultMembers);
                setProjectFound(false);
                setIsMock(true);
            }
        } catch (error) {
            console.error("Failed to fetch project", error);
            setProject(defaultProject);
            setTeamMembers(defaultMembers);
            setProjectFound(false);
            setIsMock(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProject();
    }, []);

    return (
        <ProjectContext.Provider value={{ project, teamMembers, loading, projectFound, isMock, refreshProject }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
