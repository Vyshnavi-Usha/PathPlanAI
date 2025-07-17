import io

try:
    import PyPDF2
except ImportError:
    
    PyPDF2 = None 

def extract_text_from_pdf(pdf_binary_data):
    """
    Extracts text from PDF binary data using PyPDF2.
    """
    if PyPDF2 is None:
        print("ERROR: PyPDF2 is not installed or cannot be imported. PDF extraction will not work.")
        return None

    try:
        pdf_file_obj = io.BytesIO(pdf_binary_data)
        pdf_reader = PyPDF2.PdfReader(pdf_file_obj)
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            page_obj = pdf_reader.pages[page_num]
            extracted_page_text = page_obj.extract_text()
            text += extracted_page_text or ""
        print(f"DEBUG: Extracted {len(text)} characters from PDF.")
        if not text.strip():
            print("DEBUG: Extracted text is empty or only whitespace.")
            return None
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None
