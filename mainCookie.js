const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname
  if (pathname === '/') {
    fs.readFile(path.join(__dirname, './public/login.html'), (error, content) => {
      handleError(error, res)     
      res.setHeader('Content-Type', 'text/html')
      res.writeHead(200, 'OK')
      res.end(content)
    })
  }
  if (pathname === '/favicon.ico') {
    fs.readFile(path.join(__dirname, './public/favicon.ico'), (error, content) => {
      handleError(error, res)
      res.end(content)
    })
  }
  if (pathname === '/home') {
    if (hasCookie(req.headers.cookie, 'admin', 'yes')) {
      fs.readFile(path.join(__dirname, './public/home.html'), (error, content) => {
        handleError(error)
        res.setHeader('Content-Type', 'text/html')
        res.writeHead(200)
        res.end(content)
      })
    } else {
      redirect(res, '/')
    }
  }
  if (pathname === '/login') {
    if (hasBody(req)) {
      const buffers = []
      
      req.on('data', (chunk) => {
        buffers.push(chunk)
      })
      req.on('end', () => {
        req.rawBody = Buffer.concat(buffers).toString()
        handleLogin(req, res)
      })
    }
  }
}).listen(3000, '127.0.0.1', () => {
  console.log('A server is started on port 3000')
})


function handleLogin(req, res) {
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    let content = {}
    req.rawBody.split('&').forEach(item => {
      const items = item.split('=')
      content[items[0]] = items[1]
    })
    if (content['username'] === 'ccc' && content['password'] === 'xxx') {
      let cookies = []
      cookies.push(createCookie('admin', 'yes'))
      cookies.push(createCookie('hello', 'world', {
        maxAge: '600',
        httpOnly: true
      }))
      res.setHeader('Set-Cookie', cookies)
      redirect(res, '/home')
    } else {
      redirect(res, '/')
    }
    content = null
  } else {
    handleError(new Error('Not Found'))
  }
}

function hasBody(req) {
  return 'transfer-encoding' in req.headers || 'content-length' in req.headers
}

function handleError(error, res) {
  try {
    if (error) throw error
  } catch(error) {
    res.setHeader('Content-Type', 'text/html')
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>Document</title>
      </head>
      <body>
        <h1>${error.status}, ${error}</h1>
      </body>
      </html>
    `)
  }
}

function hasCookie(cookieStr, name, value) {
  if (!cookieStr) return false
  const cookieObj = parseCookie(cookieStr)
  return cookieObj[name] === value
}

function parseCookie(cookieStr) {
  const cookies = cookieStr.split('; ')
  const cookieObj = {}
  cookies.forEach(item => {
    const items = item.split('=')
    cookieObj[items[0]] = items[1]
  })
  return cookieObj
}

/**
 * @param     {String}    name
 * @param     {String}    value
 * @param     {plainObject}  opt
 *   @param      {String}  opts.maxAge
 *   @param      {String}  opts.path
 *   @param      {String}  opts.domain
 *   @param      {Date}  opts.expire
 *   @param      {Boolean} opts.httpOnly  
 *   @param      {Boolean}  opts.secure
 */
function createCookie(name, value, opts = {
  httpOnly: false,
  secure: false
}) {
  const cookieArr = [`${name}=${encodeURI(value)}`]
  if (opts.maxAge) cookieArr.push(`Max-Age=${opts.maxAge}`)
  if (opts.path) cookieArr.push(`Path=${opts.path}`)
  if (opts.domain) cookieArr.push(`Domain=${opts.domain}`)
  if (opts.expires) cookieArr.push(`Expires=${opts.expires.toUTCString}`)
  if (opts.httpOnly) cookieArr.push('HttpOnly')
  if (opts.secure) cookieArr.push('Secure')
  return cookieArr.join('; ')
}

/**
 * @param   {String}  url
 */
function redirect(res, url){
  res.setHeader('Location', url)
  res.writeHead(302)
  res.end()
}