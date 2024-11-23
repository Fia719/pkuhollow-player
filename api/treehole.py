from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_folder='../treehole.pku.edu.cn/', template_folder='../treehole.pku.edu.cn')

@app.route('/')
@app.route('/web')
def serve_index():
    return render_template('web/index.html')

@app.route('/version')
def version():
    return render_template('version.html')

@app.route('/api/pku/tags')
def tags():
    return render_template('tags.html')

@app.route('/modify.js')
def modify():
    return render_template('modify.js')

@app.route('/import_data.js')
def import_data():
    return render_template('import_data.js')


@app.route('/api/pku/manager_spec')
def m_s():
    return render_template('manager_spec.json')

@app.route('/web/<path:path>')
def serve_assets(path):
    return send_from_directory(app.static_folder+ '/web/', path)



@app.route('/<path:path>')
def serve_static_files(path):
    resp = send_from_directory(app.static_folder + '/web/', path)
    return resp



# if __name__ == '__main__':
#     app.run(
#         host='0.0.0.0',
#         port=500,
#         debug=False
#     )