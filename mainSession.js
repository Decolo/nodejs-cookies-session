const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')
const sessions = {}
const KEY = 'session_id'
const EXPIRES = 15 * 60 * 1000
const md5 = require('md5')

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname
  if (pathname === '/') {
    staticPublic('login.html', 'utf8', res)
      .then(content => {
        res.setHeader('Content-Type', 'text/html')
        res.writeHead(200, 'OK')
        res.end(content)
      })
  }
  if (pathname === '/favicon.ico') {
    staticPublic('favicon.ico', undefined, res)
      .then(content => {
        res.writeHead(200, 'OK')
        res.end(content)
      })
  }
  if (pathname === '/home') {
    const cookieObj = parseCookie(req.headers.cookie)
    let token = cookieObj[KEY]
    if (sessions[token] && sessions[token].admin === 'yes' && sessions[token].expire >= new Date().getTime()) {
      staticPublic('home.html', 'utf-8', res)
        .then(content => {
          // 更新超时时间
          sessions[token].expire = new Date().getTime() + EXPIRES
          res.setHeader('Content-Type', 'text/html')
          res.writeHead(200)
          res.end(content)
        })
    } else {
      delete sessions[token]
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


function staticPublic(url, parseCode, res){
  const staticPath = path.resolve(process.cwd(), './public')
  const _path = path.resolve(staticPath, `${url}`)
  return new Promise((resolve, reject) => {
    fs.readFile(_path, parseCode, (error, content) => {
      if (error) {
        reject(error) 
      } else {
        resolve(content)
      }
    })
  }).catch(error => {
    handleError(error, res)
  })
}

function handleLogin(req, res) {
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    const content = {}
    req.rawBody.split('&').forEach(item => {
      const items = item.split('=')
      content[items[0]] = items[1]
    })
    if (content['username'] === 'ccc' && content['password'] === 'xxx') {
      let { id } = generateSession()
      let cookies = res.getHeader('Set-Cookie')
      cookies = Array.isArray(cookies) ? cookies.push(createCookie('session_id', id)) : createCookie('session_id', id)
      res.setHeader('Set-Cookie', cookies)
      redirect(res, '/home')
    } else {
      redirect(res, '/')
    }
  } else {
    handleError(new Error('Not Found'), res)
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

function parseCookie(cookieStr) {
  const cookies = cookieStr.split('; ')
  const cookieObj = {}
  cookies.forEach(item => {
    const items = item.split('=')
    cookieObj[items[0]] = items[1]
  })
  return cookieObj
}

function generateSession(){
  const session = {}
  session.id = md5(parseInt(Math.random() * 10000))
  session.admin = 'yes'
  session.expire = new Date().getTime() + EXPIRES
  // 映射
  sessions[session.id] = session
  return session
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