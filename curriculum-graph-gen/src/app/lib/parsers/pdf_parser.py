import pdfplumber
import re
import json
import sys
import traceback

def parse_pdf(pdf_path):
    """Parse a curriculum PDF and extract course codes with type (Ob/Op)."""
    output_path = pdf_path.replace(".pdf", ".json").replace(".PDF", ".json")

    print(f"Processing PDF: {pdf_path}")
    print(f"Output will be saved to: {output_path}")

    # Extrai todo o texto do PDF
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    # Extrai metadados do currículo
    curriculum_info = extract_curriculum_info(full_text)

    # Regex: captura cada bloco de disciplina do código até Ob/Op
    course_pattern = re.compile(r"""
        (?P<block>                                   # Bloco completo da disciplina
            (?P<codigo>[A-Z]{2,}[A-Z]?\d{4})         # Código (ex: ARQ5621, FSARQ5631)
            .*?                                      # Nome, carga, nota, etc.
            (?P<tipo>Ob|Op)\b                        # Tipo (Ob/Op)
        )
    """, re.VERBOSE)

    results = {
        "cursadas": [],
        "andamento": [],
        "dispensadas": []
    }

    # Adiciona metadados
    if curriculum_info:
        results.update(curriculum_info)

    processed_courses = set()

    # Processa linha por linha
    for line in full_text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Procura TODAS as disciplinas (cada bloco) na linha
        for match in course_pattern.finditer(line):
            data = match.groupdict()
            codigo = data["codigo"]
            tipo = data["tipo"]
            block = data["block"]

            if codigo in processed_courses:
                continue
            processed_courses.add(codigo)

            # Determina status pela análise do bloco específico
            if "Cursando" in block:
                results["andamento"].append({"codigo": codigo, "tipo": tipo})
            elif "Cursou Eqv" in block or "Equivalência" in block:
                results["dispensadas"].append({"codigo": codigo, "tipo": tipo})
            elif "Não Cursou" in block or "Reprovado" in block:
                # Ignorar ou poderia guardar em "naoCursadas"
                continue
            elif re.search(r'\d{4}/\d\s+\d+\.\d', block):
                results["cursadas"].append({"codigo": codigo, "tipo": tipo})

    # Salva JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"saved to: {output_path}")
    return results, output_path


def extract_curriculum_info(text):
    """Extrai metadados do currículo do texto do PDF"""
    info = {}

    # Código do curso
    course_match = re.search(r'Curso:\s*(\d{3})', text)
    if course_match:
        info["courseCode"] = course_match.group(1)

    # Curriculum ID (YYYY/N → YYYYN)
    curriculum_match = re.search(r'Curr[ií]culo:\s*(\d{4}/\d)', text, re.IGNORECASE)
    if curriculum_match:
        info["curriculumId"] = curriculum_match.group(1).replace("/", "")

    def parse_number(s):
        if not s:
            return None
        s = s.strip().replace(".", "").replace(",", ".")
        try:
            return float(s) if "." in s else int(s)
        except:
            return None

    # Numero Aulas (semanal)
    weekly_match = re.search(r'Numero\s*Aulas\s*\(semanal\)\s*[:\-\s]*([\d.,]+)', text, re.IGNORECASE)
    if weekly_match:
        info["minClasses"] = parse_number(weekly_match.group(1))

    # Aulas Mínimas
    min_match = re.search(r'Aulas\s*M[ií]nimas\s*[:\-\s]*([\d.,]+)', text, re.IGNORECASE)
    if min_match:
        info["minClasses"] = parse_number(min_match.group(1))

    # Aulas Média
    avg_match = re.search(r'Aulas\s*M[eé]dia\s*[:\-\s]*([\d.,]+)', text, re.IGNORECASE)
    if avg_match:
        info["avgClasses"] = parse_number(avg_match.group(1))

    # Aulas Máximas
    max_match = re.search(r'Aulas\s*M[aá]xima?s?\s*[:\-\s]*([\d.,]+)', text, re.IGNORECASE)
    if max_match:
        info["maxClasses"] = parse_number(max_match.group(1))

    return info


# Execução direta
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
