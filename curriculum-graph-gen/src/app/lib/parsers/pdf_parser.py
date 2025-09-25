import pdfplumber
import re
import json
import sys
import os
import traceback

def parse_pdf(pdf_path):
    """Parse a curriculum PDF and extract course codes and curriculum information"""
    output_path = pdf_path.replace(".pdf", ".json").replace(".PDF", ".json")

    print(f"Processing PDF: {pdf_path}")
    print(f"Output will be saved to: {output_path}")

    # Extract the full text from the PDF
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n\n"
    
    # Extract curriculum ID and course code
    curriculum_info = extract_curriculum_info(full_text)
    
    # Remove everything after "Observações" section
    observacoes_match = re.search(r"Observações", full_text, re.IGNORECASE)
    if observacoes_match:
        full_text = full_text[:observacoes_match.start()]
    
    # Pre-process the text to separate courses
    processed_text = full_text.replace(" FS Ob ", "\nFS Ob\n").replace(" FS Op ", "\nFS Op\n")
    
    # Initialize result structure
    results = {
        "cursadas": [],
        "andamento": [],
        "dispensadas": []
    }
    
    # Add curriculum info to results
    if curriculum_info:
        results.update(curriculum_info)
    
    # Track processed courses to avoid duplicates
    processed_courses = set()
    
    # Course code pattern
    course_pattern = re.compile(r'([A-Z]{3}\d{4})')
    
    # Process each line
    for line in processed_text.split('\n'):
        line = line.strip()
        if not line:
            continue
        
        # Look for a course code
        code_match = course_pattern.search(line)
        if not code_match:
            continue
        
        course_code = code_match.group(1)
        
        # Skip if already processed
        if course_code in processed_courses:
            continue
        
        processed_courses.add(course_code)
        
        # Determine course status
        if "Cursando" in line:
            results["andamento"].append({"codigo": course_code})
        elif "Não Cursou" in line or "Reprovado" in line:
            # Skip - not relevant for tracking
            continue
        elif "Cursou Eqv" in line or "Equivalência" in line:
            results["dispensadas"].append({"codigo": course_code})
        elif re.search(r'\d{4}/\d\s+\d+\.\d', line):
            # Has semester and grade - completed course
            results["cursadas"].append({"codigo": course_code})
        else:
            # If we can't determine status, check if there's a grade
            grade_match = re.search(r'\d+\.\d', line)
            if grade_match:
                results["cursadas"].append({"codigo": course_code})
    
    print(f"Found {len(results['cursadas'])} completed courses")
    print(f"Found {len(results['andamento'])} in-progress courses")
    print(f"Found {len(results['dispensadas'])} equivalence courses")

    # Save in JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"saved to: {output_path}")
    
    return results, output_path

def extract_curriculum_info(text):
    """Extract curriculum ID and course code from PDF text"""
    info = {}
    
    # Extract course code (the 3 digits after "Curso: ")
    course_match = re.search(r'Curso:\s*(\d{3})', text)
    if course_match:
        info["courseCode"] = course_match.group(1)
        print(f"Found course code: {info['courseCode']}")
        
        # Try to extract course name if available
        course_name_match = re.search(r'Curso:\s*\d{3}\s+(.*?)$', text.split('\n')[0])
        if course_name_match:
            info["courseName"] = course_name_match.group(1).strip()
            print(f"Found course name: {info['courseName']}")
    
    # Extract curriculum ID (format: YYYY/N) and remove the "/"
    curriculum_match = re.search(r'Curr[ií]culo:\s*(\d{4}/\d)', text, re.IGNORECASE)
    if curriculum_match:
        # Remove the "/" from the curriculum ID
        curriculum_id = curriculum_match.group(1).replace('/', '')
        info["curriculumId"] = curriculum_id
        print(f"Found curriculum ID: {info['curriculumId']}")
    
    return info

# If run directly, use the command-line arguments
if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print("Usage: python pdf_parser.py <pdf_path>")
            sys.exit(1)

        pdf_path = sys.argv[1]
        parse_pdf(pdf_path)
    except Exception as e:
        print(f"Unexpected error: {e}")
        traceback.print_exc()
        sys.exit(1)
