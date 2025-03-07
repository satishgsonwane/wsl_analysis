import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json();
    
    if (!notes) {
      return NextResponse.json(
        { error: "Missing notes content" },
        { status: 400 }
      );
    }

    // Create base directory path
    const baseDir = path.join(process.cwd(), "public", "captures");
    
    // Ensure the directory exists
    await mkdir(baseDir, { recursive: true });
    
    // Create filename with path
    const filePath = path.join(baseDir, "notes.txt");
    
    // Check if file exists and read existing content
    let existingContent = "";
    try {
      existingContent = await fs.readFile(filePath, "utf-8");
      existingContent += "\n\n---\n\n"; // Add separator between existing and new notes
    } catch (error) {
      // File doesn't exist yet, that's fine
    }
    
    // Append timestamp to notes
    const timestamp = new Date().toISOString();
    const formattedNotes = `[${timestamp}]\n${notes}`;
    
    // Write the file with existing content + new notes
    await writeFile(filePath, existingContent + formattedNotes);
    
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