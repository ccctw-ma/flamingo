const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    // 解析请求的 URL
    const parsedUrl = url.parse(req.url, true);

    // 处理不同的路由
    if (parsedUrl.pathname === '/') {
        // 处理根路由
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("Hello world")
    } else if (parsedUrl.pathname === '/api/data' && req.method === 'POST') {
        // 处理 POST 请求的 /api/data 路由
        let data = '';

        // 接收请求体数据
        req.on('data', chunk => {
            data += chunk;
        });

        // 处理请求结束事件
        req.on('end', () => {
            const jsonData = JSON.parse(data);
            console.log('Received data:', jsonData);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Data received successfully!' }));
        });
    } else {
        // 处理未知路由
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const port = 3000;

// 启动服务器
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
