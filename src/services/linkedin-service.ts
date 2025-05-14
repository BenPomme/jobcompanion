// LinkedIn API integration
// Note: LinkedIn's API v2 requires OAuth 2.0 authentication

import axios from 'axios';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  email?: string;
  headline?: string;
  positions?: LinkedInPosition[];
  educations?: LinkedInEducation[];
  skills?: string[];
}

export interface LinkedInPosition {
  companyName: string;
  title: string;
  startDate: {
    month: number;
    year: number;
  };
  endDate?: {
    month: number;
    year: number;
  };
  description?: string;
  locationName?: string;
}

export interface LinkedInEducation {
  schoolName: string;
  degreeName?: string;
  fieldOfStudy?: string;
  startDate?: {
    month?: number;
    year: number;
  };
  endDate?: {
    month?: number;
    year: number;
  };
  activities?: string;
  notes?: string;
}

export async function getLinkedInAuthUrl() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('LinkedIn client ID or redirect URI not configured');
  }
  
  const scope = encodeURIComponent('r_liteprofile r_emailaddress');
  const state = Math.random().toString(36).substring(2);
  
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
}

export async function getAccessToken(authorizationCode: string): Promise<string> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('LinkedIn credentials not configured');
  }
  
  try {
    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting LinkedIn access token:', error);
    throw new Error('Failed to get LinkedIn access token');
  }
}

export async function getProfileData(accessToken: string): Promise<LinkedInProfile> {
  try {
    // Get basic profile data
    const profileResponse = await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // Get email address
    const emailResponse = await axios.get(`${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // Get profile picture
    const pictureResponse = await axios.get(
      `${LINKEDIN_API_URL}/me?projection=(profilePicture(displayImage~:playableStreams))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    // Get positions (experience)
    const positionsResponse = await axios.get(
      `${LINKEDIN_API_URL}/positions?q=members&projection=(elements*(companyName,title,startDate,endDate,description))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    // Get education
    const educationResponse = await axios.get(
      `${LINKEDIN_API_URL}/educations?q=members&projection=(elements*(schoolName,degreeName,fieldOfStudy,startDate,endDate,activities,notes))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    // Get skills
    const skillsResponse = await axios.get(
      `${LINKEDIN_API_URL}/skills?q=members&projection=(elements*(name))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    // Combine all data
    const profile: LinkedInProfile = {
      id: profileResponse.data.id,
      firstName: profileResponse.data.firstName.localized.en_US,
      lastName: profileResponse.data.lastName.localized.en_US,
      email: emailResponse.data.elements[0]['handle~'].emailAddress,
      headline: profileResponse.data.headline?.localized.en_US,
      profilePicture:
        pictureResponse.data.profilePicture?.displayImage?.elements[0]?.identifiers[0]?.identifier,
      positions: positionsResponse.data.elements.map((position: any) => ({
        companyName: position.companyName.localized.en_US,
        title: position.title.localized.en_US,
        startDate: position.startDate,
        endDate: position.endDate,
        description: position.description?.localized.en_US,
      })),
      educations: educationResponse.data.elements.map((education: any) => ({
        schoolName: education.schoolName.localized.en_US,
        degreeName: education.degreeName?.localized.en_US,
        fieldOfStudy: education.fieldOfStudy?.localized.en_US,
        startDate: education.startDate,
        endDate: education.endDate,
        activities: education.activities?.localized.en_US,
        notes: education.notes?.localized.en_US,
      })),
      skills: skillsResponse.data.elements.map((skill: any) => skill.name.localized.en_US),
    };
    
    return profile;
  } catch (error) {
    console.error('Error fetching LinkedIn profile data:', error);
    throw new Error('Failed to fetch LinkedIn profile data');
  }
}