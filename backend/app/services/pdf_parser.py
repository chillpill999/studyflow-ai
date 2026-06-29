import io
import re
from typing import Any

import fitz  # PyMuPDF
import pytesseract
from PIL import Image


class PDFParser:
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Cleans extracted text by stripping control sequences and consolidating multi-spaces.
        """
        # Consolidate excessive spaces and newlines
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    @staticmethod
    def extract_metadata(doc: fitz.Document) -> dict[str, Any]:
        """
        Retrieves basic document metadata and structural headers.
        """
        metadata = doc.metadata
        toc = doc.get_toc()  # Table of contents list of [level, title, page]

        return {
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "subject": metadata.get("subject", ""),
            "keywords": metadata.get("keywords", ""),
            "creator": metadata.get("creator", ""),
            "producer": metadata.get("producer", ""),
            "toc": (
                [{"level": t[0], "title": t[1], "page": t[2]} for t in toc]
                if toc
                else []
            ),
        }

    @classmethod
    def parse_pdf(cls, file_bytes: bytes) -> dict[str, Any]:
        """
        Parses a PDF from bytes page by page.
        Extracts structural text, Markdown tables, captures images, and triggers OCR fallback.
        """
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        metadata = cls.extract_metadata(doc)
        pages_data = []

        for page_idx, page in enumerate(doc):
            page_num = page_idx + 1

            # 1. Text Extraction
            raw_text = page.get_text("text")

            # 2. Scanned PDF OCR Fallback (if raw text is extremely short, signifying scanned images)
            if len(raw_text.strip()) < 50:
                try:
                    # Render page to image at high resolution (200 DPI) for OCR accuracy
                    pix = page.get_pixmap(dpi=200)
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    raw_text = pytesseract.image_to_string(img)
                except Exception as ocr_err:
                    # In case Tesseract isn't configured in the environment, fallback gracefully
                    raw_text = f"[OCR Failed: {str(ocr_err)}]"

            # 3. Table Ingestion
            tables_md = []
            try:
                tables = page.find_tables()
                for table in tables:
                    table_data = table.extract()
                    if table_data:
                        # Convert table grid array into Markdown table format
                        headers = [str(h or "").strip() for h in table_data[0]]
                        row_strings = []
                        for row in table_data[1:]:
                            row_strings.append(
                                "| "
                                + " | ".join([str(cell or "").strip() for cell in row])
                                + " |"
                            )

                        markdown_table = (
                            "| "
                            + " | ".join(headers)
                            + " |\n"
                            + "| "
                            + " | ".join(["---"] * len(headers))
                            + " |\n"
                            + "\n".join(row_strings)
                        )
                        tables_md.append(markdown_table)
            except Exception:
                pass  # Fail silently if table parser encounters structural anomalies

            # 4. Images Extraction (Count & Size tracker)
            images_list = page.get_images(full=True)
            images_meta = []
            for img_idx, img_info in enumerate(images_list):
                try:
                    xref = img_info[0]
                    base_image = doc.extract_image(xref)
                    image_ext = base_image["ext"]
                    images_meta.append(
                        {
                            "index": img_idx,
                            "xref": xref,
                            "extension": image_ext,
                            "size": len(base_image["image"]),
                        }
                    )
                except Exception:
                    pass

            # Combine Text with extracted Markdown Tables
            combined_content = raw_text
            if tables_md:
                combined_content += "\n\n### Extracted Tables:\n" + "\n\n".join(
                    tables_md
                )

            pages_data.append(
                {
                    "page_number": page_num,
                    "raw_content": combined_content,
                    "clean_content": cls.clean_text(combined_content),
                    "images_count": len(images_meta),
                    "images": images_meta,
                }
            )

        return {"metadata": metadata, "total_pages": len(doc), "pages": pages_data}
