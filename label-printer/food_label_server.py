#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import sqlite3
import json
import os
import queue
import requests
import threading
import time
import socket
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# ---------------------------------------------------------------------------
# Telegram alerting
# ---------------------------------------------------------------------------

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID")
TELEGRAM_ENABLED   = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)


def send_telegram_alert(message: str) -> bool:
    if not TELEGRAM_ENABLED:
        return False
    try:
        url  = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            "chat_id":    TELEGRAM_CHAT_ID,
            "text":       f"🖨️ FELICITY PRINTER ALERT\n\n{message}",
            "parse_mode": "HTML",
        }
        response = requests.post(url, json=data, timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"Telegram alert failed: {e}", flush=True)
        return False


# ---------------------------------------------------------------------------
# PIL compat shim (Pillow ≥ 10 removed ANTIALIAS)
# ---------------------------------------------------------------------------

from PIL import Image, ImageDraw, ImageFont
if not hasattr(Image, "ANTIALIAS"):
    Image.ANTIALIAS = Image.Resampling.LANCZOS

from flask import Flask, request, jsonify
from brother_ql.raster import BrotherQLRaster
from brother_ql.conversion import convert
from brother_ql.backends.helpers import send
import barcode
from barcode.writer import ImageWriter

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PRINTER_MODEL    = "QL-820NWB"
PRINTER_IP       = "192.168.11.33"
# brother_ql network backend accepts a bare IP (port defaults to 9100) — confirmed in source.
# tcp://IP:PORT format is also accepted but not required.

# OPERATOR: verify LABEL_IDENTIFIER for your actual tape stock.
#   "62" = 62mm continuous tape  → TAPE_WIDTH_PX 696 (matches this setting — likely correct).
#   If your tape is 50mm wide    → use "50" and set TAPE_WIDTH_PX = 590.
#   The "50×60mm" label description may refer to the print area, not the tape roll width.
LABEL_IDENTIFIER = "62"
PRINT_LENGTH_PX  = 590
TAPE_WIDTH_PX    = 696
DB_FILE          = "printed_orders.db"

SQUARE_ACCESS_TOKEN = os.getenv("SQUARE_ACCESS_TOKEN")
SQUARE_ENVIRONMENT  = os.getenv("SQUARE_ENVIRONMENT", "production")
SQUARE_API_BASE = (
    "https://connect.squareup.com"
    if SQUARE_ENVIRONMENT == "production"
    else "https://connect.squareupsandbox.com"
)

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Product catalogue
# ---------------------------------------------------------------------------

