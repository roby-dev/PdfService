import io
import json
import sys
from pathlib import Path

import pikepdf
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import app as app_module


def make_pdf(pages=3):
    pdf = pikepdf.Pdf.new()
    for _ in range(pages):
        pdf.add_blank_page()
    stream = io.BytesIO()
    pdf.save(stream)
    pdf.close()
    stream.seek(0)
    return stream


def page_count(response):
    with pikepdf.Pdf.open(io.BytesIO(response.data)) as pdf:
        return len(pdf.pages)


@pytest.fixture
def client():
    app_module.ip_requests.clear()
    return app_module.app.test_client()


def post_merge_without_files(client, forwarded_for):
    return client.post('/api/merge', headers={'X-Forwarded-For': forwarded_for})


def test_rate_limit_cannot_be_bypassed_by_spoofing_forwarded_for(client):
    # nginx appends the real client last; anything before it is client-supplied.
    for i in range(15):
        assert post_merge_without_files(client, f'10.0.0.{i}, 203.0.113.1').status_code == 400

    response = post_merge_without_files(client, '10.0.0.99, 203.0.113.1')

    assert response.status_code == 429
    assert 'error' in response.get_json()


def test_rate_limit_is_tracked_per_real_client(client):
    for _ in range(15):
        post_merge_without_files(client, '203.0.113.1')

    assert post_merge_without_files(client, '203.0.113.1').status_code == 429
    assert post_merge_without_files(client, '203.0.113.2').status_code == 400


def test_rate_limiter_forgets_clients_whose_window_expired(client, monkeypatch):
    post_merge_without_files(client, '203.0.113.1')

    later = app_module.time.time() + 61
    monkeypatch.setattr(app_module.time, 'time', lambda: later)
    post_merge_without_files(client, '203.0.113.2')

    assert '203.0.113.1' not in app_module.ip_requests


def test_invalid_pdf_returns_400_without_internal_details(client):
    response = client.post('/api/merge', data={
        'files': [
            (io.BytesIO(b'not a pdf'), 'a.pdf'),
            (io.BytesIO(b'not a pdf'), 'b.pdf'),
        ],
    })

    assert response.status_code == 400
    assert response.get_json() == {
        'error': 'El archivo PDF no es válido, está dañado o protegido con contraseña'
    }


def test_unexpected_error_returns_500_without_internal_details(client, monkeypatch):
    def explode():
        raise RuntimeError('/secret/internal/path')

    files = [(make_pdf(), 'a.pdf'), (make_pdf(), 'b.pdf')]
    monkeypatch.setattr(app_module.pikepdf.Pdf, 'new', explode)

    response = client.post('/api/merge', data={'files': files})

    assert response.status_code == 500
    assert response.get_json() == {'error': 'No se pudo procesar el archivo'}


def test_delete_pages_ignores_duplicates_when_checking_all_pages(client):
    response = client.post('/api/delete-pages', data={
        'file': (make_pdf(3), 'a.pdf'),
        'pages': json.dumps([1, 1, 1]),
    })

    assert response.status_code == 200
    assert page_count(response) == 2


def test_delete_pages_still_rejects_deleting_every_page(client):
    response = client.post('/api/delete-pages', data={
        'file': (make_pdf(3), 'a.pdf'),
        'pages': json.dumps([1, 2, 3]),
    })

    assert response.status_code == 400
    assert response.get_json() == {'error': 'No se pueden eliminar todas las páginas'}


def test_oversized_request_returns_json_413(client, monkeypatch):
    monkeypatch.setitem(app_module.app.config, 'MAX_CONTENT_LENGTH', 1024)

    response = client.post('/api/merge', data={
        'files': [(io.BytesIO(b'x' * 2048), 'a.pdf')],
    })

    assert response.status_code == 413
    assert 'error' in response.get_json()


def test_merge_still_combines_pdfs(client):
    response = client.post('/api/merge', data={
        'files': [(make_pdf(2), 'a.pdf'), (make_pdf(3), 'b.pdf')],
    })

    assert response.status_code == 200
    assert page_count(response) == 5


def test_reorder_still_reorders_and_rotates(client):
    response = client.post('/api/reorder-rotate', data={
        'file': (make_pdf(2), 'a.pdf'),
        'order': json.dumps([2, 1]),
        'rotations': json.dumps({'2': 90}),
    })

    assert response.status_code == 200
    with pikepdf.Pdf.open(io.BytesIO(response.data)) as pdf:
        assert len(pdf.pages) == 2
        assert int(pdf.pages[0]['/Rotate']) == 90


def test_to_markdown_still_converts_csv(client):
    response = client.post('/api/to-markdown', data={
        'file': (io.BytesIO(b'name,age\nAna,30\n'), 'people.csv'),
    })

    assert response.status_code == 200
    body = response.get_json()
    assert body['filename'] == 'people.csv'
    assert 'Ana' in body['markdown']
