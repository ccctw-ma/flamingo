
const regex = /^(https.*)posts\/(\d)/;
console.log(regex.exec("https://jsonplaceholder.typicode.com/posts/2"));


const regex3 = new RegExp("https://jsonplaceholder.typicode.com/posts/3")
console.log(regex3.test("https://jsonplaceholder.typicode.com/posts/3"));
