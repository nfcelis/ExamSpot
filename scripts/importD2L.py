#!/usr/bin/env python3
"""
D2L XML to JSON converter + Image uploader for ExamSpot.

Usage:
  1. Upload images to Supabase Storage:
     python3 scripts/importD2L.py --upload-images

  2. Convert XML to JSON:
     python3 scripts/importD2L.py --convert

  3. Both:
     python3 scripts/importD2L.py --upload-images --convert
"""

import xml.etree.ElementTree as ET
import html
import json
import os
import re
import sys
import urllib.parse
import mimetypes
from pathlib import Path

# ====== Configuration ======
XML_PATH = "/Users/admin/Downloads/D2LExport_424260_202610_ISIS2403_3_202621159/questiondb.xml"
FOTOS_DIR = "/Users/admin/Downloads/Fotos"
OUTPUT_JSON = os.path.join(os.path.dirname(__file__), "d2l_questions.json")

SUPABASE_URL = "https://djlwdmkdyoqsfmqewryi.supabase.co"
SUPABASE_KEY = "sb_publishable_l3PVIevAcxFmMKLycceoCw_iVdQ0KKk"
STORAGE_BUCKET = "exam-materials"
STORAGE_PATH = "question-images"

BASE_IMAGE_URL = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{STORAGE_PATH}"


def authenticate():
    """Authenticate with Supabase and return access token."""
    try:
        import requests
    except ImportError:
        print("Installing requests...")
        os.system(f"{sys.executable} -m pip install requests")
        import requests

    print("Authenticating with Supabase...")
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json",
        },
        json={
            "email": "admin@examspot.com",
            "password": "Admin123!",
        },
    )

    if resp.status_code != 200:
        print(f"Authentication failed: {resp.status_code} {resp.text[:300]}")
        sys.exit(1)

    token = resp.json()["access_token"]
    print("Authenticated successfully!")
    return token


