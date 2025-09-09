import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(request) {
  try {
    // Process the form data from the request
    const formData = await request.formData();
    const file = formData.get('file');
    
    // These are now optional - will be extracted from PDF if not provided
    const userProvidedCurriculumId = formData.get('curriculumId');
    const userProvidedCourseCode = formData.get('courseCode');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate that the file is a PDF
    const fileName = file.name.toLowerCase();
    if (!fileName.includes('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }

    // Convert the file to a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename - ensure it has .pdf extension
    const timestamp = Date.now();
    const cleanedFileName = fileName.replace(/\.pdf\.pdf$/i, '.pdf');
    const uniqueFileName = `${timestamp}-${cleanedFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    // Write the file to the uploads directory
    await writeFile(filePath, buffer);
    
    console.log(`PDF uploaded to ${filePath}`);
    
    // Call the Python parser script
    const pythonScript = path.join(process.cwd(), 'src', 'app', 'lib', 'parsers', 'pdf_parser.py');
    
    // Make sure the path to Python script is correct and the file exists
    if (!fs.existsSync(pythonScript)) {
      console.error(`Python script not found at: ${pythonScript}`);
      return NextResponse.json(
        { error: 'Parser script not found' },
        { status: 500 }
      );
    }
    
    // Use the virtual environment's Python interpreter
    const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python');
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
    
    // Determine the expected output JSON file path
    const expectedJsonPath = filePath.replace(/\.pdf$/i, '.json');
    console.log(`Looking for JSON at: ${expectedJsonPath}`);
    
    // Check if the JSON file exists
    if (!fs.existsSync(expectedJsonPath)) {
      console.error(`JSON file not found at: ${expectedJsonPath}`);
      return NextResponse.json(
        { error: 'Parser did not generate output file' },
        { status: 500 }
      );
    }
    
    // Read the parsed JSON file
    const parsedData = JSON.parse(fs.readFileSync(expectedJsonPath, 'utf8'));
    
    // Use user-provided values if available, otherwise keep what was extracted from PDF
    if (userProvidedCurriculumId) {
      parsedData.curriculumId = userProvidedCurriculumId;
    }
    
    if (userProvidedCourseCode) {
      parsedData.courseCode = userProvidedCourseCode;
    }
    
    // If we still don't have curriculum ID or course code, use defaults
    if (!parsedData.curriculumId) {
      console.warn("Could not extract curriculum ID from PDF, using default");
      parsedData.curriculumId = "20071";  // Default value
    }
    
    if (!parsedData.courseCode) {
      console.warn("Could not extract course code from PDF, using default");
      parsedData.courseCode = "208";  // Default value
    }
    
    // Return the parsed data with curriculum info
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