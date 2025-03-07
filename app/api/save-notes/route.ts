import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json();
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
    
    // Create filename with path
    const filePath = path.join(baseDir, "notes.txt");
    console.log("File path:", filePath); // Debug log
    
    // Check if file exists and read existing content
    let existingContent = "";
    try {
      existingContent = await fs.readFile(filePath, "utf-8");
      existingContent += "\n\n---\n\n"; // Add separator between existing and new notes
    } catch (error) {
      console.log("No existing notes file found, creating new one"); // Debug log
    }
    
    // Append timestamp to notes
    const timestamp = new Date().toISOString();
    
    // Format notes as a checklist with timestamp
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
    
    // Write the file with existing content + new notes
    await writeFile(filePath, existingContent + formattedNotes);
    console.log("Notes saved successfully to file"); // Debug log
    
    return NextResponse.json({ 
      success: true,
      message: "Notes saved successfully" 
    });
  } catch (error) {
    console.error("Error saving notes:", error);
    return NextResponse.json(
      { error: "Failed to save notes" },
      { status: 500 }
    );
  }
} 