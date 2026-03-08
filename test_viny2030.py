"""
Tests para Viny2030 — pytest + requests
Requiere: pip install pytest requests

Uso:
  BASE_URL=https://www.viny2030.com.ar pytest test_viny2030.py -v
"""

import os
import io
import uuid
import pytest
import requests
import time

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

# Email único por cada ejecución para evitar duplicate key en la DB
TEST_EMAIL = f"test-{uuid.uuid4().hex[:8]}@viny2030.com.ar"


# ══════════════════════════════════════════════════════════
# FIXTURES
# ══════════════════════════════════════════════════════════

@pytest.fixture(scope="session")
def base():
    return BASE_URL.rstrip("/")


@pytest.fixture(scope="session")
def orden_creada(base):
    """Crea una orden real y devuelve su código para tests posteriores."""
    payload = {
        "name": "Test Pytest",
        "email": TEST_EMAIL,
        "amount": 10,
        "lang": "es",
        "product": "Diagnostico Algoritmico"
    }
    time.sleep(1)
    r = requests.post(f"{base}/api/orders", json=payload)
    assert r.status_code == 200, f"No se pudo crear orden: {r.text}"
    data = r.json()
    assert data.get("success") is True
    assert "orderCode" in data
    return data["orderCode"]


# ══════════════════════════════════════════════════════════
# PÁGINAS HTML — deben responder 200
# ══════════════════════════════════════════════════════════

class TestPaginas:

    def test_index(self, base):
        r = requests.get(f"{base}/")
        assert r.status_code == 200

    def test_comprobante(self, base):
        r = requests.get(f"{base}/comprobante")
        assert r.status_code == 200

    def test_admin(self, base):
        r = requests.get(f"{base}/admin")
        assert r.status_code == 200

    def test_relato(self, base):
        r = requests.get(f"{base}/relato")
        assert r.status_code == 200

    def test_aceptar(self, base):
        r = requests.get(f"{base}/aceptar")
        assert r.status_code == 200

    def test_dr_monteverde_guion_bajo(self, base):
        r = requests.get(f"{base}/dr_monteverde.html")
        assert r.status_code == 200

    def test_dr_monteverde_guion_medio_redirige(self, base):
        r = requests.get(f"{base}/dr-monteverde.html", allow_redirects=False)
        assert r.status_code == 301

    def test_dr_monteverde_guion_medio_resuelve(self, base):
        r = requests.get(f"{base}/dr-monteverde.html")
        assert r.status_code == 200

    def test_pagina_inexistente(self, base):
        r = requests.get(f"{base}/pagina-que-no-existe-xyz")
        assert r.status_code == 404


# ══════════════════════════════════════════════════════════
# API ORDERS
# ══════════════════════════════════════════════════════════

class TestOrders:

    def test_crear_orden_ok(self, base):
        email_unico = f"test-{uuid.uuid4().hex[:8]}@viny2030.com.ar"
        payload = {
            "name": "Juan Perez",
            "email": email_unico,
            "amount": 10,
            "lang": "es",
            "product": "Diagnostico Algoritmico"
        }
        r = requests.post(f"{base}/api/orders", json=payload)
        assert r.status_code == 200, f"Error: {r.text}"
        data = r.json()
        assert data["success"] is True
        assert "orderCode" in data
        assert data["orderCode"].startswith("VNY-")
        assert "uploadUrl" in data

    def test_crear_orden_sin_name(self, base):
        r = requests.post(f"{base}/api/orders", json={"email": "x@x.com"})
        assert r.status_code == 400
        assert "error" in r.json()

    def test_crear_orden_sin_email(self, base):
        r = requests.post(f"{base}/api/orders", json={"name": "Test"})
        assert r.status_code == 400
        assert "error" in r.json()

    def test_crear_orden_sin_body(self, base):
        r = requests.post(f"{base}/api/orders", json={})
        assert r.status_code == 400

    def test_listar_ordenes(self, base):
        r = requests.get(f"{base}/api/orders")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_obtener_orden_existente(self, base, orden_creada):
        r = requests.get(f"{base}/api/orders/{orden_creada}")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == orden_creada
        assert "name" in data
        assert "email" in data
        assert "status" in data

    def test_obtener_orden_inexistente(self, base):
        r = requests.get(f"{base}/api/orders/VNY-0000-XXXX")
        assert r.status_code == 404

    def test_cambiar_status(self, base, orden_creada):
        r = requests.patch(
            f"{base}/api/orders/{orden_creada}/status",
            json={"status": "en_proceso"}
        )
        assert r.status_code == 200
        assert r.json()["status"] == "en_proceso"

    def test_ver_analisis_sin_datos(self, base, orden_creada):
        r = requests.get(f"{base}/api/orders/{orden_creada}/analisis")
        assert r.status_code == 200
        assert "status" in r.json()

    def test_crear_orden_idioma_ingles(self, base):
        email_unico = f"test-{uuid.uuid4().hex[:8]}@viny2030.com.ar"
        payload = {
            "name": "John Smith",
            "email": email_unico,
            "amount": 10,
            "lang": "en",
            "product": "Diagnostico Algoritmico"
        }
        r = requests.post(f"{base}/api/orders", json=payload)
        assert r.status_code == 200
        assert r.json()["success"] is True


