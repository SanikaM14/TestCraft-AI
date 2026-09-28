import streamlit as st
import os
import fitz  # PyMuPDF
import pandas as pd
from docx import Document
from groq import Groq
from markdown_pdf import MarkdownPdf, Section
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Streamlit Page Config
st.set_page_config(page_title="Requirements to Test Cases", layout="centered")

st.title("Requirements to Test Cases")
st.write("Upload a document (PDF, CSV, DOCX) or enter a website description. We will automatically generate test cases and test scenarios for you.")

# API Key handling & Instructions
st.sidebar.header("Configuration")
api_key = st.sidebar.text_input("Enter your Groq API Key:", type="password", value=os.getenv("GROQ_API_KEY", ""))

st.sidebar.markdown("---")
st.sidebar.markdown("### Security & Privacy")
st.sidebar.info(
    "**Your API key is safe.**\n\n"
    "We do not store, log, or save your API key anywhere. It is only used securely during this session to connect directly to the Groq AI service."
)

st.sidebar.markdown("### What is this?")
st.sidebar.markdown(
    "To generate the test cases instantly, this app uses Groq's AI. "
    "To keep this tool free to use, you just need to bring your own free access key.\n\n"
    "**How to get your free key:**\n"
    "1. Go to [console.groq.com](https://console.groq.com/keys)\n"
    "2. Sign in or create a free account.\n"
    "3. Click **'Create API Key'**.\n"
    "4. Copy the key and paste it above."
)

if not api_key:
    st.warning("Please enter your Groq API Key in the sidebar to proceed. If you don't have one, follow the instructions in the sidebar to get it for free.")
    st.stop()

# Initialize Groq client
client = Groq(api_key=api_key)

# Input methods
input_method = st.radio("Choose Input Method:", ["Upload Requirements Document", "Enter URL/Description"])

extracted_text = ""
website_input = ""

if input_method == "Upload Requirements Document":
    uploaded_file = st.file_uploader("Upload your requirements (PDF, DOCX, CSV)", type=["pdf", "docx", "csv"])
    if uploaded_file is not None:
        with st.spinner("Extracting text from document..."):
            try:
                # Handle PDF
                if uploaded_file.name.endswith(".pdf"):
                    doc = fitz.open(stream=uploaded_file.read(), filetype="pdf")
                    for page in doc:
                        extracted_text += page.get_text() + "\n"
                
                # Handle DOCX
                elif uploaded_file.name.endswith(".docx"):
                    doc = Document(uploaded_file)
                    for para in doc.paragraphs:
                        extracted_text += para.text + "\n"
                
                # Handle CSV
                elif uploaded_file.name.endswith(".csv"):
                    df = pd.read_csv(uploaded_file)
                    extracted_text = df.to_string()
                
                st.success(f"Text extracted successfully from {uploaded_file.name}!")
                with st.expander("Preview Extracted Text"):
                    st.text(extracted_text[:1000] + ("..." if len(extracted_text) > 1000 else ""))
            except Exception as e:
                st.error(f"Error reading file: {e}")
else:
    website_input = st.text_input("Website URL or Description:", placeholder="e.g., https://example.com or 'A basic e-commerce site with a cart'")


def generate_test_cases(context_info):
    prompt = f"""
You are an expert Quality Assurance Engineer. 
Please generate comprehensive test cases and test scenarios for the following requirements or application:

{context_info}

Please structure your response clearly using Markdown:
# 1. Executive Summary
# 2. High-Level Test Scenarios
# 3. Detailed Test Cases
## 3.1 Unit / Component Level
## 3.2 Integration Testing
## 3.3 Functional Testing
## 3.4 UI/UX & Accessibility Testing
## 3.5 Performance & Security Testing
# 4. Edge Cases & Negative Testing
"""
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Groq fast model
            temperature=0.5,
        )
        return response.choices[0].message.content
    except Exception as e:
        st.error(f"Error generating test cases: {e}")
        return None

def create_pdf(markdown_text):
    pdf = MarkdownPdf(toc_level=2)
    pdf.add_section(Section(markdown_text))
    pdf_path = "test_cases.pdf"
    pdf.save(pdf_path)
    return pdf_path

if st.button("Generate Test Cases", type="primary"):
    context_to_use = extracted_text if input_method == "Upload Requirements Document" else website_input
    
    if not context_to_use or context_to_use.strip() == "":
        st.error("Please provide valid input (Upload a document or enter a description).")
    else:
        with st.spinner("Generating test scenarios and cases... This might take a few seconds."):
            # Truncate context to avoid token limits on Groq free tier
            max_chars = 25000
            if len(context_to_use) > max_chars:
                st.warning("The input is very long. Truncating to fit within the AI's context limit.")
                context_to_use = context_to_use[:max_chars]

            generated_markdown = generate_test_cases(context_to_use)
            
            if generated_markdown:
                st.success("Test cases generated successfully!")
                
                # Display on UI
                st.markdown("### Generated Output")
                with st.expander("View Test Cases", expanded=True):
                    st.markdown(generated_markdown)
                
                # Convert to PDF and provide download
                try:
                    pdf_filename = create_pdf(generated_markdown)
                    with open(pdf_filename, "rb") as pdf_file:
                        st.download_button(
                            label="Download PDF",
                            data=pdf_file,
                            file_name="Test_Cases.pdf",
                            mime="application/pdf"
                        )
                except Exception as e:
                    st.error(f"Error creating PDF: {e}")
