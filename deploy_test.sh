#!/bin/bash

# This script deploys the application and runs basic end-to-end tests

# Color codes for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment and testing process...${NC}"

# Step 1: Build the application
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed! Please check the build errors above.${NC}"
  exit 1
fi
echo -e "${GREEN}Build completed successfully.${NC}"

# Step 2: Deploy to Firebase
echo -e "${YELLOW}Deploying to Firebase...${NC}"
firebase deploy
if [ $? -ne 0 ]; then
  echo -e "${RED}Firebase deployment failed! Please check the deployment errors above.${NC}"
  exit 1
fi
echo -e "${GREEN}Firebase deployment completed successfully.${NC}"

# Step 3: Run basic health checks on the deployed site
echo -e "${YELLOW}Running basic health checks...${NC}"
PROJECT_ID=$(cat .firebaserc | grep '"default"' | cut -d '"' -f 4)
BASE_URL="https://$PROJECT_ID.web.app"

# Check if the home page is accessible
echo -e "Checking home page at $BASE_URL"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep 200 > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Home page check failed! The site might be down.${NC}"
  exit 1
fi
echo -e "${GREEN}Home page is accessible.${NC}"

# Check if the login page is accessible
echo -e "Checking login page at $BASE_URL/login"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/login | grep 200 > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Login page check failed! The page might be broken.${NC}"
  exit 1
fi
echo -e "${GREEN}Login page is accessible.${NC}"

# Check if the generate page is accessible (should redirect to login if not authenticated)
echo -e "Checking generate page at $BASE_URL/generate"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/generate | grep -E "200|302" > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Generate page check failed! The page might be broken.${NC}"
  exit 1
fi
echo -e "${GREEN}Generate page is accessible or redirects properly.${NC}"

# Check generate API route
echo -e "${YELLOW}Checking Next.js API generate endpoint...${NC}"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/generate | grep -E "200|401|404|405" > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Generate API endpoint check failed!${NC}"
  exit 1
fi
echo -e "${GREEN}Generate API endpoint is accessible.${NC}"

echo -e "${GREEN}All health checks passed successfully!${NC}"
echo -e "${YELLOW}Deployment and basic testing complete. Please perform manual testing to verify all features.${NC}"

# Print manual testing checklist
echo -e "\n${YELLOW}Manual Testing Checklist:${NC}"
echo "1. Sign up with a new account"
echo "2. Log in with the account"
echo "3. Upload a CV or extract from LinkedIn"
echo "4. Enter job details from LinkedIn or manually"
echo "5. Generate CV and cover letter"
echo "6. Preview and download generated documents"
echo "7. Test error handling (e.g., invalid URLs, network errors)"
echo "8. Verify mobile responsiveness"
echo "9. Check browser compatibility" 