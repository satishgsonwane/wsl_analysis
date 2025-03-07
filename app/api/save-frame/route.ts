import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageData = formData.get("image") as File;
    const camera = formData.get("camera") as string;
    const event = formData.get("event") as string;
    const framing = formData.get("framing") as string;
    
    if (!imageData || !camera || !event || !framing) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create base directory path
    const baseDir = path.join(process.cwd(), "public", "captures");
    
    // Create folder structure
    const folderPath = path.join(baseDir, camera, event, framing);
    await mkdir(folderPath, { recursive: true });
    
    // Create filename with path and cleaner timestamp
    const timestamp = new Date().toISOString()
      .replace(/:/g, "-")
      .replace("T", "_")
      .replace("Z", "");
    
    const fileName = `${camera}_${event}_${framing}_${timestamp}.jpg`;
    const filePath = path.join(folderPath, fileName);
    
    // Convert file to buffer and save
    const bytes = await imageData.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Return the path relative to public folder for client display
    const relativePath = path.join("captures", camera, event, framing, fileName);
    
    return NextResponse.json({ 
      success: true, 
      path: relativePath.replace(/\\/g, "/") 
    });
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}
