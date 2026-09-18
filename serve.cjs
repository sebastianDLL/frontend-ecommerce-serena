const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, 'dist');
const mime = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.json': 'application/json',
};

function resolveSafePath(reqPath) {
	const decoded = decodeURIComponent(reqPath.split('?')[0]);
	const relative = decoded === '/' ? 'index.html' : decoded.replace(/^[/\\]+/, '');
	const resolved = path.resolve(dir, relative);
	const inside = resolved === dir || resolved.startsWith(dir + path.sep);
	return inside ? resolved : null;
}

function findFile(reqPath) {
	const base = resolveSafePath(reqPath);
	if (!base) return null;

	const candidates = [base, `${base}.html`, path.join(base, 'index.html')];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
	}
	return null;
}

const server = http.createServer((req, res) => {
	const filePath = findFile(req.url || '/');

	if (!filePath) {
		res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		res.end('Not found');
		return;
	}

	const ext = path.extname(filePath);
	res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
	fs.createReadStream(filePath).pipe(res);
});

const PORT = 4321;
server.listen(PORT, '127.0.0.1', () => {
	console.log(`SERENA Storefront running at http://127.0.0.1:${PORT}`);
});