PRODUCTS = {
    "763C47OQ4I4FVUEVCSJZDJYV": {"origin": "ブラジル",                                 "gtin": "4595433537118", "weight": "100g"},
    "IDNLFK4UBJRRFVOP2YVLDFL7": {"origin": "ブラジル",                                 "gtin": "4595433537262", "weight": "200g"},
    "UV5PRPS3UPDTSQZD2UZZNCPE": {"origin": "ブラジル",                                 "gtin": "4595433537125", "weight": "500g"},
    "H3TAMGVN5WN3ZUMTDAB7QPMM": {"origin": "ブラジル",                                 "gtin": "4595433537132", "weight": "1kg"},
    "WAAQFZ47CDFKJHVYVTOJN53V": {"origin": "ブラジル",                                 "gtin": "4595433537583", "weight": "1kg"},
    "X52BT3P7IHNZ3HW33G4IJVBN": {"origin": "コロンビア",                               "gtin": "4595433537217", "weight": "100g"},
    "QZ5RAEPQ5K7WMFBQNSZZITKG": {"origin": "コロンビア",                               "gtin": "4595433537064", "weight": "200g"},
    "EPPVTOSJWTWW23IHWGZGLE52": {"origin": "エルサルバドル",                           "gtin": "4595433537224", "weight": "100g"},
    "3OIGP5Z3FT7JKGLGZFF5SGX7": {"origin": "エルサルバドル",                           "gtin": "4595433537057", "weight": "200g"},
    "BG6MXFWV3RDHVOVG5C32LCUI": {"origin": "エチオピア",                               "gtin": "4595433537194", "weight": "100g"},
    "AYN7WSHAO6UXQFWLX5RHAGHQ": {"origin": "エチオピア",                               "gtin": "4595433537088", "weight": "200g"},
    "ITLMWP4YUNYIT54BSV4RCVZK": {"origin": "ブラジル・グアテマラ・エチオピア",         "gtin": "4595433537149", "weight": "100g"},
    "SKL5SESHRYWEK4VO4KBPOXC3": {"origin": "ブラジル・グアテマラ・エチオピア",         "gtin": "4595433537019", "weight": "200g"},
    "BK6RATDHY2K2ZXSIQSWCO3DR": {"origin": "ブラジル・グアテマラ・エチオピア",         "gtin": "4595433537156", "weight": "500g"},
    "YIYHD3RQSDLVX3BCGM3HQ6D2": {"origin": "ブラジル・グアテマラ・エチオピア",         "gtin": "4595433537163", "weight": "1kg"},
    "J6SP5QDW2CVEEHV53VPWNA5B": {"origin": "グアテマラ",                               "gtin": "4595433537255", "weight": "100g"},
    "QIAG4B7VX5UDCD4MO6SYUGFU": {"origin": "グアテマラ",                               "gtin": "4595433537033", "weight": "200g"},
    "MP3MTM3VJWYID6BHLN3PPI6Z": {"origin": "グアテマラ",                               "gtin": "4595433537248", "weight": "100g"},
    "ORITSUGSNKT7CTXYN3WB74MV": {"origin": "グアテマラ",                               "gtin": "4595433537026", "weight": "200g"},
    "NWBQWQERIMWBILYFF7RJQAEP": {"origin": "ジャマイカ",                               "gtin": "4595433537170", "weight": "100g"},
    "PXEGWTD4IACW2F4V7MRXFP3O": {"origin": "ジャマイカ",                               "gtin": "4595433537101", "weight": "200g"},
    "YFUKJQ3JYOL2AMVLCLGPMR3B": {"origin": "パプアニューギニア",                       "gtin": "4595433537231", "weight": "100g"},
    "66IK3J2KKJI7KWZNERX5IE7I": {"origin": "パプアニューギニア",                       "gtin": "4595433537040", "weight": "200g"},
    "YJNNL7E6374FFROSPDJ6UY4S": {"origin": "パプアニューギニア",                       "gtin": "4595433537569", "weight": "500g"},
    "56F5QTNKGF22N2OHJZ2O36VZ": {"origin": "パプアニューギニア",                       "gtin": "4595433537576", "weight": "1kg"},
    "OL23KOSQI4VHZED4OVQL4NHX": {"origin": "タンザニア",                               "gtin": "4595433537200", "weight": "100g"},
    "FPTRHCDNLHKPV3KBKWKF56KC": {"origin": "タンザニア",                               "gtin": "4595433537071", "weight": "200g"},
    "3ZBUSOW4PE3ZAOLV3MP5IGOC": {"origin": "イエメン",                                  "gtin": "4595433537187", "weight": "100g"},
    "FSNKBMYIV224WKF65RUEDXVY": {"origin": "イエメン",                                  "gtin": "4595433537095", "weight": "200g"},
}

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("CREATE TABLE IF NOT EXISTS printed_orders (event_id TEXT PRIMARY KEY)")
    conn.commit()
    conn.close()


init_db()


def is_already_printed(event_id: str) -> bool:
    conn = sqlite3.connect(DB_FILE)
    row  = conn.execute("SELECT 1 FROM printed_orders WHERE event_id=?", (event_id,)).fetchone()
    conn.close()
    return row is not None


def mark_as_printed(event_id: str):
    conn = sqlite3.connect(DB_FILE)
    conn.execute("INSERT OR IGNORE INTO printed_orders (event_id) VALUES (?)", (event_id,))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Label image generation
# ---------------------------------------------------------------------------

def text_height(draw: ImageDraw.ImageDraw, font) -> int:
    bbox = draw.textbbox((0, 0), "あ", font=font)
    return bbox[3] - bbox[1]


