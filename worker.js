addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    // 获取请求的URL和方法
    const url = new URL(request.url)
    const method = request.method
    
    // 如果是API请求
    if (url.pathname === '/api/query' && method === 'POST') {
      try {
        const requestData = await request.json()
        const ip = requestData.ip
        
        // 第一步：获取IP的地理位置信息
        const ipLocResponse = await fetch(`https://apimobile.meituan.com/locate/v2/ip/loc?rgeo=true&ip=${ip}`)
        const ipLocData = await ipLocResponse.json()
        
        if (!ipLocData.data) {
          return new Response(JSON.stringify({ error: '无法获取IP地理位置信息' }), {
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        const { lng, lat } = ipLocData.data
        
        // 第二步：根据经纬度获取详细地址
        const detailResponse = await fetch(`https://apimobile.meituan.com/group/v1/city/latlng/${lat},${lng}?tag=0`)
        const detailData = await detailResponse.json()
        
        // 组合结果
        const result = {
          ip: ip,
          location: {
            country: ipLocData.data.rgeo.country || '',
            province: ipLocData.data.rgeo.province || '',
            city: ipLocData.data.rgeo.city || '',
            district: ipLocData.data.rgeo.district || '',
            detail: detailData.data?.detail || '',
            lat: lat,
            lng: lng
          }
        }
        
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        })
      }
    }
    
    // 如果是获取客户端IP的请求
    if (url.pathname === '/api/clientip') {
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      '未知IP'
      
      return new Response(JSON.stringify({ ip: clientIP }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // 默认返回HTML页面
    return new Response(getHtmlContent(), {
      headers: { 'Content-Type': 'text/html' }
    })
  }
  
  function getHtmlContent() {
    return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IP溯源系统</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Helvetica Neue', Arial, sans-serif;
      }
      
      body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }
      
      .container {
        width: 100%;
        max-width: 800px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 30px;
        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: white;
      }
      
      h1 {
        text-align: center;
        margin-bottom: 30px;
        font-weight: 300;
        letter-spacing: 1px;
      }
      
      .input-group {
        display: flex;
        margin-bottom: 20px;
      }
      
      input {
        flex: 1;
        padding: 12px 15px;
        border: none;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(5px);
        border-radius: 10px 0 0 10px;
        color: white;
        font-size: 16px;
        outline: none;
      }
      
      input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      
      button {
        padding: 12px 25px;
        background: rgba(255, 255, 255, 0.25);
        border: none;
        border-radius: 0 10px 10px 0;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      button:hover {
        background: rgba(255, 255, 255, 0.35);
      }
      
      .result {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(5px);
        border-radius: 10px;
        padding: 20px;
        margin-top: 20px;
        display: none;
      }
      
      .result h2 {
        margin-bottom: 15px;
        font-weight: 300;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        padding-bottom: 10px;
      }
      
      .result p {
        margin-bottom: 10px;
        line-height: 1.6;
      }
      
      .result .address {
        font-weight: bold;
        margin-top: 15px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      }
      
      .loading {
        text-align: center;
        margin: 20px 0;
        display: none;
      }
      
      .loading span {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: white;
        margin: 0 5px;
        animation: loading 1.4s infinite ease-in-out both;
      }
      
      .loading span:nth-child(1) {
        animation-delay: -0.32s;
      }
      
      .loading span:nth-child(2) {
        animation-delay: -0.16s;
      }
      
      @keyframes loading {
        0%, 80%, 100% { 
          transform: scale(0);
        } 40% { 
          transform: scale(1.0);
        }
      }
      
      .error {
        color: #ff6b6b;
        text-align: center;
        margin: 20px 0;
        display: none;
      }
      
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 14px;
        opacity: 0.7;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>IP溯源系统</h1>
      
      <div class="input-group">
        <input type="text" id="ipInput" placeholder="输入IP地址，例如: 123.123.123.123">
        <button id="queryBtn">查询</button>
      </div>
      
      <div class="loading" id="loading">
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div class="error" id="error"></div>
      
      <div class="result" id="result">
        <h2>查询结果</h2>
        <p><strong>IP地址:</strong> <span id="resultIP"></span></p>
        <p><strong>国家:</strong> <span id="resultCountry"></span></p>
        <p><strong>省份:</strong> <span id="resultProvince"></span></p>
        <p><strong>城市:</strong> <span id="resultCity"></span></p>
        <p><strong>区县:</strong> <span id="resultDistrict"></span></p>
        <p><strong>经纬度:</strong> <span id="resultCoords"></span></p>
        <div class="address">
          <p><strong>详细地址:</strong> <span id="resultDetail"></span></p>
        </div>
      </div>
      
      <div class="footer">
        <p>© 2025 IP溯源系统 | 基于美团接口</p>
        <p>禁止将本服务用于侵犯他人隐私、网络攻击、商业爬取等非法用途，违规使用所导致的一切后果由使用者自行承担</p>
      </div>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', async () => {
        const ipInput = document.getElementById('ipInput');
        const queryBtn = document.getElementById('queryBtn');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const result = document.getElementById('result');
        
        // 自动获取用户当前IP
        try {
          const response = await fetch('/api/clientip');
          const data = await response.json();
          ipInput.value = data.ip;
          // 自动查询当前IP
          queryIP(data.ip);
        } catch (err) {
          console.error('获取客户端IP失败:', err);
        }
        
        queryBtn.addEventListener('click', () => {
          const ip = ipInput.value.trim();
          if (!ip) {
            showError('请输入有效的IP地址');
            return;
          }
          
          queryIP(ip);
        });
        
        async function queryIP(ip) {
          // 显示加载状态
          loading.style.display = 'block';
          error.style.display = 'none';
          result.style.display = 'none';
          
          try {
            const response = await fetch('/api/query', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ip })
            });
            
            const data = await response.json();
            
            if (data.error) {
              showError(data.error);
              return;
            }
            
            // 填充结果
            document.getElementById('resultIP').textContent = data.ip;
            document.getElementById('resultCountry').textContent = data.location.country || '未知';
            document.getElementById('resultProvince').textContent = data.location.province || '未知';
            document.getElementById('resultCity').textContent = data.location.city || '未知';
            document.getElementById('resultDistrict').textContent = data.location.district || '未知';
            document.getElementById('resultCoords').textContent = \`\${data.location.lat}, \${data.location.lng}\`;
            
            // 组合详细地址
            let detailAddress = \`\${data.location.country} \${data.location.province} \${data.location.city} \${data.location.district}\`;
            if (data.location.detail) {
              detailAddress += \` \${data.location.detail}\`;
            }
            document.getElementById('resultDetail').textContent = detailAddress;
            
            // 显示结果
            result.style.display = 'block';
          } catch (err) {
            showError('查询失败，请稍后重试');
            console.error('查询失败:', err);
          } finally {
            loading.style.display = 'none';
          }
        }
        
        function showError(message) {
          error.textContent = message;
          error.style.display = 'block';
          loading.style.display = 'none';
        }
      });
    </script>
  </body>
  </html>
    `;
  }
