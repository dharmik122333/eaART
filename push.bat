@echo off
title Push Project EARTH to GitHub
echo ==================================================
echo [Project EARTH] Initializing Repository and Pushing
echo ==================================================
echo.

:: Initialize Git
echo 1. Initializing Git...
git init

:: Add files
echo 2. Staging files...
git add .

:: Commit
echo 3. Creating commit...
git commit -m "Initial Commit: Project EARTH MERN Ecosystem"

:: Setup branch
echo 4. Setting branch to main...
git branch -M main

:: Add remote URL
echo 5. Linking remote origin to eaART...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/dharmik122333/eaART.git

:: Push to remote
echo 6. Pushing to GitHub (this may open a credentials prompt)...
git push -u origin main

echo.
echo ==================================================
echo Process complete. Check your repository:
echo https://github.com/dharmik122333/eaART
echo ==================================================
echo.
pause