def generate_barcode_image(code: str) -> Image.Image:
    EAN = barcode.get_barcode_class("ean13")
    ean = EAN(code, writer=ImageWriter())
    out = "/tmp/food_label_barcode"
    ean.save(out)
    # Load the pixel data into memory and return a detached copy so the temp
    # file handle is not held open.  This is safe with a single worker thread
    # but the copy() also makes it robust if concurrency is ever added.
    img = Image.open(out + ".png")
    img.load()
    return img.copy()


def build_label(origin: str, weight: str, form: str, barcode_number: str) -> Image.Image:
    width_px  = PRINT_LENGTH_PX
    height_px = TAPE_WIDTH_PX
    margin    = 8
    left      = margin
    top       = margin
    right     = width_px - margin
    COL_W     = 130

    today       = datetime.now()
    expiry_date = today + relativedelta(months=2 if form == "粉" else 4)
    expiry_str  = expiry_date.strftime("%Y年%m月")

    font_path      = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
    font_bold_path = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"

    try:
        font_header = ImageFont.truetype(font_bold_path, 24)
        font_value  = ImageFont.truetype(font_path, 24)
    except Exception:
        font_header = ImageFont.load_default()
        font_value  = font_header

    tmp    = ImageDraw.Draw(Image.new("RGB", (width_px, 100), "white"))
    line_h = text_height(tmp, font_value)

    rows = [
        ("品名",           [f"レギュラーコーヒー（{form}）"]),
        ("原材料",         ["コーヒー豆", f"生豆原産国（{origin}）"]),
        ("内容量",         [weight]),
        ("賞味期限",       [expiry_str]),
        ("保存方法",       ["高温多湿・直射日光を避けて保存"]),
        ("使用上の\n注意", ["開封後は早めにお召し上がりください"]),
        ("販売者",         ["株式会社FELICITY", "神奈川県三浦郡葉山町上山口2432-3"]),
    ]

    weights        = [1, 1.6, 1, 1, 1, 1.2, 1.8]
    barcode_area_h = 200
    table_bottom   = height_px - barcode_area_h - margin
    table_h        = table_bottom - top
    total_w        = sum(weights)
    row_heights    = [table_h * w / total_w for w in weights]

    img  = Image.new("RGB", (width_px, height_px), "white")
    draw = ImageDraw.Draw(img)

    draw.rectangle((left, top, right, height_px - margin), outline="black", width=3)

    # Draw the vertical column separator once, outside the row loop.
    draw.line((left + COL_W, top, left + COL_W, table_bottom), fill="black", width=2)

    y = top
    for (label, val_lines), row_h in zip(rows, row_heights):
        draw.line((left, y, right, y), fill="black", width=2)
        ly = y + 6
        for ll in label.split("\n"):
            draw.text((left + 8, ly), ll, font=font_header, fill="black")
            ly += line_h
        vy    = y + 6
        extra = 6 if label == "原材料" else 4
        for vl in val_lines:
            draw.text((left + COL_W + 8, vy), vl, font=font_value, fill="black")
            vy += line_h + extra
        y += row_h

    draw.line((left, table_bottom, right, table_bottom), fill="black", width=2)

    bc_img = generate_barcode_image(barcode_number)
    bc_img.thumbnail((width_px - 20, barcode_area_h - 10))
    bx = (width_px - bc_img.width) // 2
    by = table_bottom + (barcode_area_h - bc_img.height) // 2
    img.paste(bc_img, (bx, by))

    return img


# ---------------------------------------------------------------------------
# Printer networking helpers
# ---------------------------------------------------------------------------

