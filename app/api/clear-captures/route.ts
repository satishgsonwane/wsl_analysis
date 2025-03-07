import { NextRequest, NextResponse } from "next/server";
import { rm, readdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // Define the captures directory path
    const capturesDir = path.join(process.cwd(), "public", "captures");
    
    // Read the directory to get all subdirectories
    const entries = await readdir(capturesDir, { withFileTypes: true });
    
    // Delete each subdirectory
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(capturesDir, entry.name);
        await rm(dirPath, { recursive: true, force: true });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Captures folder cleared successfully" 
    });
  } catch (error) {
    console.error("Error clearing captures folder:", error);
    return NextResponse.json(
      { error: "Failed to clear captures folder" },
      { status: 500 }
    );
  }
} 