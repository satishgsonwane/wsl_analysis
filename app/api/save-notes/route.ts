import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const { notes, videoTime = 0 } = await request.json();
    console.log("Received notes in API:", notes); // Debug log
    
    if (!notes) {
      return NextResponse.json(
        { error: "Missing notes content" },
        { status: 400 }
      );
    }

    // Create base directory path
    const baseDir = path.join(process.cwd(), "public", "captures");
    console.log("Saving to directory:", baseDir); // Debug log
    
    // Ensure the directory exists
    await mkdir(baseDir, { recursive: true });
    
    // Create filenames with path
    const textFilePath = path.join(baseDir, "notes.txt");
    const srtFilePath = path.join(baseDir, "notes.srt");
    console.log("File paths:", textFilePath, srtFilePath); // Debug log
    
    // Check if text file exists and read existing content
    let existingContent = "";
    try {
      existingContent = await fs.readFile(textFilePath, "utf-8");
      existingContent += "\n\n---\n\n"; // Add separator between existing and new notes
    } catch (error) {
      console.log("No existing notes file found, creating new one"); // Debug log
    }
    
    // Append timestamp to notes
    const timestamp = new Date().toISOString();
    
    // Format notes as a checklist with timestamp for text file
    let formattedNotes = `[${timestamp}]\n`;
    
    // Split notes by newline if it's a string
    const noteLines = typeof notes === 'string' ? notes.split('\n') : [notes];
    console.log("Note lines:", noteLines); // Debug log
    
    // Add each note as a checklist item
    noteLines.forEach((note: string, index: number) => {
      if (note.trim()) {
        formattedNotes += `- ${note.trim()}\n`;
      }
    });
    
    console.log("Formatted notes to save:", formattedNotes); // Debug log
    
    // Write the text file with existing content + new notes
    await writeFile(textFilePath, existingContent + formattedNotes);
    console.log("Notes saved successfully to text file"); // Debug log
    
    // Now create or update the SRT file
    // Read existing SRT content to determine the next subtitle number
    let existingSrtContent = "";
    let nextSubtitleNumber = 1;
    
    try {
      existingSrtContent = await fs.readFile(srtFilePath, "utf-8");
      
      // Find the last subtitle number in the existing file
      const lastNumberMatch = existingSrtContent.match(/(\d+)(?!.*\d)/);
      if (lastNumberMatch) {
        nextSubtitleNumber = parseInt(lastNumberMatch[0], 10) + 1;
      }
    } catch (error) {
      console.log("No existing SRT file found, creating new one"); // Debug log
    }
    
    // Format the timestamp for SRT based on video time
    const videoSeconds = Math.floor(videoTime);
    const videoMilliseconds = Math.floor((videoTime - videoSeconds) * 1000);
    
    // Calculate hours, minutes, seconds from total seconds
    const hours = Math.floor(videoSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((videoSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (videoSeconds % 60).toString().padStart(2, '0');
    const milliseconds = videoMilliseconds.toString().padStart(3, '0');
    
    let startTime = `${hours}:${minutes}:${seconds},${milliseconds}`;
    
    // Add 5 seconds for the end time
    const endVideoTime = videoTime + 5;
    const endVideoSeconds = Math.floor(endVideoTime);
    const endVideoMilliseconds = Math.floor((endVideoTime - endVideoSeconds) * 1000);
    
    const endHours = Math.floor(endVideoSeconds / 3600).toString().padStart(2, '0');
    const endMinutes = Math.floor((endVideoSeconds % 3600) / 60).toString().padStart(2, '0');
    const endSeconds = (endVideoSeconds % 60).toString().padStart(2, '0');
    const endMilliseconds = endVideoMilliseconds.toString().padStart(3, '0');
    
    let endTime = `${endHours}:${endMinutes}:${endSeconds},${endMilliseconds}`;
    
    // Create SRT formatted content for each note
    let srtContent = "";
    let currentVideoTime = videoTime;

    noteLines.forEach((note: string, index: number) => {
      if (note.trim()) {
        // Calculate start time for this subtitle
        const startVideoSeconds = Math.floor(currentVideoTime);
        const startVideoMilliseconds = Math.floor((currentVideoTime - startVideoSeconds) * 1000);
        
        const startHours = Math.floor(startVideoSeconds / 3600).toString().padStart(2, '0');
        const startMinutes = Math.floor((startVideoSeconds % 3600) / 60).toString().padStart(2, '0');
        const startSeconds = (startVideoSeconds % 60).toString().padStart(2, '0');
        const startMilliseconds = startVideoMilliseconds.toString().padStart(3, '0');
        
        const startTimeStr = `${startHours}:${startMinutes}:${startSeconds},${startMilliseconds}`;
        
        // Calculate end time (5 seconds after start)
        const endVideoTime = currentVideoTime + 5;
        const endVideoSeconds = Math.floor(endVideoTime);
        const endVideoMilliseconds = Math.floor((endVideoTime - endVideoSeconds) * 1000);
        
        const endHours = Math.floor(endVideoSeconds / 3600).toString().padStart(2, '0');
        const endMinutes = Math.floor((endVideoSeconds % 3600) / 60).toString().padStart(2, '0');
        const endSeconds = (endVideoSeconds % 60).toString().padStart(2, '0');
        const endMilliseconds = endVideoMilliseconds.toString().padStart(3, '0');
        
        const endTimeStr = `${endHours}:${endMinutes}:${endSeconds},${endMilliseconds}`;
        
        // Add subtitle to SRT content
        srtContent += `${nextSubtitleNumber}\n`;
        srtContent += `${startTimeStr} --> ${endTimeStr}\n`;
        srtContent += `${note.trim()}\n\n`;
        
        // Increment subtitle number and current time
        nextSubtitleNumber++;
        currentVideoTime = endVideoTime;
      }
    });
    
    // Write the SRT file (append to existing content)
    await writeFile(srtFilePath, existingSrtContent + srtContent);
    console.log("Notes saved successfully to SRT file"); // Debug log
    
    return NextResponse.json({ 
      success: true,
      message: "Notes saved successfully to both text and SRT formats" 
    });
  } catch (error) {
    console.error("Error saving notes:", error);
    return NextResponse.json(
      { error: "Failed to save notes" },
      { status: 500 }
    );
  }
} 