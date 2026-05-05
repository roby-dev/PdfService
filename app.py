from flask import Flask, request, send_file, send_from_directory, jsonify
import pikepdf
import io
import os
import json

app = Flask(__name__)

# Aumentar límite de subida a 100MB
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024 

@app.route('/lib/<path:filename>')
def serve_lib(filename):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(os.path.join(base_dir, 'lib'), filename)

@app.route('/fonts/<path:filename>')
def serve_fonts(filename):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(os.path.join(base_dir, 'fonts'), filename)

@app.route('/')
@app.route('/index.html')
def index():
    # Obtenemos la ruta absoluta de la carpeta donde está este script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Unimos la ruta con el nombre del archivo
    file_path = os.path.join(base_dir, 'index.html')
    
    # Verificación de seguridad (Opcional, para debug)
    if not os.path.exists(file_path):
        return f"ERROR: No encuentro el archivo en: {file_path}", 404
        
    return send_file(file_path)

@app.route('/eliminar.html')
def eliminar():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'eliminar.html')
    if not os.path.exists(file_path):
        return f"ERROR: No encuentro el archivo en: {file_path}", 404
    return send_file(file_path)

@app.route('/reordenar.html')
def reordenar():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'reordenar.html')
    if not os.path.exists(file_path):
        return f"ERROR: No encuentro el archivo en: {file_path}", 404
    return send_file(file_path)

@app.route('/api/merge', methods=['POST'])
def merge_pdfs():
    if 'files' not in request.files:
         return jsonify({"error": "No se enviaron archivos"}), 400

    files = request.files.getlist('files')
    
    if len(files) < 2:
        return jsonify({"error": "Se requieren al menos 2 PDFs"}), 400

    try:
        # Buffer en memoria para el PDF final
        output_stream = io.BytesIO()
        
        # Creamos el PDF destino
        pdf_final = pikepdf.Pdf.new()
        
        # Mantener referencias a los PDFs abiertos para evitar que se cierren antes de guardar
        sources = []

        for file in files:
            # pikepdf puede leer directamente del stream de Flask (file.stream)
            pdf_source = pikepdf.Pdf.open(file.stream)
            sources.append(pdf_source)
            pdf_final.pages.extend(pdf_source.pages)

        # Guardamos en el buffer de memoria
        pdf_final.save(output_stream)
        
        # Cerramos todo explícitamente
        pdf_final.close()
        for src in sources:
            src.close()
        
        # Rebobinamos el puntero al inicio del stream
        output_stream.seek(0)

        return send_file(
            output_stream,
            as_attachment=True,
            download_name='unido.pdf',
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete-pages', methods=['POST'])
def delete_pages():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    
    if 'pages' not in request.form:
        return jsonify({"error": "No se especificaron páginas a eliminar"}), 400

    file = request.files['file']
    
    try:
        pages_to_delete = json.loads(request.form['pages'])
    except (json.JSONDecodeError, ValueError):
        return jsonify({"error": "Formato inválido para las páginas"}), 400

    if not isinstance(pages_to_delete, list) or len(pages_to_delete) == 0:
        return jsonify({"error": "Debe especificar al menos una página a eliminar"}), 400

    try:
        pdf = pikepdf.Pdf.open(file.stream)
        total = len(pdf.pages)

        # Validar que no se eliminen todas las páginas
        if len(pages_to_delete) >= total:
            pdf.close()
            return jsonify({"error": "No se pueden eliminar todas las páginas"}), 400

        # Convertir a índices 0-based y ordenar en reversa para eliminar sin desplazar índices
        indices = sorted(set(p - 1 for p in pages_to_delete if 1 <= p <= total), reverse=True)

        for idx in indices:
            del pdf.pages[idx]

        output_stream = io.BytesIO()
        pdf.save(output_stream)
        pdf.close()
        output_stream.seek(0)

        return send_file(
            output_stream,
            as_attachment=True,
            download_name='editado.pdf',
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reorder-rotate', methods=['POST'])
def reorder_rotate():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400

    file = request.files['file']

    try:
        order = json.loads(request.form.get('order', '[]'))
        rotations = json.loads(request.form.get('rotations', '{}'))
    except (json.JSONDecodeError, ValueError):
        return jsonify({"error": "Formato inválido para orden o rotaciones"}), 400

    try:
        pdf = pikepdf.Pdf.open(file.stream)
        total = len(pdf.pages)

        if not order:
            order = list(range(1, total + 1))

        # Validate all page numbers
        if any(p < 1 or p > total for p in order):
            pdf.close()
            return jsonify({"error": "Número de página fuera de rango"}), 400

        output_pdf = pikepdf.Pdf.new()

        for orig_page_num in order:
            output_pdf.pages.append(pdf.pages[orig_page_num - 1])

        # Apply additional rotation on top of each page's existing /Rotate
        for out_idx, orig_page_num in enumerate(order):
            additional = int(rotations.get(str(orig_page_num), 0))
            if additional != 0:
                out_page = output_pdf.pages[out_idx]
                existing = int(out_page.get('/Rotate', 0))
                out_page['/Rotate'] = (existing + additional) % 360

        output_stream = io.BytesIO()
        output_pdf.save(output_stream)
        output_pdf.close()
        pdf.close()
        output_stream.seek(0)

        return send_file(
            output_stream,
            as_attachment=True,
            download_name='reordenado.pdf',
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run()