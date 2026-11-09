import http.server
import socketserver
import socket

PORT = 8000

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for TV browsers
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    local_ip = get_local_ip()
    print("=" * 60)
    print(f" Servidor local para VIDAA (Hisense TV) iniciado con éxito!")
    print(f" URL local para abrir en tu Smart TV o Celular:")
    print(f"   http://{local_ip}:{PORT}/")
    print("=" * 60)
    print(" Asegúrate de que tu PC, tu celular y tu TV Hisense estén conectados a la misma red Wi-Fi.")
    print(" Presiona Ctrl+C para detener el servidor.")
    httpd.serve_forever()