def _tcp_connect(ip: str, port: int, timeout: float = 2.0) -> bool:
    """Attempt a single TCP connection. Returns True on success."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((ip, port))
        s.close()
        return True
    except Exception:
        return False


def wake_printer(poll_timeout: float = 20.0) -> bool:
    """
    Wake the QL-820NWB from sleep.

    Strategy:
    1. Poke port 80 (HTTP) to wake the network stack.
    2. Poll port 9100 (RAW printing) for up to `poll_timeout` seconds;
       the printer needs 5-15 s after the first touch before port 9100
       is ready to accept a print job.

    Returns True when port 9100 is confirmed open, False on timeout.
    """
    print(f"[wake_printer] Poking port 80 on {PRINTER_IP}…", flush=True)
    _tcp_connect(PRINTER_IP, 80, timeout=2.0)   # fire-and-forget wake poke

    deadline = time.monotonic() + poll_timeout
    attempt  = 0
    while time.monotonic() < deadline:
        attempt += 1
        if _tcp_connect(PRINTER_IP, 9100, timeout=2.0):
            print(f"[wake_printer] Port 9100 open after {attempt} poll(s).", flush=True)
            return True
        remaining = deadline - time.monotonic()
        sleep_s   = min(1.0, remaining)
        if sleep_s <= 0:
            break
        time.sleep(sleep_s)

    print(f"[wake_printer] Port 9100 not reachable after {poll_timeout}s.", flush=True)
    return False


# ---------------------------------------------------------------------------
# Printer keepalive daemon (prevents sleep between orders)
# ---------------------------------------------------------------------------

_KEEPALIVE_INTERVAL = 600   # seconds — touch the printer every 10 minutes


def _keepalive_worker():
    """Background daemon: touch port 9100 every KEEPALIVE_INTERVAL seconds."""
    while True:
        time.sleep(_KEEPALIVE_INTERVAL)
        print("[keepalive] Touching printer to prevent sleep…", flush=True)
        _tcp_connect(PRINTER_IP, 9100, timeout=3.0)


_keepalive_thread = threading.Thread(target=_keepalive_worker, name="printer-keepalive", daemon=True)
_keepalive_thread.start()


# ---------------------------------------------------------------------------
# Print queue — single worker serialises all jobs
# ---------------------------------------------------------------------------

# Each item is a dict:
#   {"img": PIL.Image, "label": str, "order_id": str | None}
_print_queue: queue.Queue = queue.Queue()


def _print_worker():
    """Single worker thread — dequeues and prints jobs one at a time."""
    while True:
        job = _print_queue.get()
        try:
            img      = job["img"]
            label    = job.get("label", "unknown")
            order_id = job.get("order_id")
            print(f"[print_worker] Starting job: {label} (order={order_id})", flush=True)
            success  = _send_to_printer_direct(img)
            if not success:
                log_failed_print(
                    order_id        = order_id or "",
                    product_name    = job.get("product_name", ""),
                    variation_id    = job.get("variation_id", ""),
                    quantity        = 1,
                    origin          = job.get("origin", ""),
                    gtin            = job.get("gtin", ""),
                    weight          = job.get("weight", ""),
                    form            = job.get("form", ""),
                )
        except Exception as e:
            print(f"[print_worker] Unexpected error: {e}", flush=True)
        finally:
            _print_queue.task_done()


_worker_thread = threading.Thread(target=_print_worker, name="printer-worker", daemon=True)
_worker_thread.start()


def enqueue_print(img: Image.Image, **meta):
    """Add a print job to the queue (non-blocking)."""
    job = {"img": img, **meta}
    _print_queue.put(job)
    print(f"[enqueue_print] Job queued. Queue depth: {_print_queue.qsize()}", flush=True)


# ---------------------------------------------------------------------------
# Core printer send (called only from _print_worker)
# ---------------------------------------------------------------------------

def _send_to_printer_direct(img: Image.Image, max_retries: int = 6) -> bool:
    """
    Send a rasterised image to the printer.
    Called exclusively from _print_worker (serialised — no Lock needed).
    wake_printer() blocks until port 9100 is confirmed open.
    """
    printer_ready = wake_printer(poll_timeout=20.0)
    if not printer_ready:
        # Still try — sometimes the connect check is a false negative
        print("[send] wake_printer timed out; attempting print anyway…", flush=True)

    for attempt in range(max_retries):
        try:
            qlr          = BrotherQLRaster(PRINTER_MODEL)
            instructions = convert(
                qlr=qlr, images=[img], label=LABEL_IDENTIFIER,
                rotate="90", threshold=70, dither=False,
                compress=True, red=False, dpi_600=False, cut=True,
            )
            send(
                instructions=instructions,
                printer_identifier=PRINTER_IP,
                backend_identifier="network",
            )
            print(f"[send] Print succeeded on attempt {attempt + 1}.", flush=True)
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                wait_s = min(2 ** attempt, 10)
                print(
                    f"[send] Attempt {attempt + 1}/{max_retries} failed: {e}. "
                    f"Re-waking printer, retrying in {wait_s}s…",
                    flush=True,
                )
                wake_printer(poll_timeout=15.0)
                time.sleep(wait_s)
            else:
                err_msg = (
                    f"❌ Printer OFFLINE after {max_retries} attempts\n\n"
                    f"Last error: {e}\n"
                    f"Printer IP: {PRINTER_IP}\n"
                    f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                )
                print(f"[send] CRITICAL: {err_msg}", flush=True)
                send_telegram_alert(err_msg)
                return False
    # Unreachable: every loop iteration either returns True (success) or
    # returns False on the final attempt via the else branch above.
    # Kept as a defensive fallback.
    return False  # pragma: no cover


# Public alias kept for test mode / direct calls
def send_to_printer(img: Image.Image) -> bool:
    return _send_to_printer_direct(img)


# ---------------------------------------------------------------------------
# Square API
# ---------------------------------------------------------------------------

def fetch_order_details(order_id: str):
    if not SQUARE_ACCESS_TOKEN:
        print("ERROR: SQUARE_ACCESS_TOKEN not set", flush=True)
        return None
    url     = f"{SQUARE_API_BASE}/v2/orders/{order_id}"
    headers = {
        "Square-Version": "2024-12-18",
        "Authorization":  f"Bearer {SQUARE_ACCESS_TOKEN}",
        "Content-Type":   "application/json",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"ERROR fetching order {order_id}: {e}", flush=True)
        return None


# ---------------------------------------------------------------------------
# Failed-print log
# ---------------------------------------------------------------------------

def log_failed_print(order_id, product_name, variation_id, quantity, origin, gtin, weight, form):
    failed_log   = "failed_prints.json"
    failed_entry = {
        "timestamp":    datetime.now().isoformat(),
        "order_id":     order_id,
        "product_name": product_name,
        "variation_id": variation_id,
        "quantity":     quantity,
        "origin":       origin,
        "gtin":         gtin,
        "weight":       weight,
        "form":         form,
    }
    try:
        with open(failed_log, "r", encoding="utf-8") as f:
            failed_prints = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        failed_prints = []
    failed_prints.append(failed_entry)
    with open(failed_log, "w", encoding="utf-8") as f:
        json.dump(failed_prints, f, indent=2, ensure_ascii=False)
    print(f"[log_failed_print] Logged failure for order {order_id}", flush=True)


# ---------------------------------------------------------------------------
# Webhook handler — returns 200 immediately, enqueues work
# ---------------------------------------------------------------------------

@app.route("/square_food_label", methods=["POST"])
def square_food_label():
    data = request.json or {}

    if data.get("type") != "order.created":
        return jsonify({"status": "ignored"}), 200

    event_id = data.get("event_id")
    if not event_id:
        return jsonify({"status": "no_event_id"}), 400

    # Idempotency: mark as printed immediately so Square retries are harmless.
    if is_already_printed(event_id):
        print(f"[webhook] Duplicate event {event_id} — ignored.", flush=True)
        return jsonify({"status": "duplicate"}), 200

    mark_as_printed(event_id)
    print(f"[webhook] Event {event_id} accepted; processing in background.", flush=True)

    # Kick off background processing so we return 200 before Square's timeout.
    def process_order():
        try:
            order_id = data["data"]["object"]["order_created"]["order_id"]
        except KeyError:
            print(f"[process_order] No order_id in event {event_id}", flush=True)
            return

        order_details = fetch_order_details(order_id)
        if not order_details:
            print(f"[process_order] Could not fetch order {order_id}", flush=True)
            return

        try:
            line_items = order_details["order"]["line_items"]
        except KeyError:
            print(f"[process_order] No line_items in order {order_id}", flush=True)
            return

        for item in line_items:
            variation_id = item.get("catalog_object_id")
            product_name = item.get("name", "")
            quantity     = int(item.get("quantity", "1"))

            if not variation_id or variation_id not in PRODUCTS:
                print(f"[process_order] Skipping unknown variation {variation_id}", flush=True)
                continue

            product_info = PRODUCTS[variation_id]
            origin       = product_info["origin"]
            gtin         = product_info["gtin"]
            weight       = product_info["weight"]
            form         = "豆"
            for mod in item.get("modifiers", []):
                if mod.get("name") == "粉":
                    form = "粉"
                    break

            for i in range(quantity):
                img = build_label(origin, weight, form, gtin)
                enqueue_print(
                    img,
                    label        = f"{product_name} ({form}) #{i+1}/{quantity}",
                    order_id     = order_id,
                    product_name = product_name,
                    variation_id = variation_id,
                    origin       = origin,
                    gtin         = gtin,
                    weight       = weight,
                    form         = form,
                )

    t = threading.Thread(target=process_order, daemon=True)
    t.start()

    return jsonify({"status": "accepted"}), 200


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    printer_status = {"ip": PRINTER_IP, "reachable": False, "error": None}
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect((PRINTER_IP, 9100))
        s.close()
        printer_status["reachable"] = True
    except Exception as e:
        printer_status["error"] = str(e)

    db_status = {"ok": False, "printed_count": 0}
    try:
        conn = sqlite3.connect(DB_FILE)
        db_status["printed_count"] = conn.execute(
            "SELECT COUNT(*) FROM printed_orders"
        ).fetchone()[0]
        conn.close()
        db_status["ok"] = True
    except Exception as e:
        db_status["error"] = str(e)

    return jsonify({
        "status":       "ok",
        "printer":      printer_status,
        "db":           db_status,
        "queue_depth":  _print_queue.qsize(),
    })


# ---------------------------------------------------------------------------
# Manual print UI
# ---------------------------------------------------------------------------

# Build product list for the <select> in the manual UI
def _build_product_options() -> str:
    lines = []
    for vid, info in PRODUCTS.items():
        label = f"{info['origin']} — {info['weight']}"
        lines.append(f'<option value="{vid}">{label}</option>')
    return "\n".join(lines)


MANUAL_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FELICITY ラベル印刷</title>
  <style>
    :root {{
      --bg:      #0d0d0d;
      --surface: #1a1a1a;
      --border:  #2e2e2e;
      --accent:  #c8a26e;
      --text:    #e8e8e8;
      --muted:   #888;
      --success: #4caf50;
      --error:   #f44336;
      --warning: #ff9800;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
    }}
    h1 {{
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 0.08em;
      margin-bottom: 6px;
      text-align: center;
    }}
    .subtitle {{
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 28px;
      text-align: center;
    }}
    .card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px 20px;
      width: 100%;
      max-width: 480px;
      margin-bottom: 16px;
    }}
    .card h2 {{
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 16px;
    }}
    label {{
      display: block;
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 4px;
      margin-top: 14px;
    }}
    label:first-of-type {{ margin-top: 0; }}
    select, input[type="number"] {{
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 0.95rem;
      padding: 10px 12px;
      appearance: none;
      -webkit-appearance: none;
    }}
    select:focus, input[type="number"]:focus {{
      outline: none;
      border-color: var(--accent);
    }}
    .form-row {{
      display: flex;
      gap: 12px;
    }}
    .form-row > div {{ flex: 1; }}
    .radio-group {{
      display: flex;
      gap: 10px;
      margin-top: 6px;
    }}
    .radio-btn {{
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      cursor: pointer;
      font-size: 0.95rem;
      transition: border-color 0.15s, background 0.15s;
    }}
    .radio-btn.active {{
      border-color: var(--accent);
      background: rgba(200, 162, 110, 0.12);
      color: var(--accent);
      font-weight: 600;
    }}
    .btn-print {{
      display: block;
      width: 100%;
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      padding: 14px;
      margin-top: 20px;
      cursor: pointer;
      letter-spacing: 0.05em;
      transition: opacity 0.15s;
    }}
    .btn-print:disabled {{ opacity: 0.5; cursor: not-allowed; }}
    .btn-print:not(:disabled):hover {{ opacity: 0.85; }}
    .status-box {{
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 0.88rem;
      margin-top: 14px;
      display: none;
    }}
    .status-box.success {{ background: rgba(76,175,80,0.15); border: 1px solid var(--success); color: var(--success); display: block; }}
    .status-box.error   {{ background: rgba(244,67,54,0.15);  border: 1px solid var(--error);   color: var(--error);   display: block; }}
    .status-box.partial {{ background: rgba(255,152,0,0.15);  border: 1px solid var(--warning);  color: var(--warning); display: block; }}
    .status-box.loading {{ background: rgba(200,162,110,0.1); border: 1px solid var(--accent);   color: var(--accent);  display: block; }}
    .health-row {{
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }}
    .dot {{
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }}
    .dot.green {{ background: var(--success); box-shadow: 0 0 6px var(--success); }}
    .dot.red   {{ background: var(--error);   box-shadow: 0 0 6px var(--error);   }}
    .dot.grey  {{ background: var(--muted); }}
    .health-meta {{ font-size: 0.75rem; color: var(--muted); margin-top: 4px; }}
    footer {{
      font-size: 0.72rem;
      color: var(--muted);
      text-align: center;
      margin-top: 24px;
    }}
  </style>
</head>
<body>
  <h1>FELICITY ラベル印刷</h1>
  <p class="subtitle">食品安全ラベル 手動印刷システム</p>

  <!-- Printer status card -->
  <div class="card">
    <h2>プリンター状態</h2>
    <div class="health-row">
      <div class="dot grey" id="dot"></div>
      <span id="health-text">確認中…</span>
    </div>
    <div class="health-meta" id="health-meta"></div>
  </div>

  <!-- Print form card -->
  <div class="card">
    <h2>ラベル印刷</h2>

    <label>商品</label>
    <select id="product-select">
      <option value="">— 商品を選択 —</option>
      {product_options}
    </select>

    <label>挽き方</label>
    <div class="radio-group">
      <div class="radio-btn active" id="btn-mame" onclick="setForm('豆')">豆</div>
      <div class="radio-btn"       id="btn-kona" onclick="setForm('粉')">粉</div>
    </div>
    <input type="hidden" id="form-input" value="豆">

    <div class="form-row">
      <div>
        <label>枚数</label>
        <input type="number" id="qty-input" value="1" min="1" max="20">
      </div>
    </div>

    <button class="btn-print" id="print-btn" onclick="submitPrint()">印刷する</button>
    <div class="status-box" id="status-box"></div>
  </div>

  <footer>FELICITY Coffee ラベル印刷サーバー v2.0</footer>

  <script>
    let currentForm = '豆';

    function setForm(f) {{
      currentForm = f;
      document.getElementById('form-input').value = f;
      document.getElementById('btn-mame').classList.toggle('active', f === '豆');
      document.getElementById('btn-kona').classList.toggle('active', f === '粉');
    }}

    function setStatus(type, msg) {{
      const box = document.getElementById('status-box');
      box.className = 'status-box ' + type;
      box.textContent = msg;
    }}

    async function submitPrint() {{
      const variationId = document.getElementById('product-select').value;
      const form        = document.getElementById('form-input').value;
      const quantity    = parseInt(document.getElementById('qty-input').value) || 1;

      if (!variationId) {{
        setStatus('error', '商品を選択してください。');
        return;
      }}

      const btn = document.getElementById('print-btn');
      btn.disabled = true;
      setStatus('loading', '印刷ジョブを送信中…');

      try {{
        const resp = await fetch('/manual', {{
          method:  'POST',
          headers: {{'Content-Type': 'application/json'}},
          body:    JSON.stringify({{variation_id: variationId, form, quantity}}),
        }});
        const data = await resp.json();

        if (data.status === 'queued') {{
          setStatus('success', `✅ ${{data.queued}}枚のジョブをキューに追加しました。`);
        }} else if (data.status === 'error') {{
          setStatus('error', `❌ エラー: ${{data.message}}`);
        }} else {{
          setStatus('success', JSON.stringify(data));
        }}
      }} catch (e) {{
        setStatus('error', `通信エラー: ${{e.message}}`);
      }} finally {{
        btn.disabled = false;
      }}
    }}

    async function checkHealth() {{
      try {{
        const resp = await fetch('/health');
        const data = await resp.json();
        const dot  = document.getElementById('dot');
        const text = document.getElementById('health-text');
        const meta = document.getElementById('health-meta');

        if (data.printer.reachable) {{
          dot.className  = 'dot green';
          text.textContent = 'オンライン';
        }} else {{
          dot.className  = 'dot red';
          text.textContent = 'オフライン / スリープ中';
        }}
        meta.textContent =
          `キュー: ${{data.queue_depth}}件 ／ 印刷済み: ${{data.db.printed_count}}件 ／ IP: ${{data.printer.ip}}`;
      }} catch (e) {{
        document.getElementById('health-text').textContent = '取得失敗';
      }}
    }}

    checkHealth();
    setInterval(checkHealth, 30000);
  </script>
</body>
</html>
"""