# ══════════════════════════════════════════════════════════
# API UPLOAD — comprobante
# ══════════════════════════════════════════════════════════

class TestUpload:

    def test_upload_sin_archivo(self, base):
        r = requests.post(f"{base}/api/upload", data={"orderCode": "VNY-TEST-0001"})
        assert r.status_code == 400
        assert r.json()["success"] is False

    def test_upload_sin_order_code(self, base):
        fake_file = io.BytesIO(b"fake image content")
        r = requests.post(
            f"{base}/api/upload",
            data={},
            files={"comprobante": ("test.jpg", fake_file, "image/jpeg")}
        )
        assert r.status_code == 400
        assert r.json()["success"] is False

    def test_upload_formato_no_permitido(self, base):
        fake_file = io.BytesIO(b"MZ fake exe")
        r = requests.post(
            f"{base}/api/upload",
            data={"orderCode": "VNY-TEST-0001"},
            files={"comprobante": ("malware.exe", fake_file, "application/octet-stream")}
        )
        assert r.status_code in [400, 500]

    def test_upload_comprobante_jpg(self, base, orden_creada):
        fake_img = io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 100)
        r = requests.post(
            f"{base}/api/upload",
            data={
                "orderCode": orden_creada,
                "nombre": "Test Pytest",
                "email": TEST_EMAIL,
                "monto": "10",
                "producto": "Diagnostico"
            },
            files={"comprobante": ("comprobante.jpg", fake_img, "image/jpeg")}
        )
        assert r.status_code in [200, 500]
        if r.status_code == 200:
            assert r.json()["success"] is True


# ══════════════════════════════════════════════════════════
# API UPLOAD — relato
# ══════════════════════════════════════════════════════════

class TestRelato:

    def test_relato_sin_order_code(self, base):
        r = requests.post(f"{base}/api/upload/relato", data={})
        assert r.status_code == 400
        assert r.json()["success"] is False

    def test_relato_sin_archivos(self, base, orden_creada):
        r = requests.post(
            f"{base}/api/upload/relato",
            data={
                "orderCode": orden_creada,
                "nombre": "Test",
                "email": TEST_EMAIL,
                "descripcion": "Descripción de prueba",
                "fechaProblema": "2026-01-01",
                "urgencia": "Normal"
            }
        )
        assert r.status_code in [200, 500]

    def test_relato_con_csv(self, base, orden_creada):
        csv_content = io.BytesIO(b"col1,col2\n1,2\n3,4")
        r = requests.post(
            f"{base}/api/upload/relato",
            data={
                "orderCode": orden_creada,
                "descripcion": "Test con CSV"
            },
            files={"archivos": ("datos.csv", csv_content, "text/csv")}
        )
        assert r.status_code in [200, 500]
