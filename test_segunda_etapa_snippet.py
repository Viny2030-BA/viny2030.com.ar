# ══════════════════════════════════════════════════════════
# SEGUNDA ETAPA — comprobante2 e informe2
# ══════════════════════════════════════════════════════════

class TestSegundaEtapa:

    def test_comprobante2_sin_archivo(self, base):
        """Upload comprobante2 sin archivo → debe rechazar"""
        r = requests.post(f"{base}/api/upload/comprobante2", data={"orderCode": "VNY-TEST-0001"})
        assert r.status_code == 400
        assert r.json()["success"] is False

    def test_comprobante2_sin_order_code(self, base):
        """Upload comprobante2 sin orderCode → debe rechazar"""
        fake_file = io.BytesIO(b"fake image content")
        r = requests.post(
            f"{base}/api/upload/comprobante2",
            data={},
            files={"comprobante": ("test.jpg", fake_file, "image/jpeg")}
        )
        assert r.status_code == 400
        assert r.json()["success"] is False

    def test_informe2_sin_campos(self, base, orden_creada):
        """POST informe2 sin analisis/propuesta → debe rechazar con 400"""
        r = requests.post(
            f"{base}/api/orders/{orden_creada}/informe2",
            json={}
        )
        assert r.status_code == 400
        assert "error" in r.json()

    def test_informe2_orden_inexistente(self, base):
        """POST informe2 a orden que no existe → 404"""
        r = requests.post(
            f"{base}/api/orders/VNY-0000-XXXXX/informe2",
            json={"analisis": "Test análisis", "propuesta": "Test propuesta"}
        )
        assert r.status_code == 404