@app.route("/manual", methods=["GET", "POST"])
def manual_print():
    if request.method == "POST":
        data         = request.json or {}
        variation_id = data.get("variation_id")
        form         = data.get("form", "豆")
        quantity     = int(data.get("quantity", 1))

        if not variation_id or variation_id not in PRODUCTS:
            return jsonify({"status": "error", "message": "Invalid product"}), 400

        p       = PRODUCTS[variation_id]
        queued  = 0
        for i in range(quantity):
            img = build_label(p["origin"], p["weight"], form, p["gtin"])
            enqueue_print(
                img,
                label        = f"Manual: {p['origin']} {p['weight']} ({form}) #{i+1}/{quantity}",
                order_id     = None,
                product_name = f"{p['origin']} {p['weight']}",
                variation_id = variation_id,
                origin       = p["origin"],
                gtin         = p["gtin"],
                weight       = p["weight"],
                form         = form,
            )
            queued += 1

        return jsonify({"status": "queued", "queued": queued})

    # GET — render the manual UI
    html = MANUAL_HTML_TEMPLATE.format(product_options=_build_product_options())
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}


# ---------------------------------------------------------------------------
# Staff app label print endpoint
# ---------------------------------------------------------------------------

@app.route("/label_print", methods=["POST"])
def label_print():
    """
    Called by the felicity-staff app (via /api/label-print proxy on Vercel).
    Body: {product_name, size, type: 'bean'|'ground', gtin, quantity, category}
    Returns immediately with queued count.
    """
    data         = request.json or {}
    product_name = data.get("product_name")
    size         = data.get("size")
    item_type    = data.get("type", "ground")   # 'bean' | 'ground'
    gtin         = data.get("gtin")
    quantity     = max(1, min(99, int(data.get("quantity", 1))))

    if not product_name or not size or not gtin:
        return jsonify({"error": "Missing required fields (product_name, size, gtin)"}), 400

    form   = "豆" if item_type == "bean" else "粉"
    queued = 0
    for i in range(quantity):
        img = build_label(product_name, size, form, gtin)
        enqueue_print(
            img,
            label        = f"Staff: {product_name} {size} ({form}) #{i+1}/{quantity}",
            order_id     = None,
            product_name = f"{product_name} {size}",
            variation_id = None,
            origin       = product_name,
            gtin         = gtin,
            weight       = size,
            form         = form,
        )
        queued += 1

    print(f"[label_print] Queued {queued} label(s): {product_name} {size} ({form})", flush=True)
    return jsonify({"status": "queued", "queued": queued})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        print("Test mode: printing a sample label directly…", flush=True)
        img = build_label("パプアニューギニア", "100g", "豆", "4902222222222")
        result = send_to_printer(img)
        print(f"Test print {'succeeded' if result else 'FAILED'}.", flush=True)
    else:
        send_telegram_alert(
            f"✅ Label Server STARTED\n"
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Printer: {PRINTER_IP}"
        )
        app.run(host="0.0.0.0", port=5000)
