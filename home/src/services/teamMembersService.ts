import { User } from '../types';
import { getCurrentUserProfile, getTeamMembersForUser } from '../data/mockData';
 import axios from 'axios';
 const API_BASE_URL = '';
const TEAM_MEMBERS_CACHE_KEY = 'team_members_cache';
const CACHE_DURATION = 5 * 60 * 1000;

interface CachedData {
  members: User[];
  timestamp: number;
}



// PHP Backend Integration (commented out)


 export const teamMembersService = {
   async getAllMembers(): Promise<User[]> {
     try {
       // Check cache first
       const cached = localStorage.getItem(TEAM_MEMBERS_CACHE_KEY);

       if (cached) {
         const data: CachedData = JSON.parse(cached);
         if (Date.now() - data.timestamp < CACHE_DURATION) {
           return data.members;
         }
       }

       // Fetch from backend
       const response = await axios.get(
         `${API_BASE_URL}/data/all-team-members.php`,
         {
           withCredentials: true,
           headers: {
             'Content-Type': 'application/json',
           },
         }
       );

       if (response.data.success) {
         const members = response.data.teamMembers.map((member: any) => ({
           id: member.id.toString(),
           name: member.name,
           email: member.email,
           initials: member.initials || member.name.split(' ').map((n: string) => n[0]).join(''),
           avatar: member.avatar,
         }));

         // Cache the results
         this.cacheMembers(members);

         return members;
       }

       // Fallback to mock data
       const currentUser = getCurrentUserProfile();
       const teamMembers = getTeamMembersForUser();
       return [currentUser, ...teamMembers];
     } catch (error) {
       console.error('Error fetching team members from PHP backend:', error);
       // Fallback to mock data
       const currentUser = getCurrentUserProfile();
       const teamMembers = getTeamMembersForUser();
       return [currentUser, ...teamMembers];
     }
   },

   cacheMembers(members: User[]): void {
     try {
       const data: CachedData = {
         members,
         timestamp: Date.now(),
       };
       localStorage.setItem(TEAM_MEMBERS_CACHE_KEY, JSON.stringify(data));
     } catch (error) {
       console.error('Error caching team members:', error);
     }
   },

   clearCache(): void {
     try {
       localStorage.removeItem(TEAM_MEMBERS_CACHE_KEY);
     } catch (error) {
       console.error('Error clearing team members cache:', error);
     }
   },
 };