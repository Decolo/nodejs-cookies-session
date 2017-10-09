test.addEventListener('click', (event) => {
  let bodyObj = {
    username: 'haha',
    password: 123
  }
  postLogin(bodyObj)
})

function postLogin(bodyObj){
  let xhr = new XMLHttpRequest()
  xhr.open('POST', '/login', true)
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  xhr.onload = (ret) => {
    if (xhr.responseText) {
      const result = JSON.parse(xhr.responseText)
      if (result.message === 'success') {
        document.querySelector('input[type=text]').value = ''
        document.querySelector('input[type=password]').value = ''
      }
    }
  }
  xhr.send(JSON.stringify(bodyObj))
}