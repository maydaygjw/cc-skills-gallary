@echo off
REM Script to package the Mermaid Design skill
echo Packaging Mermaid Design Skill...

REM Create a zip archive of the skill directory
powershell Compress-Archive -Path "mermaid-design/*" -DestinationPath "mermaid-design.skill" -Force

echo.
echo Skill packaged as mermaid-design.skill
echo.
echo To install this skill in Claude Code, you would typically use:
echo claude-code install mermaid-design.skill
echo.
pause