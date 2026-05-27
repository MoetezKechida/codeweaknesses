const http = require('http');
const fs = require('fs');
const out = 'webhook-capture.json';
const server = http.createServer((req,res)=>{
  let body='';
  req.on('data',c=>body+=c);
  req.on('end',()=>{
    const payload = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body,
      receivedAt: new Date().toISOString()
    };
    fs.writeFileSync(out, JSON.stringify(payload, null, 2));
    res.writeHead(204);
    res.end();
  });
});
server.listen(9090, ()=>console.log('Webhook capture listening on 9090'));
