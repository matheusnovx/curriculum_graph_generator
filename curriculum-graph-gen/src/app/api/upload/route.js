import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    const userProvidedCurriculumId = formData.get('curriculumId');
    const userProvidedCourseCode = formData.get('courseCode');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.includes('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const timestamp = Date.now();
    const cleanedFileName = fileName.replace(/\.pdf\.pdf$/i, '.pdf');
    const uniqueFileName = `${timestamp}-${cleanedFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    await writeFile(filePath, buffer);
    
    console.log(`PDF uploaded to ${filePath}`);
    
    const pythonScript = path.join(process.cwd(), 'src', 'app', 'lib', 'parsers', 'pdf_parser.py');
    
    if (!fs.existsSync(pythonScript)) {
      console.error(`Python script not found at: ${pythonScript}`);
      return NextResponse.json(
        { error: 'Parser script not found' },
        { status: 500 }
      );
    }
    
    const pythonPath = "python3";
    const command = `"${pythonPath}" "${pythonScript}" "${filePath}"`;
    let stdout, stderr;
    
    try {
      console.log(`Executing: ${command}`);
      ({ stdout, stderr } = await execPromise(command));
    } catch (pythonError) {
      console.error('Error executing Python script:', pythonError);
      return NextResponse.json(
        { error: `Failed to parse PDF: ${pythonError.message}` },
        { status: 500 }
      );
    }
    
    if (stderr) {
      console.error('Error parsing PDF:', stderr);
      return NextResponse.json(
        { error: `Failed to parse PDF: ${stderr}` },
        { status: 500 }
      );
    }
    
    console.log('Parser output:', stdout);
    
    const expectedJsonPath = filePath.replace(/\.pdf$/i, '.json');
    console.log(`Looking for JSON at: ${expectedJsonPath}`);
    
    if (!fs.existsSync(expectedJsonPath)) {
      console.error(`JSON file not found at: ${expectedJsonPath}`);
      return NextResponse.json(
        { error: 'Parser did not generate output file' },
        { status: 500 }
      );
    }
    
    const parsedData = JSON.parse(fs.readFileSync(expectedJsonPath, 'utf8'));
    
    if (userProvidedCurriculumId) {
      parsedData.curriculumId = userProvidedCurriculumId;
    }
    
    if (userProvidedCourseCode) {
      parsedData.courseCode = userProvidedCourseCode;
    }
    
    // If we still don't have curriculum ID or course code, use defaults
    if (!parsedData.curriculumId) {
      console.warn("Could not extract curriculum ID from PDF, using default");
      parsedData.curriculumId = "20071";
    }
    
    if (!parsedData.courseCode) {
      console.warn("Could not extract course code from PDF, using default");
      parsedData.courseCode = "208";
    }
    
    return NextResponse.json({
      success: true,
      message: 'PDF successfully processed',
      data: parsedData
    });
    
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: `Failed to process the uploaded file: ${error.message}` },
      { status: 500 }
    );
  }
}