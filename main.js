const express = require('express')
const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')

const server = http.createServer((request, response) => {
  const pathname = url.parse(request.url).pathname
  if (pathname === '/') {
    fs.readFile(path.join(__dirname, './public/index.html'), (error, content) => {
      handleError(error, response)
      response.end(content)
    })
  }
  if (pathname === '/favicon.ico') {
    fs.readFile(path.join(__dirname, './public/favicon.ico'), (error, content) => {
      handleError(error, response)
      response.end(content)
    })
  }
  if (pathname === '/login') {
    if (hasBody(request)) {
      const buffers = []
      request.on('data', (chunk) => {
        buffers.push(chunk)
      })
      request.on('end', () => {
        request.rawBody = Buffer.concat(buffers).toString()
        handlePost(request, response)
      })
    }
  }
  if (pathname === '/upload') {
    if (hasBody(request)) {
      equest.on('data', (chunk) => {
        console.log(chunk)
        // buffers.push(chunk)
      })
    }
  }
  if (pathname === '/index.js') {
    fs.readFile(path.join(__dirname, './public/index.js'), (error, content) => {
      handleError(error, response)
      response.end(content)
    })
  }
}).listen(3000, '127.0.0.1', () => {
    console.log('A server is started on port 3000')
})

function handlePost(req, res) {
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    const content = JSON.parse(req.rawBody)
    console.log(content)
  }
  res.end(JSON.stringify({
    status: 1,
    message: 'success'
  }))
}

function hasBody(req) {
  return 'transfer-encoding' in req.headers || 'content-length' in req.headers
}
function handleError(error, response) {
  try {
    if (error) throw error
  } catch(error) {
    responese.end('404', error)
  }
}