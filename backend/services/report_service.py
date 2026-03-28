from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch
import io
import requests
import logging

logger = logging.getLogger(__name__)

def generate_verification_report(record_data: dict) -> io.BytesIO:
    """
    Generates a professional Medical Image Authenticity Report (PDF).
    record_data expected keys:
        - id: str (UUID)
        - filename: str
        - result: str ('genuine' or 'manipulated')
        - confidence: float
        - heatmap_url: str (optional)
        - doctor_name: str
        - timestamp: str
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e293b"), # Slate-800
        alignment=1, # Center
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748b"), # Slate-500
        fontName='Helvetica-Bold',
        spaceAfter=2
    )
    
    value_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor("#0f172a"), # Slate-900
        fontName='Helvetica',
        spaceAfter=10
    )

    elements = []

    # 1. Header Section
    elements.append(Paragraph("MediVerify™", ParagraphStyle('Brand', parent=styles['Normal'], fontSize=12, textColor=colors.blue, fontName='Helvetica-Bold')))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("CERTIFICATE OF IMAGE AUTHENTICITY", title_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey, spaceBefore=4, spaceAfter=20))

    # 2. Metadata Table
    verdict = record_data.get('result', 'unknown').upper()
    verdict_color = colors.HexColor("#10b981") if verdict == 'GENUINE' else colors.HexColor("#f43f5e")
    
    meta_data = [
        [Paragraph("REPORT INFORMATION", styles['Heading4']), ""],
        ["Verification ID:", record_data.get('id', 'N/A')],
        ["Filename:", record_data.get('filename', 'Unknown')],
        ["Timestamp:", record_data.get('timestamp', 'N/A')],
        ["Verified By:", record_data.get('doctor_name', 'Authorized System')],
        ["", ""],
        [Paragraph("VERIFICATION VERDICT", verdict_style := styles['Heading4']), ""],
        [Paragraph(f"<font color='{verdict_color}' size='16'><b>{verdict}</b></font>", styles['Normal']), ""],
        [f"Confidence Score: {record_data.get('confidence', 0)}%", ""]
    ]
    
    table = Table(meta_data, colWidths=[1.5*inch, 4.5*inch])
    table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('SPAN', (0, 6), (1, 6)),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TEXTCOLOR', (0,1), (0,4), colors.HexColor("#64748b")),
        ('FONTNAME', (0,1), (0,4), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))

    # 3. heatmap / Image Section (If URL exists)
    heatmap_url = record_data.get('heatmap_url')
    if heatmap_url:
        try:
            # We try to download and embed it
            # Note: This might slow down generation. In prod, we'd use cached files.
            r = requests.get(heatmap_url, timeout=5)
            if r.status_code == 200:
                img_data = io.BytesIO(r.content)
                img = Image(img_data, width=4*inch, height=3*inch)
                elements.append(Paragraph("ANALYSIS VISUALIZATION (GRAD-CAM)", styles['Heading4']))
                elements.append(Spacer(1, 10))
                elements.append(img)
                elements.append(Paragraph("<font size='8' color='grey'>The heatmap highlights areas of the scan that the AI model focused on during verification.</font>", styles['Italic']))
                elements.append(Spacer(1, 24))
        except Exception as e:
            logger.warning(f"Could not embed image in PDF: {e}")
            elements.append(Paragraph("Visualization attachment failed. See system dashboard for interactive heatmap.", styles['Italic']))

    # 4. Methodology Section
    elements.append(Paragraph("MODEL METHODOLOGY", styles['Heading4']))
    methodology = """
    The analysis was performed using the MediVerify CNN Core (EfficientNet-B0 architecture). 
    The model evaluates spatial inconsistencies, metadata anomalies, and adversarial perturbations 
    commonly associated with image manipulation in medical records.
    """
    elements.append(Paragraph(methodology, styles['Normal']))
    elements.append(Spacer(1, 30))

    # 5. Footer & Signature
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    footer_text = "AUTHENTICITY SECURED BY MEDIVERIFY AI ENGINE. VALID ONLY WITH SYSTEM ID."
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=1, textColor=colors.grey)))
    
    # Disclaimer
    elements.append(Spacer(1, 20))
    disclaimer = """
    <b>Disclaimer:</b> This report is generated by an automated AI diagnostic system. It serves as a secondary 
    validation tool and does not replace the professional judgment of a licensed radiologist or medical professional. 
    Final diagnostic decisions are the sole responsibility of the attending physician.
    """
    elements.append(Paragraph(disclaimer, ParagraphStyle('Disclaimer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)))

    doc.build(elements)
    buffer.seek(0)
    return buffer
