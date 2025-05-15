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
  
  // Request all necessary scopes for profile, email, and positions
  const scopes = [
    'r_liteprofile',      // Basic profile
    'r_emailaddress',     // Email address
    'r_basicprofile',     // Extended profile info
  ];
  const scope = encodeURIComponent(scopes.join(' '));
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
    
    // Try to get email address if we have permission
    let emailResponse;
    try {
      emailResponse = await axios.get(`${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.log('Unable to fetch email - likely not authorized in the app settings');
      emailResponse = { data: { elements: [] } };
    }
    
    // Get profile picture
    let pictureResponse;
    try {
      pictureResponse = await axios.get(
        `${LINKEDIN_API_URL}/me?projection=(profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.log('Unable to fetch profile picture');
      pictureResponse = { data: { profilePicture: null } };
    }
    
    // Get positions (experience)
    let positionsResponse;
    try {
      positionsResponse = await axios.get(
        `${LINKEDIN_API_URL}/positions?q=members&projection=(elements*(companyName,title,startDate,endDate,description))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.log('Unable to fetch positions');
      positionsResponse = { data: { elements: [] } };
    }
    
    // Get education
    let educationResponse;
    try {
      educationResponse = await axios.get(
        `${LINKEDIN_API_URL}/educations?q=members&projection=(elements*(schoolName,degreeName,fieldOfStudy,startDate,endDate,activities,notes))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.log('Unable to fetch education');
      educationResponse = { data: { elements: [] } };
    }
    
    // Get skills
    let skillsResponse;
    try {
      skillsResponse = await axios.get(
        `${LINKEDIN_API_URL}/skills?q=members&projection=(elements*(name))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.log('Unable to fetch skills');
      skillsResponse = { data: { elements: [] } };
    }
    
    // Handle fields that might be missing or in different formats
    // Get the localized fields with fallbacks for different formats and missing data
    const getLocalizedField = (field: any, defaultValue = '') => {
      if (!field) return defaultValue;
      // Handle both old and new LinkedIn API response formats
      if (field.localized?.en_US) return field.localized.en_US;
      if (field.localized?.['en_US']) return field.localized['en_US'];
      if (typeof field === 'string') return field;
      return defaultValue;
    };
    
    // Combine all data with safe fallbacks
    const profile: LinkedInProfile = {
      id: profileResponse.data.id || '',
      firstName: getLocalizedField(profileResponse.data.firstName, 'Unknown'),
      lastName: getLocalizedField(profileResponse.data.lastName, 'User'),
      email: emailResponse.data.elements?.[0]?.['handle~']?.emailAddress || null,
      headline: getLocalizedField(profileResponse.data.headline),
      profilePicture: pictureResponse.data.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || null,
      positions: positionsResponse.data.elements?.map((position: any) => ({
        companyName: getLocalizedField(position.companyName, position.company || 'Unknown Company'),
        title: getLocalizedField(position.title, 'Position'),
        startDate: position.startDate || { month: 1, year: new Date().getFullYear() },
        endDate: position.endDate,
        description: getLocalizedField(position.description),
        locationName: getLocalizedField(position.locationName),
      })) || [],
      educations: educationResponse.data.elements?.map((education: any) => ({
        schoolName: getLocalizedField(education.schoolName, 'Unknown Institution'),
        degreeName: getLocalizedField(education.degreeName),
        fieldOfStudy: getLocalizedField(education.fieldOfStudy),
        startDate: education.startDate,
        endDate: education.endDate,
        activities: getLocalizedField(education.activities),
        notes: getLocalizedField(education.notes),
      })) || [],
      skills: skillsResponse.data.elements?.map((skill: any) => 
        getLocalizedField(skill.name, skill.skill || 'Skill')
      ) || [],
    };
    
    return profile;
  } catch (error) {
    console.error('Error fetching LinkedIn profile data:', error);
    throw new Error('Failed to fetch LinkedIn profile data');
  }
}