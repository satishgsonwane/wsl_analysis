import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import JSZip from "jszip";
import { createReadStream } from "fs";

export async function GET(request: NextRequest) {
  try {
    const zip = new JSZip();
    const capturesDir = path.join(process.cwd(), "public", "captures");
    
    // Function to recursively add files to zip
    async function addFilesToZip(currentPath: string, zipFolder: JSZip) {
      const entries = await readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(capturesDir, fullPath);
        
        if (entry.isDirectory()) {
          // Create a new folder in the zip
          const newZipFolder = zipFolder.folder(entry.name);
          if (newZipFolder) {
            await addFilesToZip(fullPath, newZipFolder);
          }
        } else {
          // Add file to zip
          const fileStats = await stat(fullPath);
          if (fileStats.size > 0) {
            // Read file as buffer
            const fileStream = createReadStream(fullPath);
            const chunks: Buffer[] = [];
            
            for await (const chunk of fileStream) {
              chunks.push(Buffer.from(chunk));
            }
            
            const fileBuffer = Buffer.concat(chunks);
            zipFolder.file(entry.name, fileBuffer);
          }
        }
      }
    }
    
    // Start adding files to zip
    await addFilesToZip(capturesDir, zip);
    
    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    
    // Return as downloadable file
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="captures_${new Date().toISOString().slice(0, 10)}.zip"`
      }
    });
  } catch (error) {
    console.error("Error creating zip file:", error);
    return NextResponse.json(
      { error: "Failed to create zip file" },
      { status: 500 }
    );
  }
} 