def upload_images():
    """Upload all images from Fotos folder to Supabase Storage."""
    try:
        import requests
    except ImportError:
        print("Installing requests...")
        os.system(f"{sys.executable} -m pip install requests")
        import requests

    access_token = authenticate()

    fotos = Path(FOTOS_DIR)
    if not fotos.exists():
        print(f"Error: Fotos directory not found: {FOTOS_DIR}")
        return

    # Get all image files (skip PDFs and other non-image files)
    image_extensions = {'.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'}
    files = [f for f in fotos.iterdir() if f.suffix.lower() in image_extensions]

    print(f"Found {len(files)} image files to upload")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": SUPABASE_KEY,
    }

    uploaded = 0
    skipped = 0
    errors = 0

    for i, file_path in enumerate(sorted(files)):
        filename = file_path.name
        storage_path = f"{STORAGE_PATH}/{filename}"

        # Determine content type
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        if filename.endswith('.svg'):
            content_type = "image/svg+xml"

        upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_path}"

        with open(file_path, 'rb') as f:
            file_data = f.read()

        # Try upsert (overwrite if exists)
        resp = requests.post(
            upload_url,
            headers={
                **headers,
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            data=file_data,
        )

        if resp.status_code in (200, 201):
            uploaded += 1
        elif resp.status_code == 409:
            skipped += 1  # Already exists
        else:
            errors += 1
            print(f"  Error uploading {filename}: {resp.status_code} {resp.text[:200]}")

        if (i + 1) % 20 == 0:
            print(f"  Progress: {i + 1}/{len(files)} (uploaded: {uploaded}, skipped: {skipped}, errors: {errors})")

    print(f"\nUpload complete: {uploaded} uploaded, {skipped} already existed, {errors} errors")


def decode_html_text(text):
    """Decode HTML entities in text from XML."""
    if not text:
        return ""
    # First unescape XML entities, then HTML entities
    decoded = html.unescape(text)
    return decoded


def replace_image_urls(html_text):
    """Replace local image references with Supabase Storage URLs."""
    if not html_text:
        return html_text

    def replace_src(match):
        src = match.group(1)
        # Decode URL encoding (e.g., %20 -> space) for display, but keep encoded for URL
        filename = urllib.parse.unquote(src)
        # Re-encode for the URL
        encoded_filename = urllib.parse.quote(filename)
        new_url = f"{BASE_IMAGE_URL}/{encoded_filename}"
        return f'src="{new_url}"'

    # Replace src="filename.ext" with src="full_storage_url"
    result = re.sub(r'src="([^"]+\.(svg|png|jpg|jpeg|gif|webp))"', replace_src, html_text, flags=re.IGNORECASE)
    return result


def strip_html_tags(html_text):
    """Remove HTML tags to get plain text (for comparison/fallback)."""
    if not html_text:
        return ""
    clean = re.sub(r'<[^>]+>', '', html_text)
    return clean.strip()


def get_text_from_mattext(element):
    """Extract text content from a mattext element, preserving HTML."""
    if element is None:
        return ""
    text = element.text or ""
    texttype = element.get("texttype", "text/html")

    if texttype == "text/html":
        decoded = decode_html_text(text)
        return replace_image_urls(decoded)
    else:
        return decode_html_text(text)


def get_question_type(item):
    """Extract question type from item metadata."""
    for field in item.findall('.//qti_metadatafield'):
        label = field.find('fieldlabel')
        entry = field.find('fieldentry')
        if label is not None and label.text == 'qmd_questiontype':
            return entry.text if entry is not None else None
    return None


def parse_multiple_choice(item, flow):
    """Parse a Multiple Choice question."""
    # Get question text
    material = flow.find('material/mattext')
    question_text = get_text_from_mattext(material)

    # Get options
    response_lid = flow.find('.//response_lid')
    if response_lid is None:
        return None

    options = []
    option_idents = []

    for flow_label in response_lid.findall('.//flow_label'):
        resp_label = flow_label.find('response_label')
        if resp_label is not None:
            ident = resp_label.get('ident')
            mattext = resp_label.find('.//mattext')
            option_text = get_text_from_mattext(mattext)
            options.append(option_text)
            option_idents.append(ident)

    # Get correct answer from resprocessing
    correct_answers = []
    for respcondition in item.findall('.//resprocessing/respcondition'):
        setvar = respcondition.find('setvar')
        if setvar is not None:
            try:
                score = float(setvar.text)
            except (ValueError, TypeError):
                score = 0
            if score > 0:
                varequal = respcondition.find('.//varequal')
                if varequal is not None and varequal.text:
                    correct_ident = varequal.text
                    if correct_ident in option_idents:
                        idx = option_idents.index(correct_ident)
                        correct_answers.append(options[idx])

    return {
        "question": question_text,
        "options": options,
        "correct_answers": correct_answers,
    }


def parse_multi_select(item, flow):
    """Parse a Multi-Select question (multiple correct answers required).

    D2L structure: the positive-score respcondition has a conditionvar with
    direct <varequal> children = options that MUST be selected (correct).
    Options inside <not><varequal> must NOT be selected (incorrect, ignored here).
    """
    material = flow.find('material/mattext')
    question_text = get_text_from_mattext(material)

    response_lid = flow.find('.//response_lid')
    if response_lid is None:
        return None

    options = []
    option_idents = []
    for flow_label in response_lid.findall('.//flow_label'):
        resp_label = flow_label.find('response_label')
        if resp_label is not None:
            ident = resp_label.get('ident')
            mattext = resp_label.find('.//mattext')
            option_text = get_text_from_mattext(mattext)
            options.append(option_text)
            option_idents.append(ident)

    # Find the respcondition with a positive score
    correct_answers = []
    for respcondition in item.findall('.//resprocessing/respcondition'):
        setvar = respcondition.find('setvar')
        if setvar is None:
            continue
        try:
            score = float(setvar.text)
        except (ValueError, TypeError):
            score = 0
        if score <= 0:
            continue

        # Found the positive-scoring condition
        # Direct <varequal> children of <conditionvar> = must select (correct)
        # <varequal> inside <not> = must NOT select (skip)
        conditionvar = respcondition.find('conditionvar')
        if conditionvar is not None:
            for varequal in conditionvar.findall('varequal'):
                ident = varequal.text
                if ident and ident in option_idents:
                    idx = option_idents.index(ident)
                    correct_answers.append(options[idx])
        break  # Only process first positive-scoring condition

    return {
        "question": question_text,
        "options": options,
        "correct_answers": correct_answers,
    }


def parse_true_false(item, flow):
    """Parse a True/False question."""
    material = flow.find('material/mattext')
    question_text = get_text_from_mattext(material)

    response_lid = flow.find('.//response_lid')
    if response_lid is None:
        return None

    option_idents = []
    options_text = []
    for flow_label in response_lid.findall('.//flow_label'):
        resp_label = flow_label.find('response_label')
        if resp_label is not None:
            ident = resp_label.get('ident')
            mattext = resp_label.find('.//mattext')
            text = get_text_from_mattext(mattext)
            option_idents.append(ident)
            options_text.append(text)

    # Find correct answer
    correct_answers = []
    for respcondition in item.findall('.//resprocessing/respcondition'):
        setvar = respcondition.find('setvar')
        if setvar is not None:
            try:
                score = float(setvar.text)
            except (ValueError, TypeError):
                score = 0
            if score > 0:
                varequal = respcondition.find('.//varequal')
                if varequal is not None and varequal.text in option_idents:
                    idx = option_idents.index(varequal.text)
                    correct_answers.append(options_text[idx])

    return {
        "question": question_text,
        "options": ["True", "False"],
        "correct_answers": correct_answers,
    }


def parse_fill_blank(item, flow):
    """Parse a Fill in the Blanks question."""
    # FIB questions have alternating material and response_str elements
    parts = []
    blanks_idents = []

    for child in flow:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'material':
            mattext = child.find('mattext')
            text = get_text_from_mattext(mattext)
            parts.append(text)
        elif tag == 'response_str':
            ident = child.get('ident', '')
            # Find the answer label ident
            answer_label = child.find('.//response_label')
            if answer_label is not None:
                blanks_idents.append(answer_label.get('ident', ''))
            else:
                blanks_idents.append(ident)
            parts.append('___')
        elif tag == 'response_extension':
            continue  # skip

    question_text = ''.join(parts)

    # Get correct answers from resprocessing
    correct_answers = []
    for blank_ident in blanks_idents:
        # Find the first correct answer for this blank
        found = False
        for respcondition in item.findall('.//resprocessing/respcondition'):
            setvar = respcondition.find('setvar')
            if setvar is not None:
                try:
                    score = float(setvar.text)
                except (ValueError, TypeError):
                    score = 0
                if score > 0:
                    varequal = respcondition.find('.//varequal')
                    if varequal is not None and varequal.get('respident') == blank_ident:
                        correct_answers.append(varequal.text)
                        found = True
                        break
        if not found:
            correct_answers.append("")

    return {
        "question": question_text,
        "correct_answers": correct_answers,
    }


def parse_matching(item, flow):
    """Parse a Matching question."""
    material = flow.find('material/mattext')
    question_text = get_text_from_mattext(material)

    matching_pairs = []

    # Each response_grp is a premise (term) with choices (definitions)
    for resp_grp in flow.findall('.//response_grp'):
        grp_ident = resp_grp.get('respident', '')

        # Get the premise (term) text
        premise_mattext = resp_grp.find('material/mattext')
        premise = get_text_from_mattext(premise_mattext)

        # Get all possible responses (definitions)
        response_map = {}
        for resp_label in resp_grp.findall('.//response_label'):
            ident = resp_label.get('ident')
            mattext = resp_label.find('.//mattext')
            text = get_text_from_mattext(mattext)
            response_map[ident] = text

        # Find the correct response for this group
        correct_response = ""
        for respcondition in item.findall('.//resprocessing/respcondition'):
            varequal = respcondition.find('.//varequal')
            if varequal is not None and varequal.get('respident') == grp_ident:
                setvar = respcondition.find('setvar')
                if setvar is not None:
                    varname = setvar.get('varname', '')
                    action = setvar.get('action', '')
                    try:
                        val = float(setvar.text) if setvar.text else 0
                    except ValueError:
                        val = 0

                    # D2L_Correct with Add action = correct answer
                    if (varname == 'D2L_Correct' and action == 'Add') or (val > 0 and varname != 'D2L_Incorrect'):
                        answer_ident = varequal.text
                        if answer_ident in response_map:
                            correct_response = response_map[answer_ident]
                            break

        matching_pairs.append({
            "premise": premise,
            "response": correct_response,
        })

    return {
        "question": question_text,
        "matching_pairs": matching_pairs,
    }


def parse_ordering(item, flow):
    """Parse an Ordering question."""
    material = flow.find('material/mattext')
    question_text = get_text_from_mattext(material)

    # Get all items in the ordering
    resp_grp = flow.find('.//response_grp')
    if resp_grp is None:
        return None

    items_map = {}  # ident -> text
    for resp_label in resp_grp.findall('.//response_label'):
        ident = resp_label.get('ident')
        mattext = resp_label.find('.//mattext')
        text = get_text_from_mattext(mattext)
        items_map[ident] = text

    # Get correct order from resprocessing
    order_map = {}  # position -> ident
    for respcondition in item.findall('.//resprocessing/respcondition'):
        setvar = respcondition.find('setvar')
        varequal = respcondition.find('.//varequal')
        if setvar is not None and varequal is not None:
            varname = setvar.get('varname', '')
            if varname == 'D2L_Correct':
                try:
                    position = int(varequal.text)
                    ident = varequal.get('respident')
                    if ident in items_map:
                        order_map[position] = items_map[ident]
                except (ValueError, TypeError):
                    pass

    ordered_items = [order_map[k] for k in sorted(order_map.keys())]

    # If we couldn't determine order, just list them
    if not ordered_items:
        ordered_items = list(items_map.values())

    return {
        "question": question_text,
        "ordered_items": ordered_items,
    }


def parse_short_answer(item, flow):
    """Parse a Short Answer question."""
    material = flow.find('material/mattext')
    question_text = get_text_from_mattext(material)

    correct_answers = []
    for respcondition in item.findall('.//resprocessing/respcondition'):
        setvar = respcondition.find('setvar')
        if setvar is not None:
            try:
                score = float(setvar.text)
            except (ValueError, TypeError):
                score = 0
            if score > 0:
                varequal = respcondition.find('.//varequal')
                if varequal is not None and varequal.text:
                    correct_answers.append(varequal.text)

    return {
        "question": question_text,
        "correct_answers": correct_answers,
    }


def convert_xml_to_json():
    """Parse D2L XML and convert to JSON format compatible with importService.ts."""
    print(f"Parsing XML: {XML_PATH}")
    tree = ET.parse(XML_PATH)
    root = tree.getroot()

    questions = []
    question_id = 0
    errors = []

    for section in root.findall('.//section'):
        section_title = section.get('title', 'Sin sección')
        items = section.findall('item')
        print(f"  Section: {section_title} ({len(items)} questions)")

        for item in items:
            question_id += 1
            q_type = get_question_type(item)

            if not q_type:
                errors.append(f"Question {question_id}: No type found")
                continue

            flow = item.find('.//presentation/flow')
            if flow is None:
                errors.append(f"Question {question_id}: No presentation/flow found")
                continue

            try:
                result = None

                if q_type == 'Multiple Choice':
                    result = parse_multiple_choice(item, flow)
                elif q_type == 'Multi-Select':
                    result = parse_multi_select(item, flow)
                elif q_type == 'True/False':
                    result = parse_true_false(item, flow)
                elif q_type == 'Fill in the Blanks':
                    result = parse_fill_blank(item, flow)
                elif q_type == 'Matching':
                    result = parse_matching(item, flow)
                elif q_type == 'Ordering':
                    result = parse_ordering(item, flow)
                elif q_type == 'Short Answer':
                    result = parse_short_answer(item, flow)
                else:
                    errors.append(f"Question {question_id}: Unknown type '{q_type}'")
                    continue

                if result is None:
                    errors.append(f"Question {question_id}: Failed to parse ({q_type})")
                    continue

                question_data = {
                    "id": question_id,
                    "section": section_title,
                    "type": q_type,
                    **result,
                }

                questions.append(question_data)

            except Exception as e:
                errors.append(f"Question {question_id} ({q_type}): {str(e)}")

    # Write JSON
    print(f"\nWriting {len(questions)} questions to: {OUTPUT_JSON}")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    # Summary
    type_counts = {}
    for q in questions:
        t = q['type']
        type_counts[t] = type_counts.get(t, 0) + 1

    print(f"\nSummary:")
    for t, count in sorted(type_counts.items()):
        print(f"  {t}: {count}")
    print(f"  Total: {len(questions)}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for err in errors[:20]:
            print(f"  {err}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more")

    # Count questions with images
    img_count = sum(1 for q in questions if '<img' in q.get('question', '') or
                    any('<img' in opt for opt in q.get('options', [])))
    print(f"\nQuestions with images: {img_count}")


def main():
    args = sys.argv[1:]

    if not args:
        print("Usage:")
        print("  python3 scripts/importD2L.py --upload-images   Upload images to Supabase Storage")
        print("  python3 scripts/importD2L.py --convert          Convert XML to JSON")
        print("  python3 scripts/importD2L.py --all              Do both")
        return

    if '--upload-images' in args or '--all' in args:
        print("=" * 50)
        print("UPLOADING IMAGES TO SUPABASE STORAGE")
        print("=" * 50)
        upload_images()
        print()

    if '--convert' in args or '--all' in args:
        print("=" * 50)
        print("CONVERTING XML TO JSON")
        print("=" * 50)
        convert_xml_to_json()


if __name__ == '__main__':
    main()
